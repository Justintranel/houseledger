import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name:               z.string().min(1).max(200).optional(),
  type:               z.enum(["PERSON", "PET"]).optional(),
  petType:            z.string().max(100).optional().nullable(),
  // Shared
  bio:                z.string().max(5000).optional().nullable(),
  birthdate:          z.string().max(50).optional().nullable(),
  height:             z.string().max(50).optional().nullable(),
  weight:             z.string().max(50).optional().nullable(),
  bloodType:          z.string().max(20).optional().nullable(),
  allergies:          z.string().max(5000).optional().nullable(),
  medications:        z.string().max(5000).optional().nullable(),
  dietaryRestrictions:z.string().max(5000).optional().nullable(),
  dislikes:           z.string().max(5000).optional().nullable(),
  thingsToKnow:       z.string().max(5000).optional().nullable(),
  favoriteFood:       z.string().max(3000).optional().nullable(),
  // Person: school
  school:             z.string().max(200).optional().nullable(),
  grade:              z.string().max(50).optional().nullable(),
  teacher:            z.string().max(200).optional().nullable(),
  activities:         z.string().max(3000).optional().nullable(),
  // Person: medical
  doctor:             z.string().max(300).optional().nullable(),
  dentist:            z.string().max(300).optional().nullable(),
  // Person: travel
  passportNumber:     z.string().max(50).optional().nullable(),
  passportExpiry:     z.string().max(50).optional().nullable(),
  passportCountry:    z.string().max(100).optional().nullable(),
  tsaPrecheck:        z.string().max(100).optional().nullable(),
  globalEntry:        z.string().max(100).optional().nullable(),
  nexus:              z.string().max(100).optional().nullable(),
  frequentFlyer:      z.string().max(3000).optional().nullable(),
  seatPreference:     z.string().max(50).optional().nullable(),
  mealPreference:     z.string().max(200).optional().nullable(),
  // Pet
  breed:              z.string().max(100).optional().nullable(),
  vet:                z.string().max(300).optional().nullable(),
  microchip:          z.string().max(100).optional().nullable(),
  feedingSchedule:    z.string().max(3000).optional().nullable(),
  walkSchedule:       z.string().max(3000).optional().nullable(),
  vaccinations:       z.string().max(3000).optional().nullable(),
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
