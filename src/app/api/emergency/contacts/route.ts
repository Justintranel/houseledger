import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(200),
  relationship: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  try {
    const auth = await requireHouseholdRole();
    const contacts = await prisma.emergencyContact.findMany({
      where: { householdId: auth.householdId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(contacts);
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

    const max = await prisma.emergencyContact.findFirst({
      where: { householdId: auth.householdId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const contact = await prisma.emergencyContact.create({
      data: { householdId: auth.householdId, ...parsed.data, sortOrder: (max?.sortOrder ?? 0) + 1 },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
