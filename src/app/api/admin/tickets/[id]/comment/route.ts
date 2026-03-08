import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireSuperAdmin, AdminAuthError } from "@/server/auth/requireSuperAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — add a comment (admin reply or internal note) to a ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireSuperAdmin();

    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = z.object({
      body: z.string().min(1).max(10000),
      isInternal: z.boolean().default(false),
    }).safeParse(body);

    if (!parsed.success)
      return NextResponse.json({ error: "Body is required" }, { status: 400 });

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: params.id,
        authorId: admin.userId,
        body: parsed.data.body,
        isInternal: parsed.data.isInternal,
      },
      include: { author: { select: { id: true, name: true, isSuperAdmin: true } } },
    });

    // Auto-move ticket to IN_PROGRESS if it was OPEN and admin replied publicly
    if (ticket.status === "OPEN" && !parsed.data.isInternal) {
      await prisma.supportTicket.update({
        where: { id: params.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
