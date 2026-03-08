import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  url: z.string().url().min(1),
});

export async function GET() {
  try {
    const auth = await requireHouseholdRole();

    const videos = await prisma.trainingVideo.findMany({
      where: { householdId: auth.householdId },
      orderBy: { sortOrder: "asc" },
      include: {
        progress: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        questions: {
          orderBy: { sortOrder: "asc" },
          include: {
            answers: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(videos);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/training]", err);
    return NextResponse.json({ error: "Failed to load training videos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();

    if (auth.role !== "OWNER" && auth.role !== "FAMILY")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );

    // Place at end of list
    const maxOrder = await prisma.trainingVideo.aggregate({
      where: { householdId: auth.householdId },
      _max: { sortOrder: true },
    });
    const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const video = await prisma.trainingVideo.create({
      data: {
        householdId: auth.householdId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        url: parsed.data.url,
        sortOrder: nextOrder,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/training]", err);
    return NextResponse.json({ error: "Failed to create training video" }, { status: 500 });
  }
}
