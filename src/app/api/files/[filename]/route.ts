import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  // Require an authenticated household session — no anonymous file access.
  try {
    await requireHouseholdRole();
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = params;

  // Sanitize filename — prevent path traversal attacks
  const sanitized = path.basename(filename);
  if (!sanitized || sanitized !== filename) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const storageProvider = process.env.STORAGE_PROVIDER || "local";

  // ── S3: generate a pre-signed URL and redirect ─────────────────────────────
  if (storageProvider === "s3") {
    try {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const client = new S3Client({
        region: process.env.AWS_REGION ?? "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: sanitized,
      });

      // Pre-signed URL valid for 1 hour — short enough to be secure, long
      // enough that it won't expire mid-page-view.
      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

      return NextResponse.redirect(signedUrl, { status: 302 });
    } catch (err) {
      console.error("[GET /api/files/[filename]] S3 pre-sign failed:", err);
      return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
    }
  }

  // ── Local storage (dev) ────────────────────────────────────────────────────
  const uploadsDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadsDir, sanitized);

  // Ensure the resolved path is within uploads directory
  const resolvedPath = path.resolve(filePath);
  const resolvedUploads = path.resolve(uploadsDir);

  if (!resolvedPath.startsWith(resolvedUploads + path.sep)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(resolvedPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(resolvedPath);
    const ext = path.extname(sanitized).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${sanitized}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/files/[filename]]", err);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}
