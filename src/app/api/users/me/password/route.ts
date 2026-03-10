import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword)
      return NextResponse.json(
        { error: "Both current and new passwords are required" },
        { status: 400 }
      );

    if (typeof newPassword !== "string" || newPassword.length < 8)
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash)
      return NextResponse.json(
        { error: "Cannot change password for this account" },
        { status: 400 }
      );

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid)
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/users/me/password]", err);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
