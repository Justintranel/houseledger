import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  type: z.enum(["PERSON", "PET"]),
  name: z.string().min(1).max(200),
  petType: z.string().max(100).optional().nullable(),
  bio: z.string().max(3000).optional().nullable(),
  birthdate: z.string().max(50).optional().nullable(),
  allergies: z.string().max(3000).optional().nullable(),
  medications: z.string().max(3000).optional().nullable(),
  dislikes: z.string().max(3000).optional().nullable(),
  thingsToKnow: z.string().max(3000).optional().nullable(),
});

export async function GET() {
  try {
    const auth = await requireHouseholdRole();
    const members = await prisma.familyMember.findMany({
      where: { householdId: auth.householdId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(members);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const max = await prisma.familyMember.findFirst({
      where: { householdId: auth.householdId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const member = await prisma.familyMember.create({
      data: {
        householdId: auth.householdId,
        ...parsed.data,
        sortOrder: (max?.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/family]", err);
    return NextResponse.json({ error: "Failed to create family member" }, { status: 500 });
  }
}
