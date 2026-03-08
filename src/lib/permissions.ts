/**
 * Server-side permission helpers.
 * Import these in API routes and server actions to enforce authorization.
 */

export type UserRole = "OWNER" | "FAMILY" | "MANAGER";

/** Things every authenticated member can do */
const BASE = ["tasks:read", "chat:read", "chat:write", "notes:read"];

const PERMISSIONS: Record<UserRole, string[]> = {
  OWNER: [
    ...BASE,
    "tasks:write", "tasks:delete",
    "notes:write", "notes:private",
    "questions:write", "questions:answer",
    "inventory:read", "inventory:write",
    "approvals:read", "approvals:approve", "approvals:deny", "approvals:write",
    "receipts:upload",
    "houseprofile:read", "houseprofile:write",
    "vendors:read", "vendors:write",
    "recipes:read", "recipes:write",
    "mealplan:read", "mealplan:write",
    "travel:read", "travel:write",
    "calendar:read", "calendar:write",
    "reviews:read", "reviews:write",
    "time:read", "time:approve",
    "contracts:read", "contracts:write", "contracts:sign",
    "billing:read", "billing:write",
    "settings:read", "settings:write",
    "roles:manage",
    "audit:read",
    "members:invite",
  ],
  FAMILY: [
    ...BASE,
    "tasks:write",
    "notes:write",
    "questions:write", "questions:answer",
    "inventory:read",
    "approvals:read", "approvals:write",
    "receipts:upload",
    "houseprofile:read", "houseprofile:write",
    "vendors:read",
    "recipes:read", "recipes:write",
    "mealplan:read", "mealplan:write",
    "travel:read", "travel:write",
    "calendar:read", "calendar:write",
    "reviews:read", "reviews:write",
    "time:read",
    "contracts:read",
    // NOT: billing, settings, roles, approvals:approve, time:approve
  ],
  MANAGER: [
    ...BASE,
    "tasks:write",
    "notes:write",
    "questions:write",
    "inventory:read", "inventory:write",
    "approvals:write",
    "receipts:upload",
    "houseprofile:read",
    "vendors:read",
    "recipes:read",
    "mealplan:read",
    "travel:read",
    "calendar:read",
    "reviews:read",
    "time:write",
    "contracts:read",
    // NOT: billing, settings, roles, approvals:approve, time:approve, houseprofile:write
  ],
};

export function can(role: UserRole, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: UserRole, permission: string): void {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: role ${role} cannot ${permission}`);
  }
}
