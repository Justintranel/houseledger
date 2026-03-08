import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/google-calendar
// Returns the current GoogleCalendarLink for the household, or null if not connected.
// Any authenticated household member can call this.
export async function GET() {
  try {
    const auth = await requireHouseholdRole();

    const link = await prisma.googleCalendarLink.findUnique({
      where: { householdId: auth.householdId },
      select: {
        id: true,
        icalUrl: true,
        calendarName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(link ?? null);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/google-calendar]", err);
    return NextResponse.json({ error: "Failed to load calendar link" }, { status: 500 });
  }
}

// POST /api/google-calendar
// Saves or updates the iCal URL for the household. OWNER only.
// Body: { icalUrl: string, calendarName?: string }
export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (auth.role !== "OWNER")
      return NextResponse.json({ error: "Forbidden – OWNER role required" }, { status: 403 });

    const body = await req.json();
    const { icalUrl, calendarName } = body as { icalUrl?: unknown; calendarName?: unknown };

    if (typeof icalUrl !== "string" || !icalUrl.startsWith("https://"))
      return NextResponse.json(
        { error: "icalUrl must be a string starting with 'https://'" },
        { status: 400 },
      );

    if (calendarName !== undefined && typeof calendarName !== "string")
      return NextResponse.json({ error: "calendarName must be a string" }, { status: 400 });

    const link = await prisma.googleCalendarLink.upsert({
      where: { householdId: auth.householdId },
      create: {
        householdId: auth.householdId,
        icalUrl,
        calendarName: typeof calendarName === "string" ? calendarName : null,
      },
      update: {
        icalUrl,
        calendarName: typeof calendarName === "string" ? calendarName : null,
      },
      select: {
        id: true,
        icalUrl: true,
        calendarName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(link, { status: 200 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/google-calendar]", err);
    return NextResponse.json({ error: "Failed to save calendar link" }, { status: 500 });
  }
}

// DELETE /api/google-calendar
// Removes the GoogleCalendarLink for the household. OWNER only.
export async function DELETE() {
  try {
    const auth = await requireHouseholdRole();
    if (auth.role !== "OWNER")
      return NextResponse.json({ error: "Forbidden – OWNER role required" }, { status: 403 });

    await prisma.googleCalendarLink.deleteMany({
      where: { householdId: auth.householdId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/google-calendar]", err);
    return NextResponse.json({ error: "Failed to remove calendar link" }, { status: 500 });
  }
}
