import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — mark video as watched
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    const video = await prisma.trainingVideo.findUnique({ where: { id: params.id } });
    if (!video || video.householdId !== auth.householdId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const progress = await prisma.trainingVideoProgress.upsert({
      where: { videoId_userId: { videoId: params.id, userId: auth.userId } },
      create: {
        videoId: params.id,
        userId: auth.userId,
        householdId: auth.householdId,
        completedAt: new Date(),
      },
      update: { completedAt: new Date() },
    });

    return NextResponse.json(progress);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/training/[id]/complete]", err);
    return NextResponse.json({ error: "Failed to mark as watched" }, { status: 500 });
  }
}

// DELETE — unmark video as watched
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    await prisma.trainingVideoProgress.deleteMany({
      where: { videoId: params.id, userId: auth.userId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
