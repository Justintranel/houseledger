import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  productUrl: z.string().optional(),
});

const postSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  servings: z.number().int().min(1).optional(),
  prepMins: z.number().int().min(0).optional(),
  cookMins: z.number().int().min(0).optional(),
  ingredients: z.array(ingredientSchema).default([]),
});

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const recipes = await prisma.recipe.findMany({
      where: { householdId: auth.householdId },
      orderBy: { title: "asc" },
    });
    return NextResponse.json(recipes);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/recipes]", err);
    return NextResponse.json({ error: "Failed to load recipes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "recipes:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );

    const recipe = await prisma.recipe.create({
      data: {
        householdId: auth.householdId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        servings: parsed.data.servings ?? null,
        prepMins: parsed.data.prepMins ?? null,
        cookMins: parsed.data.cookMins ?? null,
        ingredients: parsed.data.ingredients,
      },
    });
    return NextResponse.json(recipe, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/recipes]", err);
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
