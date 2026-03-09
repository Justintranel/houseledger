import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  destination: z.string().max(300).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  budgetCents: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  status: z.enum(["PLANNING", "BOOKED", "COMPLETED"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    const plan = await prisma.travelPlan.findFirst({
      where: { id: params.id, householdId: auth.householdId },
      include: { checklist: { orderBy: { sortOrder: "asc" } } },
    });
    if (!plan)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(plan);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to load trip" }, { status: 500 });
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

    const plan = await prisma.travelPlan.findFirst({ where: { id: params.id, householdId: auth.householdId } });
    if (!plan)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const { startDate, endDate, ...rest } = parsed.data;
    const updated = await prisma.travelPlan.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate + "T12:00:00") : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate + "T12:00:00") : null } : {}),
      },
      include: { checklist: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/travel/[id]]", err);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "travel:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const plan = await prisma.travelPlan.findFirst({ where: { id: params.id, householdId: auth.householdId } });
    if (!plan)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.travelPlan.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/travel/[id]]", err);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}
