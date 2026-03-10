import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  relationship: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireHouseholdRole();
    const item = await prisma.emergencyContact.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const updated = await prisma.emergencyContact.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireHouseholdRole();
    const item = await prisma.emergencyContact.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.emergencyContact.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
