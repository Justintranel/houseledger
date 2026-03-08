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

const postSchema = z.object({
  revieweeId: z.string().min(1),
  reviewMonth: z.number().int().min(1).max(12),
  reviewYear: z.number().int().min(2000).max(2100),
  overallRating: z.number().int().min(1).max(5).optional(),
  strengths: z.string().max(5000).optional(),
  improvementAreas: z.string().max(5000).optional(),
  generalComments: z.string().max(5000).optional(),
  goalsNextMonth: z.string().max(5000).optional(),
  categoryScores: z.array(categoryScoreSchema).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();

    const isManager = auth.role === "MANAGER";

    const reviews = await prisma.performanceReview.findMany({
      where: isManager
        ? { revieweeId: auth.userId, status: "SUBMITTED" }
        : { householdId: auth.householdId },
      include: {
        reviewee: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        categoryScores: true,
      },
      orderBy: [{ reviewYear: "desc" }, { reviewMonth: "desc" }],
    });

    return NextResponse.json(reviews);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/reviews]", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireHouseholdRole();

    if (!can(auth.role, "reviews:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );

    const {
      revieweeId,
      reviewMonth,
      reviewYear,
      overallRating,
      strengths,
      improvementAreas,
      generalComments,
      goalsNextMonth,
      categoryScores,
    } = parsed.data;

    // Check if a SUBMITTED review already exists for this combo (conflict).
    const existingSubmitted = await prisma.performanceReview.findFirst({
      where: {
        householdId: auth.householdId,
        revieweeId,
        reviewMonth,
        reviewYear,
        status: "SUBMITTED",
      },
    });

    if (existingSubmitted) {
      return NextResponse.json(
        { error: "A submitted review already exists for this manager and period." },
        { status: 409 },
      );
    }

    // If a DRAFT already exists for this combo, update it instead of creating.
    const existingDraft = await prisma.performanceReview.findFirst({
      where: {
        householdId: auth.householdId,
        revieweeId,
        reviewMonth,
        reviewYear,
        status: "DRAFT",
      },
    });

    if (existingDraft) {
      // Upsert category scores if provided, then update scalar fields.
      if (categoryScores && categoryScores.length > 0) {
        for (const score of categoryScores) {
          await prisma.performanceReviewScore.upsert({
            where: {
              reviewId_categoryKey: {
                reviewId: existingDraft.id,
                categoryKey: score.categoryKey,
              },
            },
            create: {
              reviewId: existingDraft.id,
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
        where: { id: existingDraft.id },
        data: {
          overallRating: overallRating ?? existingDraft.overallRating,
          strengths: strengths ?? existingDraft.strengths,
          improvementAreas: improvementAreas ?? existingDraft.improvementAreas,
          generalComments: generalComments ?? existingDraft.generalComments,
          goalsNextMonth: goalsNextMonth ?? existingDraft.goalsNextMonth,
        },
        include: {
          reviewee: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
          categoryScores: true,
        },
      });

      return NextResponse.json(updated, { status: 201 });
    }

    // Create a fresh DRAFT review with nested category scores.
    const review = await prisma.performanceReview.create({
      data: {
        householdId: auth.householdId,
        reviewerId: auth.userId,
        revieweeId,
        reviewMonth,
        reviewYear,
        overallRating: overallRating ?? null,
        strengths: strengths ?? null,
        improvementAreas: improvementAreas ?? null,
        generalComments: generalComments ?? null,
        goalsNextMonth: goalsNextMonth ?? null,
        status: "DRAFT",
        categoryScores:
          categoryScores && categoryScores.length > 0
            ? {
                create: categoryScores.map((s) => ({
                  categoryKey: s.categoryKey,
                  rating: s.rating,
                  comment: s.comment ?? null,
                })),
              }
            : undefined,
      },
      include: {
        reviewee: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        categoryScores: true,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/reviews]", err);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
