import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  category: z.string().min(1).max(100),
  prompt: z.string().min(1).max(500),
  ownerOnly: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;
  const role = (session.user as any).role as string;
  if (role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid" }, { status: 400 });
    const maxQ = await prisma.houseProfileQuestion.findFirst({
      where: { category: parsed.data.category },
      orderBy: { sortOrder: "desc" },
    });
    const question = await prisma.houseProfileQuestion.create({
      data: { category: parsed.data.category, prompt: parsed.data.prompt, ownerOnly: parsed.data.ownerOnly, sortOrder: (maxQ?.sortOrder ?? 0) + 1, householdId: hid },
    });
    return NextResponse.json(question, { status: 201 });
  } catch (err) {
    console.error("[POST /api/profile/question]", err);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
