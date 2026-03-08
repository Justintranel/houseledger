import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH — toggle ownerOnly on a custom question
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;
  const role = (session.user as any).role as string;
  if (role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    if (typeof body.ownerOnly !== "boolean")
      return NextResponse.json({ error: "ownerOnly must be a boolean" }, { status: 400 });

    const question = await prisma.houseProfileQuestion.findUnique({
      where: { id: params.id },
    });

    if (!question)
      return NextResponse.json({ error: "Question not found" }, { status: 404 });

    // Only custom questions belonging to this household may be patched
    if (!question.householdId || question.householdId !== hid)
      return NextResponse.json({ error: "Cannot modify a built-in question" }, { status: 403 });

    const updated = await prisma.houseProfileQuestion.update({
      where: { id: params.id },
      data: { ownerOnly: body.ownerOnly },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/profile/question/[id]]", err);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hid = session.user.householdId;
  const role = (session.user as any).role as string;
  if (role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const question = await prisma.houseProfileQuestion.findUnique({
      where: { id: params.id },
    });

    if (!question)
      return NextResponse.json({ error: "Question not found" }, { status: 404 });

    // Only allow deleting custom questions (householdId !== null) for this household
    if (!question.householdId || question.householdId !== hid)
      return NextResponse.json(
        { error: "Cannot delete a built-in question" },
        { status: 403 }
      );

    // Delete answers first, then the question
    await prisma.houseProfileAnswer.deleteMany({ where: { questionId: params.id } });
    await prisma.houseProfileQuestion.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/profile/question/[id]]", err);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
