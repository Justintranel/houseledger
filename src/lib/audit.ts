import { prisma } from "./db";
import { AuditAction } from "@prisma/client";

export async function audit({
  householdId,
  userId,
  action,
  entityType,
  entityId,
  before,
  after,
  note,
}: {
  householdId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: object;
  after?: object;
  note?: string;
}) {
  await prisma.auditLog.create({
    data: {
      householdId,
      userId,
      action,
      entityType,
      entityId,
      before: before ?? undefined,
      after: after ?? undefined,
      note,
    },
  });
}
