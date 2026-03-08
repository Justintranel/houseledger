import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as "OWNER" | "FAMILY" | "MANAGER";

  try {
    const questionsWhere: Record<string, unknown> = {};

    // MANAGERs cannot see ownerOnly questions
    if (role === "MANAGER") {
      questionsWhere.ownerOnly = false;
    }

    const questions = await prisma.houseProfileQuestion.findMany({
      where: questionsWhere,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      include: {
        answers: {
          where: { householdId: hid },
          take: 1,
        },
      },
    });

    const result = questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      category: q.category,
      ownerOnly: q.ownerOnly,
      answer: q.answers[0] ?? null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/profile]", err);
    return NextResponse.json(
      { error: "Failed to load profile questions" },
      { status: 500 }
    );
  }
}
