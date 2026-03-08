import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  const template = await prisma.contractTemplate.findFirst({
    where: { id: params.id, householdId: hid },
  });

  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as string;

  if (role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const template = await prisma.contractTemplate.findFirst({ where: { id: params.id, householdId: hid } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.contractTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
