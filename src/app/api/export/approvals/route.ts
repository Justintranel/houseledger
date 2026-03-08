import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const requests = await prisma.purchaseRequest.findMany({
      where: {
        householdId: hid,
        status: "APPROVED",
      },
      orderBy: { createdAt: "asc" },
      include: {
        requester: { select: { name: true } },
        approver: { select: { name: true } },
      },
    });

    const headers = [
      "Date",
      "Vendor",
      "Amount",
      "Category",
      "Reason",
      "Approved By",
    ];

    const rows = requests.map((req) => [
      escapeCSV(req.createdAt.toISOString().slice(0, 10)),
      escapeCSV(req.vendor),
      escapeCSV(`$${req.amount.toFixed(2)}`),
      escapeCSV(req.category),
      escapeCSV(req.reason),
      escapeCSV(req.approver?.name),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=approvals.csv",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/export/approvals]", err);
    return NextResponse.json(
      { error: "Failed to export approvals" },
      { status: 500 }
    );
  }
}
