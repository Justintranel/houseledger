import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categoryScoreSchema = z.object({
  categoryKey: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

const patchSchema = z.object({
  overallRating: z.number().int().min(1).max(5).optional(),
  strengths: z.string().max(5000).optional(),
  improvementAreas: z.string().max(5000).optional(),
  generalComments: z.string().max(5000).optional(),
  goalsNextMonth: z.string().max(5000).optional(),
  categoryScores: z.array(categoryScoreSchema).optional(),
});

type RouteContext = { params: { id: string } };

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireHouseholdRole();
    const { id } = params;

    // MANAGER: can only see their own SUBMITTED reviews.
    // OWNER / FAMILY: any review in their household.
    const whereClause =
      auth.role === "MANAGER"
        ? { id, revieweeId: auth.userId, status: "SUBMITTED" as const }
        : { id, householdId: auth.householdId };

    const review = await prisma.performanceReview.findFirst({
      where: whereClause,
      include: {
        reviewee: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        categoryScores: true,
      },
    });

    if (!review)
      return NextResponse.json({ error: "Review not found" }, { status: 404 });

    return NextResponse.json(review);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/reviews/[id]]", err);
    return NextResponse.json({ error: "Failed to load review" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireHouseholdRole();

    if (!can(auth.role, "reviews:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;

    const review = await prisma.performanceReview.findFirst({ where: { id, householdId: auth.householdId } });

    if (!review)
      return NextResponse.json({ error: "Review not found" }, { status: 404 });

    if (review.status !== "DRAFT")
      return NextResponse.json(
        { error: "Only DRAFT reviews can be updated." },
        { status: 422 },
      );

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );

    const { categoryScores, ...scalarFields } = parsed.data;

    // Upsert each category score by reviewId + categoryKey.
    if (categoryScores && categoryScores.length > 0) {
      for (const score of categoryScores) {
        await prisma.performanceReviewScore.upsert({
          where: {
            reviewId_categoryKey: {
              reviewId: id,
              categoryKey: score.categoryKey,
            },
          },
          create: {
            reviewId: id,
            categoryKey: score.categoryKey,
            rating: score.rating,
            comment: score.comment ?? null,
          },
          update: {
            rating: score.rating,
            comment: score.comment ?? null,
          },
        });
      }
    }

    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        ...(scalarFields.overallRating !== undefined && {
          overallRating: scalarFields.overallRating,
        }),
        ...(scalarFields.strengths !== undefined && {
          strengths: scalarFields.strengths,
        }),
        ...(scalarFields.improvementAreas !== undefined && {
          improvementAreas: scalarFields.improvementAreas,
        }),
        ...(scalarFields.generalComments !== undefined && {
          generalComments: scalarFields.generalComments,
        }),
        ...(scalarFields.goalsNextMonth !== undefined && {
          goalsNextMonth: scalarFields.goalsNextMonth,
        }),
      },
      include: {
        reviewee: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        categoryScores: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/reviews/[id]]", err);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireHouseholdRole();

    if (!can(auth.role, "reviews:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;

    const review = await prisma.performanceReview.findFirst({ where: { id, householdId: auth.householdId } });

    if (!review)
      return NextResponse.json({ error: "Review not found" }, { status: 404 });

    if (review.status !== "DRAFT")
      return NextResponse.json(
        { error: "Only DRAFT reviews can be deleted." },
        { status: 422 },
      );

    // Delete child scores first (cascade may handle this, but explicit is safer).
    await prisma.performanceReviewScore.deleteMany({ where: { reviewId: id } });
    await prisma.performanceReview.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/reviews/[id]]", err);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
