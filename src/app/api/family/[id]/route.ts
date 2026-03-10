import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["PERSON", "PET"]).optional(),
  petType: z.string().max(100).optional().nullable(),
  bio: z.string().max(3000).optional().nullable(),
  birthdate: z.string().max(50).optional().nullable(),
  allergies: z.string().max(3000).optional().nullable(),
  medications: z.string().max(3000).optional().nullable(),
  dislikes: z.string().max(3000).optional().nullable(),
  thingsToKnow: z.string().max(3000).optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireHouseholdRole();
    const member = await prisma.familyMember.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const updated = await prisma.familyMember.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireHouseholdRole();
    const member = await prisma.familyMember.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.familyMember.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
