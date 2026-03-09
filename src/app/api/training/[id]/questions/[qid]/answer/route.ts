import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — upsert an answer to a question
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; qid: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    const q = await prisma.trainingVideoQuestion.findFirst({
      where: { id: params.qid, video: { householdId: auth.householdId } },
    });
    if (!q)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = z.object({ answer: z.string().min(1).max(5000) }).safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Answer cannot be empty" }, { status: 400 });

    const answer = await prisma.trainingVideoAnswer.upsert({
      where: { questionId_userId: { questionId: params.qid, userId: auth.userId } },
      create: {
        questionId: params.qid,
        userId: auth.userId,
        answer: parsed.data.answer,
      },
      update: { answer: parsed.data.answer },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(answer);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
