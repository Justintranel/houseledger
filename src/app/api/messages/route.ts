import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  channelId: z.string().min(1),
  body: z.string().min(1).max(10000),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId query param is required" },
        { status: 400 }
      );
    }

    // Verify the channel belongs to this household AND the user is a member
    const membership = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: auth.userId,
        channel: { householdId: auth.householdId },
      },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { channelId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/messages]", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { channelId, body: messageBody } = parsed.data;

    // Verify the channel belongs to this household AND the user is a member
    const membership = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: auth.userId,
        channel: { householdId: auth.householdId },
      },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        channelId,
        senderId: auth.userId,
        body: messageBody,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Emit real-time event via Socket.IO if available
    try {
      (global as any).io?.to(channelId).emit("message:new", message);
    } catch {
      // Socket.IO not configured; gracefully skip
    }

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/messages]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
