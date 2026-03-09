import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default maintenance schedule seeded for every new vehicle
const DEFAULT_VEHICLE_MAINTENANCE: { title: string; intervalDays: number; notes: string }[] = [
  { title: "Oil Change",                   intervalDays: 90,  notes: "Check oil level monthly. Conventional oil every 3 months / 3,000 mi; synthetic every 6 months / 5,000–7,500 mi." },
  { title: "Tire Rotation",                intervalDays: 180, notes: "Rotate tires every 5,000–7,500 miles to ensure even wear. Check tread depth and pressure at same time." },
  { title: "Tire Pressure Check",          intervalDays: 30,  notes: "Check all 4 tires + spare. Recommended PSI is in the driver's door jamb sticker, not the tire sidewall." },
  { title: "Air Filter Replacement",       intervalDays: 365, notes: "Engine air filter. Inspect every 12 months or 12,000 miles; replace when visibly dirty. More frequent in dusty areas." },
  { title: "Cabin Air Filter",             intervalDays: 365, notes: "Controls air quality inside the car. Replace every 12,000–15,000 miles or annually. Found behind glove box on most vehicles." },
  { title: "Brake Inspection",             intervalDays: 365, notes: "Check brake pads, rotors, and fluid annually. Replace pads when under 3mm of material. Squealing or pulsing = inspect immediately." },
  { title: "Battery Test",                 intervalDays: 180, notes: "Most batteries last 3–5 years. Test every 6 months in extreme climates. Watch for slow cranking or dim lights." },
  { title: "Fluid Level Check",            intervalDays: 90,  notes: "Check coolant, brake fluid, power steering, windshield washer fluid, and transmission fluid every 3 months." },
  { title: "Wiper Blade Replacement",      intervalDays: 365, notes: "Replace annually or when streaking begins. Replace rear wiper too. Check rubber condition before rainy seasons." },
  { title: "Tire Tread Depth Check",       intervalDays: 180, notes: "Use penny test: insert penny with Lincoln's head down. If you see all of Lincoln's head, it's time to replace. Replace at 2/32\" or less." },
  { title: "Alignment Check",              intervalDays: 365, notes: "Check alignment annually or after hitting a large pothole/curb. Signs of misalignment: pulling to one side, uneven tire wear." },
  { title: "Transmission Fluid",           intervalDays: 730, notes: "Automatic transmission fluid every 30,000–60,000 miles (check owner's manual). Dark or burnt-smelling fluid = change immediately." },
  { title: "Coolant Flush",                intervalDays: 730, notes: "Flush and replace coolant every 2 years or 30,000 miles. Old coolant becomes acidic and corrodes the cooling system." },
  { title: "State Inspection / Emissions", intervalDays: 365, notes: "Required annually in most states. Schedule a few weeks before expiration to allow time for any needed repairs." },
  { title: "Spark Plug Replacement",       intervalDays: 1095,notes: "Standard plugs: every 30,000 miles. Iridium/platinum plugs: 60,000–100,000 miles. Misfires or rough idle = check sooner." },
  { title: "Fuel System Cleaning",         intervalDays: 730, notes: "Fuel injector cleaning every 2 years helps maintain fuel economy and smooth idle. Use quality fuel cleaner additive or professional service." },
  { title: "Serpentine Belt Inspection",   intervalDays: 365, notes: "Inspect annually for cracks, fraying, or glazing. Most belts last 60,000–100,000 miles but inspect regularly." },
  { title: "AC System Check",              intervalDays: 365, notes: "Before summer: test AC output temperature and check refrigerant level. Recharge if blowing warm. Inspect compressor and condenser." },
];

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
        serviceRecords: { orderBy: { date: "desc" }, take: 10 },
        maintenanceItems: { orderBy: [{ category: "asc" }, { title: "asc" }] },
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
    });

    // Seed default maintenance schedule for this vehicle
    await prisma.maintenanceItem.createMany({
      data: DEFAULT_VEHICLE_MAINTENANCE.map((item) => ({
        householdId: auth.householdId,
        vehicleId: vehicle.id,
        title: item.title,
        category: "Vehicle Service",
        intervalDays: item.intervalDays,
        notes: item.notes,
      })),
    });

    const vehicleWithData = await prisma.vehicle.findUnique({
      where: { id: vehicle.id },
      include: {
        serviceRecords: { orderBy: { date: "desc" }, take: 10 },
        maintenanceItems: { orderBy: [{ category: "asc" }, { title: "asc" }] },
      },
    });

    return NextResponse.json(vehicleWithData, { status: 201 });
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

    const updated = await prisma.vehicle.update({
      where: { id },
      data,
      include: {
        serviceRecords: { orderBy: { date: "desc" }, take: 10 },
        maintenanceItems: { orderBy: [{ category: "asc" }, { title: "asc" }] },
      },
    });
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

    await prisma.vehicle.delete({ where: { id } }); // cascades to serviceRecords + maintenanceItems
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
