/**
 * POST /api/cron/drip
 *
 * Runs daily (configured in vercel.json).
 * For each OWNER whose account is N days old (N = 1–7),
 * sends the corresponding onboarding drip email if not yet sent.
 *
 * Secured with CRON_SECRET environment variable.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  sendDripDay1,
  sendDripDay2,
  sendDripDay3,
  sendDripDay4,
  sendDripDay5,
  sendDripDay6,
  sendDripDay7,
} from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DRIP_SENDERS: Record<number, (to: string, name: string) => Promise<void>> = {
  1: sendDripDay1,
  2: sendDripDay2,
  3: sendDripDay3,
  4: sendDripDay4,
  5: sendDripDay5,
  6: sendDripDay6,
  7: sendDripDay7,
};

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Process drip days 1–7
  for (const day of [1, 2, 3, 4, 5, 6, 7]) {
    // Find all OWNER users whose account is approximately `day` days old
    // (between 23 hours and 25 hours from the target day, to handle timing drift)
    const windowStart = new Date(now.getTime() - (day * 24 + 1) * 60 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() - (day * 24 - 1) * 60 * 60 * 1000);

    // Get owner users created in this window who haven't received this drip yet
    const candidates = await prisma.user.findMany({
      where: {
        createdAt: { gte: windowStart, lte: windowEnd },
        memberships: { some: { role: "OWNER" } },
        dripEmails: { none: { day } },
        isSuperAdmin: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    for (const user of candidates) {
      try {
        const sender = DRIP_SENDERS[day];
        if (!sender) continue;

        await sender(user.email, user.name.split(" ")[0] || user.name);

        // Mark as sent
        await prisma.dripEmail.create({
          data: { userId: user.id, day },
        });

        sent++;
        console.log(`[drip] Day ${day} sent → ${user.email}`);
      } catch (err) {
        const msg = `Day ${day} → ${user.email}: ${String(err)}`;
        errors.push(msg);
        console.error(`[drip] ERROR ${msg}`);
      }
    }

    skipped += candidates.length === 0 ? 0 : 0; // tracked implicitly
  }

  return NextResponse.json({
    ok: true,
    sent,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: now.toISOString(),
  });
}
