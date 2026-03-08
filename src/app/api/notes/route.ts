import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-MM-dd"),
  body: z.string().min(1).max(5000),
  visibility: z.enum(["SHARED", "PRIVATE"]),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as "OWNER" | "FAMILY" | "MANAGER";
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Query param 'date' is required (yyyy-MM-dd)" },
      { status: 400 }
    );
  }

  // Build date range for the given day (start of day to end of day)
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  try {
    const where: Record<string, unknown> = {
      householdId: hid,
      date: { gte: dayStart, lte: dayEnd },
    };

    // MANAGERs only see SHARED notes
    if (role === "MANAGER") {
      where.visibility = "SHARED";
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(notes);
  } catch (err) {
    console.error("[GET /api/notes]", err);
    return NextResponse.json(
      { error: "Failed to load notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const userId = (session.user as any).id as string;

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { date, body: noteBody, visibility } = parsed.data;

    const note = await prisma.note.create({
      data: {
        householdId: hid,
        authorId: userId,
        date: new Date(`${date}T12:00:00.000Z`),
        body: noteBody,
        visibility,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("[POST /api/notes]", err);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
