import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  unit: z.string().max(50).optional(),
  threshold: z.number().min(0).optional().default(0),
  productUrl: z.string().url().max(2000).optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const items = await prisma.inventoryItem.findMany({
      where: { householdId: hid },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("[GET /api/inventory]", err);
    return NextResponse.json(
      { error: "Failed to load inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, category, unit, threshold, productUrl, notes } = parsed.data;

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category: category ?? null,
        unit: unit ?? null,
        threshold: threshold ?? 0,
        productUrl: productUrl || null,
        notes: notes ?? null,
        qty: 0,
        householdId: hid,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("[POST /api/inventory]", err);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
