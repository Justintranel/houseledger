import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["HOSPITAL", "VET"]),
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  distance: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isPreferred: z.boolean().optional(),
});

export async function GET() {
  try {
    const auth = await requireHouseholdRole();
    const facilities = await prisma.emergencyFacility.findMany({
      where: { householdId: auth.householdId },
      orderBy: [{ isPreferred: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(facilities);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const max = await prisma.emergencyFacility.findFirst({
      where: { householdId: auth.householdId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const facility = await prisma.emergencyFacility.create({
      data: { householdId: auth.householdId, ...parsed.data, sortOrder: (max?.sortOrder ?? 0) + 1 },
    });
    return NextResponse.json(facility, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to create facility" }, { status: 500 });
  }
}
