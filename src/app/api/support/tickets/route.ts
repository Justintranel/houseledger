import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  category: z.enum(["Billing", "Technical", "Access", "Feature Request", "Other"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

// GET — list tickets submitted by this household (user-facing)
export async function GET() {
  try {
    const auth = await requireHouseholdRole();

    const tickets = await prisma.supportTicket.findMany({
      where: { householdId: auth.householdId },
      orderBy: { createdAt: "desc" },
      include: {
        submittedBy: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
        comments: {
          where: { isInternal: false }, // Only public comments visible to users
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, isSuperAdmin: true } } },
        },
      },
    });

    return NextResponse.json(tickets);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

// POST — submit a new support ticket
export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );

    const ticket = await prisma.supportTicket.create({
      data: {
        householdId: auth.householdId,
        submittedById: auth.userId,
        subject: parsed.data.subject,
        body: parsed.data.body,
        category: parsed.data.category ?? null,
        priority: parsed.data.priority,
      },
      include: {
        submittedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 });
  }
}
