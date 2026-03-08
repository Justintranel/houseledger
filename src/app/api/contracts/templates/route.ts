import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  body: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const templates = await prisma.contractTemplate.findMany({
      where: { householdId: hid },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (err) {
    console.error("[GET /api/contracts/templates]", err);
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as string;

  if (role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid" }, { status: 400 });

    const template = await prisma.contractTemplate.create({
      data: {
        householdId: hid,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        body: parsed.data.body,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("[POST /api/contracts/templates]", err);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
