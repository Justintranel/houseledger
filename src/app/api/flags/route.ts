import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  key: z.string().min(1).max(100),
  enabled: z.boolean(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const flags = await prisma.featureFlag.findMany({
      where: { householdId: hid },
      orderBy: { key: "asc" },
    });

    return NextResponse.json(flags);
  } catch (err) {
    console.error("[GET /api/flags]", err);
    return NextResponse.json(
      { error: "Failed to load feature flags" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as "OWNER" | "FAMILY" | "MANAGER";

  if (role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { key, enabled } = parsed.data;

    await prisma.featureFlag.upsert({
      where: {
        householdId_key: { householdId: hid, key },
      },
      create: {
        householdId: hid,
        key,
        enabled,
      },
      update: {
        enabled,
        updatedAt: new Date(),
      },
    });

    // Return all flags after update
    const flags = await prisma.featureFlag.findMany({
      where: { householdId: hid },
      orderBy: { key: "asc" },
    });

    return NextResponse.json(flags);
  } catch (err) {
    console.error("[PATCH /api/flags]", err);
    return NextResponse.json(
      { error: "Failed to update feature flag" },
      { status: 500 }
    );
  }
}
