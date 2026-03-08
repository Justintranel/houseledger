import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin, AdminAuthError } from "@/server/auth/requireSuperAdmin";
import { startOfMonth, subMonths } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_PRICE: Record<string, number> = {
  standard: 99,
  premium: 149,
};

export async function GET() {
  try {
    await requireSuperAdmin();

    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    // ── Account counts ──────────────────────────────────────────────────────
    const [
      totalHouseholds,
      activeHouseholds,
      trialingHouseholds,
      pastDueHouseholds,
      suspendedHouseholds,
      canceledHouseholds,
      newThisMonth,
      canceledThisMonth,
    ] = await Promise.all([
      prisma.household.count(),
      prisma.household.count({ where: { accountStatus: "ACTIVE" } }),
      prisma.household.count({ where: { accountStatus: "TRIALING" } }),
      prisma.household.count({ where: { accountStatus: "PAST_DUE" } }),
      prisma.household.count({ where: { accountStatus: "SUSPENDED" } }),
      prisma.household.count({ where: { accountStatus: "CANCELED" } }),
      prisma.household.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.household.count({
        where: {
          accountStatus: "CANCELED",
          canceledAt: { gte: startOfThisMonth },
        },
      }),
    ]);

    // ── User counts ─────────────────────────────────────────────────────────
    const [totalUsers, totalOwners, totalManagers, totalAdmins] = await Promise.all([
      prisma.user.count({ where: { isSuperAdmin: false } }),
      prisma.householdMember.count({ where: { role: "OWNER" } }),
      prisma.householdMember.count({ where: { role: "MANAGER" } }),
      prisma.user.count({ where: { isSuperAdmin: true } }),
    ]);

    // ── MRR / ARR (from DB, not Stripe — placeholder until webhook enriches data) ──
    const paidHouseholds = await prisma.household.findMany({
      where: { accountStatus: "ACTIVE" },
      select: { subscriptionPlan: true },
    });
    const mrr = paidHouseholds.reduce((sum, h) => {
      return sum + (PLAN_PRICE[h.subscriptionPlan ?? "standard"] ?? 99);
    }, 0);
    const arr = mrr * 12;

    // ── Recent clients (last 8 accounts, with owner info) ───────────────────
    const recentHouseholds = await prisma.household.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        accountStatus: true,
        subscriptionPlan: true,
        createdAt: true,
        members: {
          where: { role: "OWNER" },
          take: 1,
          select: {
            user: { select: { name: true, email: true } },
          },
        },
        _count: { select: { members: true } },
      },
    });

    const recentClients = recentHouseholds.map((h) => ({
      id: h.id,
      householdName: h.name,
      ownerName: h.members[0]?.user.name ?? "—",
      ownerEmail: h.members[0]?.user.email ?? "—",
      accountStatus: h.accountStatus,
      subscriptionPlan: h.subscriptionPlan,
      memberCount: h._count.members,
      createdAt: h.createdAt.toISOString(),
    }));

    // ── Support tickets ─────────────────────────────────────────────────────
    const [openTickets, totalTickets] = await Promise.all([
      prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.supportTicket.count(),
    ]);

    // ── Growth (new accounts this vs last month) ────────────────────────────
    const newLastMonth = await prisma.household.count({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
    });
    const growthPct =
      newLastMonth > 0
        ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
        : newThisMonth > 0
        ? 100
        : 0;

    // ── Churn rate (canceled this month / total last month) ─────────────────
    const householdsLastMonth = await prisma.household.count({
      where: { createdAt: { lt: startOfThisMonth } },
    });
    const churnRate =
      householdsLastMonth > 0
        ? Math.round((canceledThisMonth / householdsLastMonth) * 100 * 10) / 10
        : 0;

    // ── Estimated LTV ($99 * avg tenure months) — simple estimate ───────────
    const avgTenureMonths = totalHouseholds > 0 ? 14 : 0; // placeholder until we have real data
    const ltv = avgTenureMonths * 99;

    return NextResponse.json({
      accounts: {
        total: totalHouseholds,
        active: activeHouseholds,
        trialing: trialingHouseholds,
        pastDue: pastDueHouseholds,
        suspended: suspendedHouseholds,
        canceled: canceledHouseholds,
        newThisMonth,
        canceledThisMonth,
      },
      users: {
        total: totalUsers,
        owners: totalOwners,
        managers: totalManagers,
        admins: totalAdmins,
      },
      billing: {
        mrr,
        arr,
        ltv,
        growthPct,
        churnRate,
      },
      support: {
        openTickets,
        totalTickets,
      },
      recentClients,
    });
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
