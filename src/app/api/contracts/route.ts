import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;

  try {
    const contracts = await prisma.contractDocument.findMany({
      where: { householdId: hid },
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { id: true, name: true } },
        signer: { select: { id: true, name: true } },
        actions: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(contracts);
  } catch (err) {
    console.error("[GET /api/contracts]", err);
    return NextResponse.json({ error: "Failed to load contracts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.householdId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hid = session.user.householdId;
  const role = (session.user as any).role as "OWNER" | "FAMILY" | "MANAGER";
  const userId = (session.user as any).id as string;

  if (role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      // Template-based contract
      const body = await req.json();
      const { title, templateId } = body;

      if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
      if (!templateId) return NextResponse.json({ error: "templateId is required" }, { status: 400 });

      const template = await prisma.contractTemplate.findFirst({ where: { id: templateId, householdId: hid } });
      if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

      const contract = await prisma.contractDocument.create({
        data: { householdId: hid, title: title.trim(), templateId, status: "DRAFT" },
        include: {
          template: { select: { id: true, name: true } },
          signer: { select: { id: true, name: true } },
          actions: { include: { user: { select: { id: true, name: true } } } },
        },
      });

      await prisma.contractAction.create({ data: { contractId: contract.id, userId, action: "TEMPLATE", notes: `Created from template: "${template.name}"` } });
      return NextResponse.json(contract, { status: 201 });
    }

    // File upload
    const formData = await req.formData();
    const title = formData.get("title");
    const file = formData.get("file");

    if (!title || typeof title !== "string" || !title.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!file || !(file instanceof File)) return NextResponse.json({ error: "File is required" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadFile(buffer, file.name, file.type);
    const fileUrl = uploadResult.url;

    const contract = await prisma.contractDocument.create({
      data: { householdId: hid, title: title.trim(), status: "DRAFT", fileUrl, fileName: file.name },
      include: {
        template: { select: { id: true, name: true } },
        signer: { select: { id: true, name: true } },
        actions: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    await prisma.contractAction.create({ data: { contractId: contract.id, userId, action: "UPLOAD", notes: `Uploaded "${file.name}"` } });
    return NextResponse.json(contract, { status: 201 });
  } catch (err) {
    console.error("[POST /api/contracts]", err);
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
