import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  delta: z.number().int(),
  note: z.string().max(500).optional().default(""),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const userId = (session.user as any).id as string;
  const { id } = params;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { delta, note } = parsed.data;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.householdId !== hid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newQty = Math.max(0, item.qty + delta);

    const [updated] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id },
        data: { qty: newQty },
      }),
      prisma.inventoryLog.create({
        data: {
          itemId: id,
          userId,
          delta,
          note: note ?? "",
        },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/inventory/[id]/adjust]", err);
    return NextResponse.json(
      { error: "Failed to adjust inventory" },
      { status: 500 }
    );
  }
}
