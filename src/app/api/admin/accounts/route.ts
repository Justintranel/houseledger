import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin, AdminAuthError } from "@/server/auth/requireSuperAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // filter by accountStatus
    const search = searchParams.get("q");       // search by household name or email

    const households = await prisma.household.findMany({
      where: {
        ...(status ? { accountStatus: status as any } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { billingEmail: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: {
          select: { supportTickets: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = households.map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      createdAt: h.createdAt,
      accountStatus: h.accountStatus,
      subscriptionPlan: h.subscriptionPlan,
      subscriptionStatus: h.subscriptionStatus,
      stripeCustomerId: h.stripeCustomerId,
      billingEmail: h.billingEmail,
      trialEndsAt: h.trialEndsAt,
      suspendedAt: h.suspendedAt,
      suspendedReason: h.suspendedReason,
      canceledAt: h.canceledAt,
      adminNote: h.adminNote,
      onboardingCompleted: h.onboardingCompleted,
      openTickets: h._count.supportTickets,
      members: h.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    }));

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/admin/accounts]", err);
    return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 });
  }
}
