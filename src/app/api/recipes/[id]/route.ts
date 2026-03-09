import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  servings: z.number().int().min(1).nullable().optional(),
  prepMins: z.number().int().min(0).nullable().optional(),
  cookMins: z.number().int().min(0).nullable().optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.string().min(1),
    productUrl: z.string().optional(),
  })).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "recipes:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.recipe.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );

    const updated = await prisma.recipe.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/recipes/[id]]", err);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "recipes:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const existing = await prisma.recipe.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.recipe.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/recipes/[id]]", err);
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
  }
}
