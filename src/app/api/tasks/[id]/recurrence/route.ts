import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { audit } from "@/lib/audit";
import { subDays } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  scope: z.enum(["this_future", "all"]),
  type: z.enum(["DAILY", "WEEKLY", "MONTHLY", "SEASONAL", "CUSTOM"]),
  interval: z.number().int().min(1).default(1),
  weekdays: z.array(z.number().int().min(0).max(6)).default([]),
  monthday: z.number().int().min(1).max(31).optional().nullable(),
  months: z.array(z.number().int().min(1).max(12)).default([]),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    // Only OWNER or FAMILY can edit recurrence rules
    if (auth.role === "MANAGER") {
      return NextResponse.json(
        { error: "Only OWNER or FAMILY can edit recurrence rules" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const instance = await prisma.taskInstance.findFirst({
      where: { id: params.id, householdId: auth.householdId },
      include: { taskTemplate: { include: { recurrenceRule: true } } },
    });
    if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!instance.taskTemplateId || !instance.taskTemplate?.recurrenceRule) {
      return NextResponse.json({ error: "Task has no recurrence rule" }, { status: 400 });
    }

    const { scope, type, interval, weekdays, monthday, months, endDate } = parsed.data;
    const oldRule = instance.taskTemplate.recurrenceRule;

    if (scope === "all") {
      await prisma.recurrenceRule.update({
        where: { id: oldRule.id },
        data: {
          type,
          interval,
          weekdays,
          monthday: monthday ?? null,
          months,
          endDate: endDate ? new Date(endDate + "T00:00:00") : null,
        },
      });

      await audit({
        householdId: auth.householdId,
        userId: auth.userId,
        action: "UPDATE",
        entityType: "RecurrenceRule",
        entityId: oldRule.id,
        before: { type: oldRule.type, interval: oldRule.interval },
        after: { type, interval, scope: "all" },
        note: `Updated entire recurrence series for: "${instance.title}"`,
      });
    } else {
      // "this and future" — end old rule the day before and fork a new template+rule
      const cutoff = subDays(instance.date, 1);
      await prisma.recurrenceRule.update({
        where: { id: oldRule.id },
        data: { endDate: cutoff },
      });

      const newTemplate = await prisma.taskTemplate.create({
        data: {
          householdId: auth.householdId,
          title: instance.title,
          description: instance.description,
          category: instance.category,
          defaultDuration: instance.taskTemplate!.defaultDuration,
          active: true,
          recurrenceRule: {
            create: {
              type,
              interval,
              weekdays,
              monthday: monthday ?? null,
              months,
              startDate: instance.date,
              endDate: endDate ? new Date(endDate + "T00:00:00") : null,
            },
          },
        },
      });

      await audit({
        householdId: auth.householdId,
        userId: auth.userId,
        action: "CREATE",
        entityType: "TaskTemplate",
        entityId: newTemplate.id,
        after: { type, interval, scope: "this_future" },
        note: `Forked recurrence from "${instance.title}" (this & future)`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/tasks/[id]/recurrence]", err);
    return NextResponse.json({ error: "Failed to update recurrence" }, { status: 500 });
  }
}
