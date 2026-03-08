import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(MEAL_TYPES),
  recipeId: z.string().optional(),
  customTitle: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to)
      return NextResponse.json({ error: "Query params 'from' and 'to' required" }, { status: 400 });

    const plans = await prisma.mealPlan.findMany({
      where: {
        householdId: auth.householdId,
        date: { gte: new Date(from + "T00:00:00"), lte: new Date(to + "T23:59:59") },
      },
      include: { recipe: true },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(plans);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/mealplan]", err);
    return NextResponse.json({ error: "Failed to load meal plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();
    if (!can(auth.role, "mealplan:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });

    const { date, mealType, recipeId, customTitle, notes } = parsed.data;

    if (recipeId) {
      const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
      if (!recipe || recipe.householdId !== auth.householdId)
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const plan = await prisma.mealPlan.create({
      data: {
        householdId: auth.householdId,
        date: new Date(date + "T12:00:00"),
        mealType,
        recipeId: recipeId ?? null,
        customTitle: customTitle ?? null,
        notes: notes ?? null,
      },
      include: { recipe: true },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/mealplan]", err);
    return NextResponse.json({ error: "Failed to create meal plan entry" }, { status: 500 });
  }
}
