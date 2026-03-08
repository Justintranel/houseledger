/**
 * GET  /api/dm/[threadId]/messages  — fetch messages in a DM thread
 * POST /api/dm/[threadId]/messages  — send a message to a DM thread
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  body: z.string().min(1).max(10000),
});

async function verifyThreadMembership(threadId: string, householdId: string, userId: string) {
  const me = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  if (!me) return null;

  const membership = await prisma.directMessageMember.findFirst({
    where: { threadId, memberId: me.id },
  });
  return membership ? me : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const userId = (session.user as any).id as string;

  const member = await verifyThreadMembership(params.threadId, hid, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const messages = await prisma.directMessage.findMany({
      where: { threadId: params.threadId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true } },
      },
      take: 200,
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("[GET /api/dm/[threadId]/messages]", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const userId = (session.user as any).id as string;

  const member = await verifyThreadMembership(params.threadId, hid, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const rawBody = await req.json();
    const parsed = postSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid" }, { status: 400 });
    }

    const message = await prisma.directMessage.create({
      data: {
        threadId: params.threadId,
        senderId: userId,
        body: parsed.data.body,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    // Broadcast via Socket.IO if available
    try {
      (global as any).io?.to(`dm:${params.threadId}`).emit("dm:new", message);
    } catch {
      // graceful skip
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("[POST /api/dm/[threadId]/messages]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
