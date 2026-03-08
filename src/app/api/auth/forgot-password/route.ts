import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success — don't reveal if email exists
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Expire any existing tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { expiresAt: new Date() },
    });

    // Create a new token (expires in 1 hour)
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
