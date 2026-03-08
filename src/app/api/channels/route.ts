import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const channels = await prisma.channel.findMany({
      where: { householdId: hid },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(channels);
  } catch (err) {
    console.error("[GET /api/channels]", err);
    return NextResponse.json(
      { error: "Failed to load channels" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  if (role !== "OWNER" && role !== "FAMILY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;

    const channel = await prisma.channel.create({
      data: {
        name,
        description: description ?? null,
        householdId: hid,
      },
    });

    // Add all household members to the new channel
    const members = await prisma.householdMember.findMany({
      where: { householdId: hid },
      select: { userId: true },
    });

    await prisma.channelMember.createMany({
      data: members.map((m) => ({
        channelId: channel.id,
        userId: m.userId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (err) {
    console.error("[POST /api/channels]", err);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}
