/**
 * Storage abstraction — swap STORAGE_PROVIDER env var to change backend.
 *
 * STORAGE_PROVIDER=local  (default) — saves files to /uploads in project root (dev only)
 * STORAGE_PROVIDER=s3               — uploads to AWS S3 using env vars:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION         (e.g. "us-east-1")
 *   S3_BUCKET          (bucket name)
 *   S3_PUBLIC_URL      (optional — custom CDN/CloudFront URL, e.g. "https://cdn.yourdomain.com")
 *                       If omitted, falls back to standard S3 URL.
 */
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

export interface UploadResult {
  url: string;       // public-accessible URL stored in the DB
  fileName: string;  // original file name (for display)
  fileSize: number;  // bytes
}

// ─── S3 helpers ───────────────────────────────────────────────────────────────

async function uploadToS3(buffer: Buffer, key: string, mimeType: string): Promise<void> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Files are private by default — served via authenticated /api/files proxy or pre-signed URLs
    }),
  );
}

// ─── Main upload function ─────────────────────────────────────────────────────

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<UploadResult> {
  const provider = process.env.STORAGE_PROVIDER || "local";
  const ext = path.extname(originalName);
  const key = `${uuid()}${ext}`;

  if (provider === "s3") {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET) {
      throw new Error(
        "S3 is not fully configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and S3_BUCKET.",
      );
    }

    await uploadToS3(buffer, key, mimeType);

    // Serve files through the /api/files proxy so they work even on private buckets.
    // The proxy generates a short-lived pre-signed URL and redirects the browser.
    return {
      url: `/api/files/${key}`,
      fileName: originalName,
      fileSize: buffer.length,
    };
  }

  // ── Local storage (dev) ────────────────────────────────────────────────────
  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, key);
  await writeFile(filePath, buffer);

  return {
    url: `/api/files/${key}`,
    fileName: originalName,
    fileSize: buffer.length,
  };
}

// ─── Delete a file ────────────────────────────────────────────────────────────

export async function deleteFile(storedUrl: string): Promise<void> {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "s3") {
    // Extract the key from the URL
    const key = storedUrl.split("/").pop();
    if (!key) return;

    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      }),
    );
    return;
  }

  // Local: delete from uploads dir
  const { unlink } = await import("fs/promises");
  const fileName = storedUrl.replace("/api/files/", "");
  const filePath = path.join(process.cwd(), "uploads", path.basename(fileName));
  try {
    await unlink(filePath);
  } catch {
    // File already gone — not an error
  }
}
