import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { requireSuperAdmin, AdminAuthError } from "@/server/auth/requireSuperAdmin";

/** Map Stripe subscription status → our AccountStatus enum value */
function mapStripeStatus(s: string): string {
  const map: Record<string, string> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    unpaid: "UNPAID",
    canceled: "CANCELED",
    paused: "SUSPENDED",
    incomplete: "TRIALING",
    incomplete_expired: "CANCELED",
  };
  return map[s] ?? "ACTIVE";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — full account detail
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireSuperAdmin();

    const household = await prisma.household.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true, subject: true, status: true, priority: true, createdAt: true,
            submittedBy: { select: { name: true, email: true } },
          },
        },
        _count: {
          select: {
            taskInstances: true,
            timeEntries: true,
            supportTickets: true,
          },
        },
      },
    });

    if (!household)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(household);
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to load account" }, { status: 500 });
  }
}

const patchSchema = z.object({
  accountStatus: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "UNPAID", "CANCELED", "SUSPENDED"]).optional(),
  trialEndsAt: z.string().optional().nullable(),
  suspendedReason: z.string().max(1000).optional().nullable(),
  adminNote: z.string().max(5000).optional().nullable(),
  billingEmail: z.string().email().optional().nullable(),
  // Community tab branding
  communityLabel: z.string().max(80).optional().nullable(),
  communityUrl: z.string().url().max(500).optional().nullable(),
  action: z.enum(["SUSPEND", "REACTIVATE", "CANCEL", "EXTEND_TRIAL", "SYNC_STRIPE"]).optional(),
});

// PATCH — update account status / admin controls
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireSuperAdmin();

    const household = await prisma.household.findUnique({ where: { id: params.id } });
    if (!household)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const { action, ...rest } = parsed.data;

    const updateData: Record<string, any> = {};

    // Apply explicit action shortcuts
    if (action === "SUSPEND") {
      updateData.accountStatus = "SUSPENDED";
      updateData.suspendedAt = new Date();
      updateData.suspendedReason = rest.suspendedReason ?? "Suspended by admin";
    } else if (action === "REACTIVATE") {
      updateData.accountStatus = "ACTIVE";
      updateData.suspendedAt = null;
      updateData.suspendedReason = null;
    } else if (action === "CANCEL") {
      updateData.accountStatus = "CANCELED";
      updateData.canceledAt = new Date();
    } else if (action === "EXTEND_TRIAL") {
      // Extend trial by 14 days from now (or from current trialEndsAt)
      const base = household.trialEndsAt && household.trialEndsAt > new Date()
        ? household.trialEndsAt
        : new Date();
      const newEnd = new Date(base);
      newEnd.setDate(newEnd.getDate() + 14);
      updateData.trialEndsAt = newEnd;
      updateData.accountStatus = "TRIALING";
    } else if (action === "SYNC_STRIPE") {
      // Pull live subscription status directly from Stripe and update the DB
      if (!household.stripeSubscriptionId) {
        return NextResponse.json(
          { error: "This account has no Stripe subscription ID linked." },
          { status: 422 }
        );
      }
      const sub = await stripe.subscriptions.retrieve(household.stripeSubscriptionId);
      updateData.subscriptionStatus = sub.status;
      updateData.accountStatus = mapStripeStatus(sub.status);
      updateData.stripeCurrentPeriodEnd = new Date(sub.current_period_end * 1000);
      if (sub.trial_end) updateData.trialEndsAt = new Date(sub.trial_end * 1000);
      if (sub.status === "active") { updateData.pastDueAt = null; updateData.suspendedAt = null; }
    }

    // Apply explicit field overrides
    if (rest.accountStatus) updateData.accountStatus = rest.accountStatus;
    if (rest.trialEndsAt !== undefined) updateData.trialEndsAt = rest.trialEndsAt ? new Date(rest.trialEndsAt) : null;
    if (rest.adminNote !== undefined) updateData.adminNote = rest.adminNote;
    if (rest.billingEmail !== undefined) updateData.billingEmail = rest.billingEmail;
    if (rest.communityLabel !== undefined) updateData.communityLabel = rest.communityLabel || null;
    if (rest.communityUrl !== undefined) updateData.communityUrl = rest.communityUrl || null;

    const before = {
      accountStatus: household.accountStatus,
      suspendedAt: household.suspendedAt,
      suspendedReason: household.suspendedReason,
      adminNote: household.adminNote,
    };

    const updated = await prisma.household.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.userId,
        action: action ?? "UPDATE_ACCOUNT",
        entityType: "Household",
        entityId: params.id,
        note: action
          ? `${action} applied to "${household.name}"`
          : `Account fields updated for "${household.name}"`,
        before,
        after: updateData,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/admin/accounts/[id]]", err);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
