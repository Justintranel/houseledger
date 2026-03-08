/**
 * Storage abstraction — swap STORAGE_PROVIDER env var to change backend.
 * local: saves files to /uploads in project root (dev only)
 * s3:    uses S3-compatible API (add AWS SDK + env vars for production)
 */
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  _mimeType: string
): Promise<UploadResult> {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "s3") {
    // TODO: implement S3 upload using @aws-sdk/client-s3
    // const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    // const client = new S3Client({ region: process.env.AWS_REGION });
    // ...
    throw new Error("S3 storage not yet configured. Set STORAGE_PROVIDER=local for dev.");
  }

  // ── Local storage ──────────────────────────────────────────────────────────
  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(originalName);
  const fileName = `${uuid()}${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  await writeFile(filePath, buffer);

  return {
    url: `/api/files/${fileName}`,
    fileName: originalName,
    fileSize: buffer.length,
  };
}

export function getFileUrl(storedName: string): string {
  const provider = process.env.STORAGE_PROVIDER || "local";
  if (provider === "s3") {
    return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${storedName}`;
  }
  return `/api/files/${storedName}`;
}
