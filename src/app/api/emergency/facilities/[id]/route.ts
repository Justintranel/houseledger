import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  type: z.enum(["HOSPITAL", "VET"]).optional(),
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  distance: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isPreferred: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireHouseholdRole();
    const item = await prisma.emergencyFacility.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const updated = await prisma.emergencyFacility.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireHouseholdRole();
    const item = await prisma.emergencyFacility.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.emergencyFacility.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
