import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();

    const members = await prisma.householdMember.findMany({
      where: {
        householdId: auth.householdId,
        role: "MANAGER",
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const result = members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
    }));

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/reviews/managers]", err);
    return NextResponse.json({ error: "Failed to load managers" }, { status: 500 });
  }
}
