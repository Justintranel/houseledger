import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  householdName: z.string().min(1).max(200),
  address: z.string().optional(),
  familyEmails: z.array(z.string().email()).optional().default([]),
  managerEmail: z.string().email().optional(),
  workDays: z.array(z.number()).optional().default([]),
  workStart: z.string().optional(),
  workEnd: z.string().optional(),
  includeStarterTasks: z.boolean().optional().default(false),
});

async function upsertUserAndAddMember(
  email: string,
  householdId: string,
  role: "FAMILY" | "MANAGER"
) {
  const lowerEmail = email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email: lowerEmail } });

  if (!user) {
    const tempPassword = await bcrypt.hash(
      Math.random().toString(36).slice(-12),
      10
    );
    user = await prisma.user.create({
      data: {
        email: lowerEmail,
        name: lowerEmail.split("@")[0],
        passwordHash: tempPassword,
      },
    });
  }

  const existing = await prisma.householdMember.findFirst({
    where: { userId: user.id, householdId },
  });

  if (!existing) {
    await prisma.householdMember.create({
      data: { userId: user.id, householdId, role },
    });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const householdId = (session.user as any).householdId as string | undefined;

  if (!householdId) {
    return NextResponse.json(
      { error: "No household associated with your account" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const {
      householdName,
      address,
      familyEmails,
      managerEmail,
      workDays,
      workStart,
      workEnd,
      includeStarterTasks,
    } = parsed.data;

    // Update household — set trial end date 7 days from now
    await prisma.household.update({
      where: { id: householdId },
      data: {
        name: householdName,
        address: address ?? null,
        workDays,
        workStart: workStart ?? null,
        workEnd: workEnd ?? null,
        onboardingCompleted: true,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        // accountStatus defaults to TRIALING in schema
      },
    });

    // Create/invite family members
    for (const email of familyEmails) {
      await upsertUserAndAddMember(email, householdId, "FAMILY");
    }

    // Create/invite manager
    if (managerEmail) {
      await upsertUserAndAddMember(managerEmail, householdId, "MANAGER");
    }

    // Create starter task templates
    if (includeStarterTasks) {
      const starterTasks = [
        { title: "Morning walkthrough", category: "Daily" },
        { title: "Grocery inventory check", category: "Daily" },
        { title: "Mail & packages check", category: "Daily" },
      ];

      for (const task of starterTasks) {
        await prisma.taskTemplate.create({
          data: {
            title: task.title,
            category: task.category,
            householdId,
          },
        });
      }
    }

    // Send welcome email to the owner
    try {
      const owner = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      if (owner) {
        await sendWelcomeEmail(owner.email, owner.name, householdName);
      }
    } catch (emailErr) {
      console.error("[onboarding] welcome email failed:", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/onboarding]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
