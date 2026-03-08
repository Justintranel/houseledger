/**
 * Feature flag system.
 * Defaults are defined here. DB overrides win.
 * Usage: const chatEnabled = await isEnabled(householdId, "chat");
 */
import { prisma } from "./db";

const DEFAULTS: Record<string, boolean> = {
  chat: true,
  inventory: true,
  approvals: true,
  timetracking: true,
  contracts: false, // off by default until e-sign provider configured
  vendors: true,
  houseprofile: true,
};

export async function isEnabled(householdId: string, key: string): Promise<boolean> {
  const override = await prisma.featureFlag.findUnique({
    where: { householdId_key: { householdId, key } },
  });
  if (override !== null) return override.enabled;
  return DEFAULTS[key] ?? false;
}

/** Returns all flags for a household (merged with defaults). */
export async function getAllFlags(householdId: string): Promise<Record<string, boolean>> {
  const overrides = await prisma.featureFlag.findMany({ where: { householdId } });
  const map: Record<string, boolean> = { ...DEFAULTS };
  for (const o of overrides) map[o.key] = o.enabled;
  return map;
}
