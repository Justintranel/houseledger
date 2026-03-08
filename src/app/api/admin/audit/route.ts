import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin, AdminAuthError } from "@/server/auth/requireSuperAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);

    const logs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(logs);
  } catch (err) {
    if (err instanceof AdminAuthError)
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Failed to load audit log" }, { status: 500 });
  }
}
