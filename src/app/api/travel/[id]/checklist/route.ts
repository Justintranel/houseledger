import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function verifyTripOwnership(travelPlanId: string, householdId: string) {
  return prisma.travelPlan.findFirst({ where: { id: travelPlanId, householdId } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "travel:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const plan = await verifyTripOwnership(params.id, auth.householdId);
    if (!plan) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const body = await req.json();
    const parsed = z.object({ item: z.string().min(1).max(500) }).safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const agg = await prisma.travelChecklistItem.aggregate({
      where: { travelPlanId: params.id },
      _max: { sortOrder: true },
    });
    const nextOrder = (agg._max.sortOrder ?? -1) + 1;

    const item = await prisma.travelChecklistItem.create({
      data: { travelPlanId: params.id, item: parsed.data.item, sortOrder: nextOrder },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/travel/[id]/checklist]", err);
    return NextResponse.json({ error: "Failed to add checklist item" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "travel:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = z.object({ itemId: z.string().min(1), completed: z.boolean() }).safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const existing = await prisma.travelChecklistItem.findFirst({
      where: { id: parsed.data.itemId, travelPlan: { householdId: auth.householdId } },
    });
    if (!existing)
      return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const updated = await prisma.travelChecklistItem.update({
      where: { id: parsed.data.itemId },
      data: { completed: parsed.data.completed },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/travel/[id]/checklist]", err);
    return NextResponse.json({ error: "Failed to update checklist item" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "travel:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const existing = await prisma.travelChecklistItem.findFirst({
      where: { id: itemId, travelPlan: { householdId: auth.householdId } },
    });
    if (!existing)
      return NextResponse.json({ error: "Item not found" }, { status: 404 });

    await prisma.travelChecklistItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/travel/[id]/checklist]", err);
    return NextResponse.json({ error: "Failed to delete checklist item" }, { status: 500 });
  }
}
