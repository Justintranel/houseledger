import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;
  const role = (session.user as any).role as string;
  if (role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Verify the photo belongs to this household's SOP
    const photo = await prisma.houseSOPPhoto.findUnique({
      where: { id: params.photoId },
      include: { sop: true },
    });

    if (!photo || photo.sop.householdId !== hid || photo.sopId !== params.id)
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    await prisma.houseSOPPhoto.delete({ where: { id: params.photoId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/sop/[id]/photos/[photoId]]", err);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;
  const role = (session.user as any).role as string;
  if (role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const photo = await prisma.houseSOPPhoto.findUnique({
      where: { id: params.photoId },
      include: { sop: true },
    });

    if (!photo || photo.sop.householdId !== hid || photo.sopId !== params.id)
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    const body = await req.json();
    const updated = await prisma.houseSOPPhoto.update({
      where: { id: params.photoId },
      data: {
        ...(body.caption !== undefined && { caption: body.caption || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/sop/[id]/photos/[photoId]]", err);
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
  }
}
