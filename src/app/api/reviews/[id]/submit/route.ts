import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireHouseholdRole();

    if (!can(auth.role, "reviews:write"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;

    const review = await prisma.performanceReview.findUnique({
      where: { id },
      include: { categoryScores: true },
    });

    if (!review)
      return NextResponse.json({ error: "Review not found" }, { status: 404 });

    if (review.householdId !== auth.householdId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (review.status !== "DRAFT")
      return NextResponse.json(
        { error: "Only DRAFT reviews can be submitted." },
        { status: 422 },
      );

    // Validate: overallRating must be set.
    if (!review.overallRating) {
      return NextResponse.json(
        { error: "overallRating is required before submitting." },
        { status: 422 },
      );
    }

    // Validate: at least some categoryScores must exist.
    if (!review.categoryScores || review.categoryScores.length === 0) {
      return NextResponse.json(
        { error: "At least one category score is required before submitting." },
        { status: 422 },
      );
    }

    const submitted = await prisma.performanceReview.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      include: {
        reviewee: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        categoryScores: true,
      },
    });

    return NextResponse.json(submitted);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/reviews/[id]/submit]", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
