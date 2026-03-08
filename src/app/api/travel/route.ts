import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  title: z.string().min(1).max(300),
  destination: z.string().max(300).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budgetCents: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(["PLANNING", "BOOKED", "COMPLETED"]).default("PLANNING"),
});

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const plans = await prisma.travelPlan.findMany({
      where: { householdId: auth.householdId },
      include: { checklist: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(plans);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/travel]", err);
    return NextResponse.json({ error: "Failed to load trips" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "travel:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const { startDate, endDate, ...rest } = parsed.data;
    const plan = await prisma.travelPlan.create({
      data: {
        householdId: auth.householdId,
        ...rest,
        startDate: startDate ? new Date(startDate + "T12:00:00") : null,
        endDate: endDate ? new Date(endDate + "T12:00:00") : null,
      },
      include: { checklist: true },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/travel]", err);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}
