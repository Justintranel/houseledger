import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "houseprofile:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Verify the photo belongs to this household's SOP (atomic check via relation)
    const photo = await prisma.houseSOPPhoto.findFirst({
      where: {
        id: params.photoId,
        sopId: params.id,
        sop: { householdId: auth.householdId },
      },
    });
    if (!photo)
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    await prisma.houseSOPPhoto.delete({ where: { id: params.photoId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/sop/[id]/photos/[photoId]]", err);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "houseprofile:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const photo = await prisma.houseSOPPhoto.findFirst({
      where: {
        id: params.photoId,
        sopId: params.id,
        sop: { householdId: auth.householdId },
      },
    });
    if (!photo)
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
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/sop/[id]/photos/[photoId]]", err);
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
  }
}
