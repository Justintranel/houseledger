import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/approvals/[id]/receipts — upload a receipt file */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hid = session.user.householdId;
  const requestId = params.id;

  try {
    // Verify the purchase request belongs to this household
    const purchaseRequest = await prisma.purchaseRequest.findFirst({
      where: { id: requestId, householdId: hid },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only images (JPEG, PNG, WebP, GIF) and PDFs are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (10 MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be smaller than 10 MB" }, { status: 400 });
    }

    // Upload file using storage abstraction
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(buffer, file.name, file.type);

    // Save receipt record
    const receipt = await prisma.receipt.create({
      data: {
        requestId,
        fileUrl: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize,
      },
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (err) {
    console.error("[POST /api/approvals/[id]/receipts]", err);
    return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 });
  }
}
