import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH — edit a question (OWNER/FAMILY only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; qid: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    if (auth.role !== "OWNER" && auth.role !== "FAMILY")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const q = await prisma.trainingVideoQuestion.findFirst({
      where: { id: params.qid, video: { householdId: auth.householdId } },
    });
    if (!q)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = z.object({ question: z.string().min(1).max(1000) }).safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const updated = await prisma.trainingVideoQuestion.update({
      where: { id: params.qid },
      data: { question: parsed.data.question },
      include: { answers: { include: { user: { select: { id: true, name: true } } } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

// DELETE — remove a question (OWNER/FAMILY only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; qid: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    if (auth.role !== "OWNER" && auth.role !== "FAMILY")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const q = await prisma.trainingVideoQuestion.findFirst({
      where: { id: params.qid, video: { householdId: auth.householdId } },
    });
    if (!q)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.trainingVideoQuestion.delete({ where: { id: params.qid } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
