import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "houseprofile:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sop = await prisma.houseSOP.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!sop)
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file");
    const caption = formData.get("caption");

    if (!file || !(file instanceof File))
      return NextResponse.json({ error: "File is required" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadFile(buffer, file.name, file.type);

    // Get next sortOrder
    const maxPhoto = await prisma.houseSOPPhoto.findFirst({
      where: { sopId: params.id },
      orderBy: { sortOrder: "desc" },
    });

    const photo = await prisma.houseSOPPhoto.create({
      data: {
        sopId: params.id,
        fileUrl: uploadResult.url,
        fileName: file.name,
        caption: caption && typeof caption === "string" ? caption.trim() || null : null,
        sortOrder: (maxPhoto?.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/sop/[id]/photos]", err);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
