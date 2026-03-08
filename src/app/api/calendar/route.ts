import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  allDay: z.boolean().default(true),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to)
      return NextResponse.json({ error: "Query params 'from' and 'to' required" }, { status: 400 });

    const events = await prisma.familyEvent.findMany({
      where: {
        householdId: auth.householdId,
        startDate: {
          gte: new Date(from + "T00:00:00"),
          lte: new Date(to + "T23:59:59"),
        },
      },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json(events);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/calendar]", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "calendar:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const event = await prisma.familyEvent.create({
      data: {
        householdId: auth.householdId,
        createdById: auth.userId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        startDate: new Date(parsed.data.startDate + "T12:00:00"),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate + "T12:00:00") : null,
        allDay: parsed.data.allDay,
        color: parsed.data.color ?? null,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/calendar]", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
