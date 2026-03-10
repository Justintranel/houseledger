import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireHouseholdRole();
    const rules = await prisma.houseRule.findMany({
      where: { householdId: auth.householdId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(rules);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const schema = z.object({ rule: z.string().min(1).max(1000) });
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const max = await prisma.houseRule.findFirst({
      where: { householdId: auth.householdId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const rule = await prisma.houseRule.create({
      data: {
        householdId: auth.householdId,
        rule: parsed.data.rule,
        sortOrder: (max?.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to add rule" }, { status: 500 });
  }
}
