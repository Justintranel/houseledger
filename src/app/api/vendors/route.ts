import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const vendorFields = {
  name: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
  license: z.string().max(100).optional(),
  type: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  approvalLimit: z.number().min(0).optional(),
  preferred: z.boolean().optional(),
};

const postSchema = z.object(vendorFields);
const patchSchema = z.object({ id: z.string().min(1), ...vendorFields }).partial({ name: true });

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const vendors = await prisma.vendor.findMany({
      where: { householdId: auth.householdId },
      orderBy: [{ preferred: "desc" }, { name: "asc" }],
    });
    return NextResponse.json(vendors);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/vendors]", err);
    return NextResponse.json({ error: "Failed to load vendors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "vendors:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );

    const { name, phone, email, website, address, license, type, category, notes, approvalLimit, preferred } =
      parsed.data;

    const vendor = await prisma.vendor.create({
      data: {
        householdId: auth.householdId,
        name,
        phone: phone || null,
        email: email || null,
        website: website || null,
        address: address || null,
        license: license || null,
        type: type || null,
        category: category || null,
        notes: notes || null,
        approvalLimit: approvalLimit ?? null,
        preferred: preferred ?? false,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/vendors]", err);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "vendors:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );

    const { id, ...fields } = parsed.data;

    const vendor = await prisma.vendor.findFirst({
      where: { id, householdId: auth.householdId },
    });
    if (!vendor)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    // Normalize empty strings to null
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      data[k] = v === "" ? null : v;
    }

    const updated = await prisma.vendor.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/vendors]", err);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "vendors:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Query param 'id' is required" }, { status: 400 });

    const vendor = await prisma.vendor.findFirst({
      where: { id, householdId: auth.householdId },
    });
    if (!vendor)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    await prisma.vendor.delete({ where: { id } });
    await audit({
      householdId: auth.householdId,
      userId: auth.userId,
      action: "DELETE",
      entityType: "Vendor",
      entityId: id,
      note: `Deleted vendor: ${vendor.name}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/vendors]", err);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}
