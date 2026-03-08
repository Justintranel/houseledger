import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  question: z.string().min(1).max(1000),
});

const patchSchema = z.object({
  id: z.string().min(1),
  answer: z.string().min(1).max(5000),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const questions = await prisma.question.findMany({
      where: { householdId: hid },
      orderBy: { createdAt: "desc" },
      include: {
        asker: { select: { id: true, name: true } },
        answeredBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(questions);
  } catch (err) {
    console.error("[GET /api/questions]", err);
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const userId = (session.user as any).id as string;

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const question = await prisma.question.create({
      data: {
        householdId: hid,
        askerId: userId,
        question: parsed.data.question,
        status: "OPEN",
      },
      include: {
        asker: { select: { id: true, name: true } },
        answeredBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (err) {
    console.error("[POST /api/questions]", err);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { id, answer } = parsed.data;

    // Verify question belongs to household
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question || question.householdId !== hid) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        answer,
        status: "ANSWERED",
        answeredAt: new Date(),
        answeredById: userId,
      },
      include: {
        asker: { select: { id: true, name: true } },
        answeredBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/questions]", err);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}
