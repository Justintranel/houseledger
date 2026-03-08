/**
 * GET  /api/dm  — list all DM threads for the current user
 * POST /api/dm  — create or return an existing thread with a given memberId
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  /** The HouseholdMember.id of the other person to DM */
  otherMemberId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const userId = (session.user as any).id as string;

  // Find my HouseholdMember record
  const me = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: hid, userId } },
  });
  if (!me) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  try {
    const threads = await prisma.directMessageThread.findMany({
      where: {
        householdId: hid,
        members: { some: { memberId: me.id } },
      },
      include: {
        members: {
          include: {
            member: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Shape response: each thread shows the OTHER member's info
    const shaped = threads.map((t) => {
      const other = t.members.find((m) => m.member.userId !== userId);
      return {
        id: t.id,
        otherUser: other
          ? { id: other.member.userId, name: other.member.user.name, email: other.member.user.email }
          : null,
        lastMessage: t.messages[0] ?? null,
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json(shaped);
  } catch (err) {
    console.error("[GET /api/dm]", err);
    return NextResponse.json({ error: "Failed to load DM threads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const userId = (session.user as any).id as string;

  const me = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: hid, userId } },
  });
  if (!me) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid" }, { status: 400 });
    }

    const { otherMemberId } = parsed.data;

    // Verify the other member belongs to the same household
    const other = await prisma.householdMember.findFirst({
      where: { id: otherMemberId, householdId: hid },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!other) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (other.userId === userId) return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });

    // Look for an existing 1:1 thread between these two members
    const existingThreads = await prisma.directMessageThread.findMany({
      where: {
        householdId: hid,
        members: { some: { memberId: me.id } },
      },
      include: { members: true },
    });

    const existing = existingThreads.find(
      (t) =>
        t.members.length === 2 &&
        t.members.some((m) => m.memberId === me.id) &&
        t.members.some((m) => m.memberId === otherMemberId)
    );

    if (existing) {
      return NextResponse.json({ id: existing.id }, { status: 200 });
    }

    // Create a new thread
    const thread = await prisma.directMessageThread.create({
      data: {
        householdId: hid,
        members: {
          create: [{ memberId: me.id }, { memberId: otherMemberId }],
        },
      },
    });

    return NextResponse.json({ id: thread.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/dm]", err);
    return NextResponse.json({ error: "Failed to create DM thread" }, { status: 500 });
  }
}
