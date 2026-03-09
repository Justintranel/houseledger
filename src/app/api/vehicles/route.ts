import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const vehicleFields = {
  nickname: z.string().max(100).optional().nullable(),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(2100),
  color: z.string().max(50).optional().nullable(),
  licensePlate: z.string().max(20).optional().nullable(),
  vin: z.string().max(17).optional().nullable(),
  currentMileage: z.number().int().min(0).optional().nullable(),
  registrationExpiry: z.string().datetime().optional().nullable(),
  insuranceExpiry: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
};

const postSchema = z.object(vehicleFields);
const patchSchema = z.object({ id: z.string().min(1), ...vehicleFields }).partial({ make: true, model: true, year: true });

function parseDateField(val: unknown) {
  if (!val) return null;
  return new Date(val as string);
}

export async function GET() {
  try {
    const auth = await requireHouseholdRole();
    const vehicles = await prisma.vehicle.findMany({
      where: { householdId: auth.householdId },
      include: {
        serviceRecords: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
      orderBy: [{ year: "desc" }, { make: "asc" }],
    });
    return NextResponse.json(vehicles);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid" }, { status: 400 });

    const { nickname, make, model, year, color, licensePlate, vin, currentMileage, registrationExpiry, insuranceExpiry, notes } = parsed.data;

    const vehicle = await prisma.vehicle.create({
      data: {
        householdId: auth.householdId,
        nickname: nickname ?? null,
        make,
        model,
        year,
        color: color ?? null,
        licensePlate: licensePlate ?? null,
        vin: vin ?? null,
        currentMileage: currentMileage ?? null,
        registrationExpiry: parseDateField(registrationExpiry),
        insuranceExpiry: parseDateField(insuranceExpiry),
        notes: notes ?? null,
      },
      include: { serviceRecords: true },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/vehicles]", err);
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid" }, { status: 400 });

    const { id, ...fields } = parsed.data;
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.householdId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = { ...fields };
    if ("registrationExpiry" in fields) data.registrationExpiry = parseDateField(fields.registrationExpiry);
    if ("insuranceExpiry" in fields) data.insuranceExpiry = parseDateField(fields.insuranceExpiry);

    const updated = await prisma.vehicle.update({ where: { id }, data, include: { serviceRecords: true } });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.householdId !== auth.householdId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
