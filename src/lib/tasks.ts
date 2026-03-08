/**
 * On-demand task instance generation engine.
 *
 * Instead of a cron job, we generate TaskInstance records on the fly
 * when a date range is requested, then cache them in the DB.
 */
import { prisma } from "./db";
import type { Prisma } from "@prisma/client";
import { eachDayOfInterval, getDay, getDate, getMonth, format } from "date-fns";

type Template = Prisma.TaskTemplateGetPayload<{
  include: { recurrenceRule: true; exceptions: true };
}>;

/** Returns true if the template should produce an instance on the given date. */
function occursOn(template: NonNullable<Template>, date: Date): boolean {
  const rule = template.recurrenceRule;
  if (!rule) {
    if (template.isOneOff && template.oneOffDate) {
      return format(template.oneOffDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    }
    return false;
  }

  const start = rule.startDate;
  const end = rule.endDate;

  if (date < start) return false;
  if (end && date > end) return false;

  const dow = getDay(date);       // 0–6
  const dom = getDate(date);      // 1–31
  const month = getMonth(date) + 1; // 1–12

  switch (rule.type) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return rule.weekdays.includes(dow);
    case "MONTHLY":
      return rule.monthday === dom;
    case "SEASONAL":
      return rule.months.includes(month);
    case "CUSTOM": {
      const diff = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
      return diff >= 0 && diff % rule.interval === 0;
    }
    default:
      return false;
  }
}

/**
 * Ensure TaskInstance records exist for all active templates within [from, to].
 * Already-persisted instances are not recreated (upsert semantics).
 */
export async function generateInstances(
  householdId: string,
  from: Date,
  to: Date,
): Promise<void> {
  const templates = await prisma.taskTemplate.findMany({
    where: { householdId, active: true },
    include: { recurrenceRule: true, exceptions: true },
  });

  const days = eachDayOfInterval({ start: from, end: to });

  const creates: Prisma.TaskInstanceCreateManyInput[] = [];

  for (const template of templates) {
    // Fetch all existing instances for this template in the range in one query
    const existingDates = new Set(
      (
        await prisma.taskInstance.findMany({
          where: { householdId, taskTemplateId: template.id, date: { gte: from, lte: to } },
          select: { date: true },
        })
      ).map((r) => format(r.date, "yyyy-MM-dd")),
    );

    for (const day of days) {
      if (!occursOn(template, day)) continue;

      const exception = template.exceptions.find(
        (e) => format(e.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
      );
      if (exception?.skip) continue;

      if (existingDates.has(format(day, "yyyy-MM-dd"))) continue;

      creates.push({
        householdId,
        taskTemplateId: template.id,
        date: day,
        title: exception?.overrideTitle ?? template.title,
        description: exception?.overrideDescription ?? template.description ?? null,
        category: template.category ?? null,
        status: "TODO",
      });
    }
  }

  if (creates.length > 0) {
    await prisma.taskInstance.createMany({ data: creates });
  }
}

/** Standard include shape for TaskInstance queries — used everywhere. */
export const taskInstanceInclude = {
  completedBy: { select: { id: true, name: true } },
  taskTemplate: {
    select: {
      id: true,
      defaultDuration: true,
      isOneOff: true,
      recurrenceRule: { select: { type: true } },
    },
  },
  comments: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

/** Fetch instances for a date range (after generating them). */
export async function getInstancesForRange(
  householdId: string,
  from: Date,
  to: Date,
) {
  await generateInstances(householdId, from, to);

  return prisma.taskInstance.findMany({
    where: {
      householdId,
      date: { gte: from, lte: to },
    },
    include: taskInstanceInclude,
    orderBy: [{ date: "asc" }, { title: "asc" }],
  });
}
