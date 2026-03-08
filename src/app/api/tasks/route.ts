import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getInstancesForRange, taskInstanceInclude } from "@/lib/tasks";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  title: z.string().min(1).max(300),
  category: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-MM-dd"),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Query params 'from' and 'to' are required (yyyy-MM-dd)" },
        { status: 400 },
      );
    }

    const instances = await getInstancesForRange(
      auth.householdId,
      new Date(from + "T00:00:00"),
      new Date(to + "T23:59:59"),
    );
    return NextResponse.json(instances);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/tasks]", err);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "tasks:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { title, category, description, date } = parsed.data;
    const instance = await prisma.taskInstance.create({
      data: {
        title,
        category: category ?? null,
        description: description ?? null,
        date: new Date(date + "T00:00:00"),
        status: "TODO",
        householdId: auth.householdId,
      },
      include: taskInstanceInclude,
    });

    return NextResponse.json(instance, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/tasks]", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
