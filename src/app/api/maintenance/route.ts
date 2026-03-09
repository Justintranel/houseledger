import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const itemFields = {
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  intervalDays: z.number().int().min(1).optional().nullable(),
  lastDoneAt: z.string().datetime().optional().nullable(),
  nextDueAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
};

const postSchema = z.object(itemFields);
const patchSchema = z.object({ id: z.string().min(1), ...itemFields }).partial({ title: true, category: true });

export async function GET() {
  try {
    const auth = await requireHouseholdRole();
    const items = await prisma.maintenanceItem.findMany({
      where: { householdId: auth.householdId },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(items);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const { title, category, intervalDays, lastDoneAt, nextDueAt, notes } = parsed.data;
    const item = await prisma.maintenanceItem.create({
      data: {
        householdId: auth.householdId,
        title,
        category,
        intervalDays: intervalDays ?? null,
        lastDoneAt: lastDoneAt ? new Date(lastDoneAt) : null,
        nextDueAt: nextDueAt ? new Date(nextDueAt) : null,
        notes: notes ?? null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/maintenance]", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const { id, ...fields } = parsed.data;
    const existing = await prisma.maintenanceItem.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.householdId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Convert date strings
    const data: Record<string, unknown> = { ...fields };
    if ("lastDoneAt" in fields) data.lastDoneAt = fields.lastDoneAt ? new Date(fields.lastDoneAt as string) : null;
    if ("nextDueAt" in fields) data.nextDueAt = fields.nextDueAt ? new Date(fields.nextDueAt as string) : null;

    const updated = await prisma.maintenanceItem.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/maintenance]", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await prisma.maintenanceItem.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.householdId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.maintenanceItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
