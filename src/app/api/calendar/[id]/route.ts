import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  allDay: z.boolean().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "calendar:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.familyEvent.findFirst({ where: { id: params.id, householdId: auth.householdId } });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const { startDate, endDate, ...rest } = parsed.data;
    const updated = await prisma.familyEvent.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(startDate ? { startDate: new Date(startDate + "T12:00:00") } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate + "T12:00:00") : null } : {}),
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/calendar/[id]]", err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "calendar:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.familyEvent.findFirst({ where: { id: params.id, householdId: auth.householdId } });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.familyEvent.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/calendar/[id]]", err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
