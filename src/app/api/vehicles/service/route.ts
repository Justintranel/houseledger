import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const serviceFields = {
  vehicleId: z.string().min(1),
  serviceType: z.string().min(1).max(200),
  date: z.string().min(1),
  mileage: z.number().int().min(0).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  nextDueDate: z.string().optional().nullable(),
  nextDueMileage: z.number().int().min(0).optional().nullable(),
};

const postSchema = z.object(serviceFields);
const patchSchema = z.object({ id: z.string().min(1), ...serviceFields }).partial({ vehicleId: true, serviceType: true, date: true });

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const vehicleId = new URL(req.url).searchParams.get("vehicleId");
    if (!vehicleId) return NextResponse.json({ error: "vehicleId required" }, { status: 400 });

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, householdId: auth.householdId } });
    if (!vehicle)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const records = await prisma.vehicleService.findMany({
      where: { vehicleId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(records);
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

    const { vehicleId, serviceType, date, mileage, cost, notes, nextDueDate, nextDueMileage } = parsed.data;

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, householdId: auth.householdId } });
    if (!vehicle)
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    // Update vehicle mileage if this service entry has mileage
    const data: Parameters<typeof prisma.vehicleService.create>[0]["data"] = {
      vehicleId,
      serviceType,
      date: new Date(date),
      mileage: mileage ?? null,
      cost: cost ?? null,
      notes: notes ?? null,
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      nextDueMileage: nextDueMileage ?? null,
    };

    const record = await prisma.vehicleService.create({ data });

    // Bump vehicle currentMileage if applicable
    if (mileage && (!vehicle.currentMileage || mileage > vehicle.currentMileage)) {
      await prisma.vehicle.update({ where: { id: vehicleId }, data: { currentMileage: mileage } });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/vehicles/service]", err);
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const record = await prisma.vehicleService.findFirst({
      where: { id, vehicle: { householdId: auth.householdId } },
    });
    if (!record)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.vehicleService.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
