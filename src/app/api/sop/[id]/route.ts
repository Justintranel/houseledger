import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;

  try {
    const sop = await prisma.houseSOP.findUnique({
      where: { id: params.id },
      include: { photos: { orderBy: { sortOrder: "asc" } } },
    });
    if (!sop || sop.householdId !== hid)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sop);
  } catch (err) {
    console.error("[GET /api/sop/[id]]", err);
    return NextResponse.json({ error: "Failed to load SOP" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;
  const role = (session.user as any).role as string;
  if (role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid" },
        { status: 400 }
      );

    const existing = await prisma.houseSOP.findUnique({ where: { id: params.id } });
    if (!existing || existing.householdId !== hid)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.houseSOP.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
        ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
      },
      include: { photos: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/sop/[id]]", err);
    return NextResponse.json({ error: "Failed to update SOP" }, { status: 500 });
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
  const role = (session.user as any).role as string;
  if (role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const existing = await prisma.houseSOP.findUnique({ where: { id: params.id } });
    if (!existing || existing.householdId !== hid)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.houseSOP.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/sop/[id]]", err);
    return NextResponse.json({ error: "Failed to delete SOP" }, { status: 500 });
  }
}
