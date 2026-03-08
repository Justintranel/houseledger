import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: "This link has already been used" }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "This link has expired. Please request a new one." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
