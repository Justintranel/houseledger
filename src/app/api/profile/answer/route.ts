import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as "OWNER" | "FAMILY" | "MANAGER";
  const userId = (session.user as any).id as string;

  if (role !== "OWNER" && role !== "FAMILY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
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
          householdId: hid,
          questionId,
        },
      },
      create: {
        householdId: hid,
        questionId,
        answer,
        userId,
      },
      update: {
        answer,
        userId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(savedAnswer);
  } catch (err) {
    console.error("[POST /api/profile/answer]", err);
    return NextResponse.json(
      { error: "Failed to save answer" },
      { status: 500 }
    );
  }
}
