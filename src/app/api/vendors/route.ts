import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  type: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  approvalLimit: z.number().min(0).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  type: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  approvalLimit: z.number().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const vendors = await prisma.vendor.findMany({
      where: { householdId: hid },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(vendors);
  } catch (err) {
    console.error("[GET /api/vendors]", err);
    return NextResponse.json(
      { error: "Failed to load vendors" },
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

    const { name, phone, email, type, notes, approvalLimit } = parsed.data;

    const vendor = await prisma.vendor.create({
      data: {
        householdId: hid,
        name,
        phone: phone ?? null,
        email: email ?? null,
        type: type ?? null,
        notes: notes ?? null,
        approvalLimit: approvalLimit ?? null,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (err) {
    console.error("[POST /api/vendors]", err);
    return NextResponse.json(
      { error: "Failed to create vendor" },
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
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { id, ...fields } = parsed.data;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor || vendor.householdId !== hid) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: fields,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/vendors]", err);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as "OWNER" | "FAMILY" | "MANAGER";
  const userId = (session.user as any).id as string;

  if (role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Query param 'id' is required" },
      { status: 400 }
    );
  }

  try {
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor || vendor.householdId !== hid) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    await prisma.vendor.delete({ where: { id } });

    await audit({
      householdId: hid,
      userId,
      action: "VENDOR_DELETED",
      entityType: "Vendor",
      entityId: id,
      details: `Deleted vendor: ${vendor.name}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/vendors]", err);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
