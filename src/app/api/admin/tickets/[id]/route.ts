import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireSuperAdmin, AdminAuthError } from "@/server/auth/requireSuperAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — full ticket with comments
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireSuperAdmin();

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        household: { select: { id: true, name: true, accountStatus: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, isSuperAdmin: true } } },
        },
      },
    });

    if (!ticket)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(ticket);
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to load ticket" }, { status: 500 });
  }
}

const patchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  adminNote: z.string().max(5000).optional().nullable(),
});

// PATCH — update ticket status / priority / admin note
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireSuperAdmin();

    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const data: Record<string, any> = { ...parsed.data };

    // Auto-set resolvedAt / closedAt timestamps
    if (parsed.data.status === "RESOLVED" && !ticket.resolvedAt) data.resolvedAt = new Date();
    if (parsed.data.status === "CLOSED" && !ticket.closedAt) data.closedAt = new Date();

    const updated = await prisma.supportTicket.update({
      where: { id: params.id },
      data,
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.userId,
        action: "UPDATE_TICKET",
        entityType: "SupportTicket",
        entityId: params.id,
        note: `Ticket "${ticket.subject}" updated`,
        before: { status: ticket.status, priority: ticket.priority },
        after: parsed.data,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
