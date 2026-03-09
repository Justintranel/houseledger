import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { audit } from "@/lib/audit";
import { format } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    const instance = await prisma.taskInstance.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!instance.taskTemplateId)
      return NextResponse.json({ error: "Cannot skip a one-off task" }, { status: 400 });

    // Create or update TaskException to mark this date as skipped
    const exception = await prisma.taskException.upsert({
      where: {
        taskTemplateId_date: {
          taskTemplateId: instance.taskTemplateId,
          date: instance.date,
        },
      },
      create: { taskTemplateId: instance.taskTemplateId, date: instance.date, skip: true },
      update: { skip: true },
    });

    // Mark the persisted instance as SKIPPED
    await prisma.taskInstance.update({
      where: { id: params.id },
      data: { status: "SKIPPED" },
    });

    await audit({
      householdId: auth.householdId,
      userId: auth.userId,
      action: "UPDATE",
      entityType: "TaskException",
      entityId: exception.id,
      after: { skip: true, date: format(instance.date, "yyyy-MM-dd") },
      note: `Skipped occurrence: "${instance.title}"`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/tasks/[id]/skip]", err);
    return NextResponse.json({ error: "Failed to skip task" }, { status: 500 });
  }
}
