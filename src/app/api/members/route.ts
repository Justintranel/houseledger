/**
 * GET /api/members — list all household members (for DM user picker, etc.)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const members = await prisma.householdMember.findMany({
      where: { householdId: hid },
      include: {
        user: { select: { id: true, name: true, email: true, profileImageUrl: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json(
      members.map((m) => ({
        memberId: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        profileImageUrl: m.user.profileImageUrl ?? null,
      }))
    );
  } catch (err) {
    console.error("[GET /api/members]", err);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
