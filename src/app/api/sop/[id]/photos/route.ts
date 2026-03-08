import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;
  const role = (session.user as any).role as string;
  if (role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const sop = await prisma.houseSOP.findUnique({ where: { id: params.id } });
    if (!sop || sop.householdId !== hid)
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
    console.error("[POST /api/sop/[id]/photos]", err);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
