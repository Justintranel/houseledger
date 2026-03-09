import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  url: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// PATCH — update a video's fields or sort order
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    if (auth.role !== "OWNER" && auth.role !== "FAMILY")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const video = await prisma.trainingVideo.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!video)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );

    const updated = await prisma.trainingVideo.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.url !== undefined && { url: parsed.data.url }),
        ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[PATCH /api/training/[id]]", err);
    return NextResponse.json({ error: "Failed to update training video" }, { status: 500 });
  }
}

// DELETE — remove a video
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireHouseholdRole();

    if (auth.role !== "OWNER" && auth.role !== "FAMILY")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const video = await prisma.trainingVideo.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!video)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.trainingVideo.delete({ where: { id: params.id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[DELETE /api/training/[id]]", err);
    return NextResponse.json({ error: "Failed to delete training video" }, { status: 500 });
  }
}
