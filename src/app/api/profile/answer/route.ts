import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "houseprofile:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { questionId, answer } = parsed.data;

    // Verify the question exists
    const question = await prisma.houseProfileQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Upsert the answer for this household + question combo
    const savedAnswer = await prisma.houseProfileAnswer.upsert({
      where: {
        householdId_questionId: {
          householdId: auth.householdId,
          questionId,
        },
      },
      create: {
        householdId: auth.householdId,
        questionId,
        answer,
        userId: auth.userId,
      },
      update: {
        answer,
        userId: auth.userId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(savedAnswer);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/profile/answer]", err);
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
