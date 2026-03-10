import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  productUrl: z.string().url().max(2000).nullable().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  threshold: z.number().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as "OWNER" | "FAMILY" | "MANAGER";

  // Only OWNER can edit product URLs and metadata
  if (role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: params.id, householdId: hid },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if ("productUrl" in parsed.data) {
      updateData.productUrl = parsed.data.productUrl || null;
    }
    if ("notes" in parsed.data) {
      updateData.notes = parsed.data.notes;
    }
    if ("threshold" in parsed.data) {
      updateData.threshold = parsed.data.threshold;
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/inventory/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role;

  if (role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: params.id, householdId: hid },
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    await prisma.inventoryItem.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/inventory/[id]]", err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
