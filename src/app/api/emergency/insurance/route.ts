import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  carrier: z.string().max(200).optional().nullable(),
  policyNumber: z.string().max(200).optional().nullable(),
  groupNumber: z.string().max(200).optional().nullable(),
  memberName: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
});

export async function GET() {
  try {
    const auth = await requireHouseholdRole();
    const insurance = await prisma.emergencyInsurance.findUnique({
      where: { householdId: auth.householdId },
    });
    return NextResponse.json(insurance ?? null);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const insurance = await prisma.emergencyInsurance.upsert({
      where: { householdId: auth.householdId },
      update: parsed.data,
      create: { householdId: auth.householdId, ...parsed.data },
    });
    return NextResponse.json(insurance);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to save insurance" }, { status: 500 });
  }
}
