import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin, AdminAuthError } from "@/server/auth/requireSuperAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("q");

    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(priority ? { priority: priority as any } : {}),
        ...(search
          ? {
              OR: [
                { subject: { contains: search, mode: "insensitive" } },
                { body: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        household: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [
        // URGENT + OPEN first
        { status: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(tickets);
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[GET /api/admin/tickets]", err);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}
