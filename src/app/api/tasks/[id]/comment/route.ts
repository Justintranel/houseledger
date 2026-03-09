import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  body: z.string().min(1).max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const instance = await prisma.taskInstance.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const comment = await prisma.taskComment.create({
      data: {
        taskInstanceId: params.id,
        userId: auth.userId,
        body: parsed.data.body,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/tasks/[id]/comment]", err);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
