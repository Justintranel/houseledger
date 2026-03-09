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

  // Only serve files if using local storage (default when STORAGE_PROVIDER is unset)
  const storageProvider = process.env.STORAGE_PROVIDER || "local";
  if (storageProvider !== "local") {
    return NextResponse.json(
      { error: "Local file serving is not enabled" },
      { status: 404 }
    );
  }

  const { filename } = params;

  // Sanitize filename — prevent path traversal attacks
  const sanitized = path.basename(filename);
  if (!sanitized || sanitized !== filename) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

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
