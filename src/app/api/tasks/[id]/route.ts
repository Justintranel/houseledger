import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { taskInstanceInclude } from "@/lib/tasks";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();
    const instance = await prisma.taskInstance.findFirst({
      where: { id: params.id, householdId: auth.householdId },
      include: taskInstanceInclude,
    });
    if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(instance);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const patchSchema = z
  .object({
    status: z.enum(["TODO", "IN_PROGRESS", "DONE", "SKIPPED"]).optional(),
    title: z.string().min(1).max(300).optional(),
    description: z.string().max(2000).nullable().optional(),
  })
  .refine(
    (d) => d.status !== undefined || d.title !== undefined || d.description !== undefined,
    { message: "At least one field required" },
  );

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "tasks:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const instance = await prisma.taskInstance.findFirst({ where: { id: params.id, householdId: auth.householdId } });
    if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // MANAGER can only update status, not edit title/description
    if (
      auth.role === "MANAGER" &&
      (parsed.data.title !== undefined || parsed.data.description !== undefined)
    ) {
      return NextResponse.json(
        { error: "Managers cannot edit task title or description" },
        { status: 403 },
      );
    }

    const { status, title, description } = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    if (status !== undefined) {
      updateData.status = status;
      if (status === "DONE") {
        updateData.completedAt = new Date();
        updateData.completedByUserId = auth.userId;
      } else if (instance.status === "DONE") {
        updateData.completedAt = null;
        updateData.completedByUserId = null;
      }
    }

    const updated = await prisma.taskInstance.update({
      where: { id: params.id },
      data: updateData,
      include: taskInstanceInclude,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/tasks/[id]]", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
