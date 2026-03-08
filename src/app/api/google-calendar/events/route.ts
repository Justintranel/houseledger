import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── ICS Parser ───────────────────────────────────────────────────────────────

interface ICSEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  description: string;
}

/**
 * Unfolds ICS lines: lines beginning with a space or tab are continuations
 * of the previous line (RFC 5545 §3.1 line folding).
 */
function unfoldLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const folded = normalized.split("\n");
  const unfolded: string[] = [];
  for (const line of folded) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

/**
 * Parses an ICS date/datetime string into a JavaScript Date and an allDay flag.
 * Supported formats:
 *   20260315            → date-only (allDay = true), interpreted as UTC midnight
 *   20260315T120000     → local datetime (no Z), treated as UTC
 *   20260315T120000Z    → UTC datetime
 */
function parseICSDate(value: string): { date: Date; allDay: boolean } {
  // Strip any VALUE=DATE or TZID parameter prefix (e.g. "DTSTART;VALUE=DATE:20260315")
  const raw = value.split(":").pop() ?? value;

  if (raw.length === 8) {
    // Date-only: YYYYMMDD
    const year = parseInt(raw.slice(0, 4), 10);
    const month = parseInt(raw.slice(4, 6), 10) - 1;
    const day = parseInt(raw.slice(6, 8), 10);
    return { date: new Date(Date.UTC(year, month, day)), allDay: true };
  }

  // Datetime: YYYYMMDDTHHmmss[Z]
  const year = parseInt(raw.slice(0, 4), 10);
  const month = parseInt(raw.slice(4, 6), 10) - 1;
  const day = parseInt(raw.slice(6, 8), 10);
  const hour = parseInt(raw.slice(9, 11), 10);
  const minute = parseInt(raw.slice(11, 13), 10);
  const second = parseInt(raw.slice(13, 15), 10);
  return {
    date: new Date(Date.UTC(year, month, day, hour, minute, second)),
    allDay: false,
  };
}

/**
 * Parses raw ICS text and returns an array of calendar events.
 */
function parseICS(text: string): ICSEvent[] {
  const lines = unfoldLines(text);
  const events: ICSEvent[] = [];

  let inEvent = false;
  let uid = "";
  let summary = "";
  let description = "";
  let dtstart: { date: Date; allDay: boolean } | null = null;
  let dtend: { date: Date; allDay: boolean } | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      uid = "";
      summary = "";
      description = "";
      dtstart = null;
      dtend = null;
      continue;
    }

    if (line === "END:VEVENT") {
      inEvent = false;
      if (dtstart) {
        // If DTEND is missing, default to the same moment as DTSTART (or next day for allDay)
        let end: Date;
        if (dtend) {
          end = dtend.date;
        } else if (dtstart.allDay) {
          end = new Date(dtstart.date.getTime() + 86_400_000);
        } else {
          end = new Date(dtstart.date);
        }

        events.push({
          id: uid || `${summary}-${dtstart.date.toISOString()}`,
          title: summary,
          start: dtstart.date,
          end,
          allDay: dtstart.allDay,
          description,
        });
      }
      continue;
    }

    if (!inEvent) continue;

    // Split on the first colon to separate the property name (with params) from value
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const propFull = line.slice(0, colonIdx).toUpperCase();
    const propValue = line.slice(colonIdx + 1);

    // Match property name (ignore parameters like ;TZID=... ;VALUE=...)
    const propName = propFull.split(";")[0];

    switch (propName) {
      case "UID":
        uid = propValue.trim();
        break;
      case "SUMMARY":
        summary = propValue.trim();
        break;
      case "DESCRIPTION":
        description = propValue.trim().replace(/\\n/g, "\n").replace(/\\,/g, ",");
        break;
      case "DTSTART":
        dtstart = parseICSDate(propValue.trim());
        break;
      case "DTEND":
        dtend = parseICSDate(propValue.trim());
        break;
    }
  }

  return events;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

// GET /api/google-calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD
// Any authenticated household member can fetch events (MANAGER needs visibility too).
export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to)
      return NextResponse.json(
        { error: "Query params 'from' and 'to' required (YYYY-MM-DD)" },
        { status: 400 },
      );

    const fromDate = new Date(from + "T00:00:00Z");
    const toDate = new Date(to + "T23:59:59Z");

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()))
      return NextResponse.json({ error: "Invalid date format – use YYYY-MM-DD" }, { status: 400 });

    const link = await prisma.googleCalendarLink.findUnique({
      where: { householdId: auth.householdId },
      select: { icalUrl: true },
    });

    if (!link) return NextResponse.json([]);

    const icsResponse = await fetch(link.icalUrl, {
      headers: { "User-Agent": "HouseLedger/1.0" },
      // Next.js caches fetch by default; opt out so events stay fresh
      cache: "no-store",
    });

    if (!icsResponse.ok) {
      console.error(
        `[GET /api/google-calendar/events] Upstream fetch failed: ${icsResponse.status}`,
      );
      return NextResponse.json(
        { error: "Failed to fetch calendar data from Google" },
        { status: 502 },
      );
    }

    const icsText = await icsResponse.text();
    const allEvents = parseICS(icsText);

    const filtered = allEvents
      .filter((ev) => ev.end > fromDate && ev.start <= toDate)
      .map((ev) => ({
        id: ev.id,
        title: ev.title,
        start: ev.start.toISOString(),
        end: ev.end.toISOString(),
        allDay: ev.allDay,
        description: ev.description,
      }));

    return NextResponse.json(filtered);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/google-calendar/events]", err);
    return NextResponse.json({ error: "Failed to load calendar events" }, { status: 500 });
  }
}
