import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

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
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "inventory:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { delta, note } = parsed.data;

    const item = await prisma.inventoryItem.findFirst({
      where: { id, householdId: auth.householdId },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
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
          userId: auth.userId,
          delta,
          note: note ?? "",
        },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/inventory/[id]/adjust]", err);
    return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
  }
}
