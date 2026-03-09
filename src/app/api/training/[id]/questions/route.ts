import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — list questions + answers for a video
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    const video = await prisma.trainingVideo.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!video)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const questions = await prisma.trainingVideoQuestion.findMany({
      where: { videoId: params.id },
      orderBy: { sortOrder: "asc" },
      include: {
        answers: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(questions);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }
}

const postSchema = z.object({
  question: z.string().min(1).max(1000),
});

// POST — add a question (OWNER/FAMILY only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    if (auth.role !== "OWNER" && auth.role !== "FAMILY")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const video = await prisma.trainingVideo.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!video)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const maxOrder = await prisma.trainingVideoQuestion.aggregate({
      where: { videoId: params.id },
      _max: { sortOrder: true },
    });

    const question = await prisma.trainingVideoQuestion.create({
      data: {
        videoId: params.id,
        question: parsed.data.question,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: {
        answers: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}
