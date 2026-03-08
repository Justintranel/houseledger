import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;
  try {
    const sops = await prisma.houseSOP.findMany({
      where: { householdId: hid },
      orderBy: { sortOrder: "asc" },
      include: { photos: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(sops);
  } catch (err) {
    console.error("[GET /api/sop]", err);
    return NextResponse.json({ error: "Failed to load SOPs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;
  const role = (session.user as any).role as string;
  if (role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid" }, { status: 400 });
    const maxOrder = await prisma.houseSOP.aggregate({ where: { householdId: hid }, _max: { sortOrder: true } });
    const sop = await prisma.houseSOP.create({
      data: { householdId: hid, name: parsed.data.name, notes: parsed.data.notes ?? null, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
      include: { photos: true },
    });
    return NextResponse.json(sop, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sop]", err);
    return NextResponse.json({ error: "Failed to create SOP" }, { status: 500 });
  }
}
