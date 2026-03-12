import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { QUESTIONS } from "../../../../../prisma/profile-questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden — must be logged in as OWNER" }, { status: 403 });
  }

  let upserted = 0;
  for (const q of QUESTIONS) {
    await prisma.houseProfileQuestion.upsert({
      where: { id: q.id },
      update: { category: q.category, sortOrder: q.sortOrder, ownerOnly: q.ownerOnly, prompt: q.prompt },
      create: q,
    });
    upserted++;
  }

  return NextResponse.json({ ok: true, upserted, total: QUESTIONS.length });
}
