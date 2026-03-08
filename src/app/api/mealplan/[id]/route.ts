import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "mealplan:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.mealPlan.findUnique({ where: { id: params.id } });
    if (!existing || existing.householdId !== auth.householdId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.mealPlan.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/mealplan/[id]]", err);
    return NextResponse.json({ error: "Failed to delete meal plan entry" }, { status: 500 });
  }
}
