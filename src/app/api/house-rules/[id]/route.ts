import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireHouseholdRole();
    const rule = await prisma.houseRule.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const schema = z.object({ rule: z.string().min(1).max(1000) });
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const updated = await prisma.houseRule.update({
      where: { id: params.id },
      data: { rule: parsed.data.rule },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireHouseholdRole();
    const rule = await prisma.houseRule.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.houseRule.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
