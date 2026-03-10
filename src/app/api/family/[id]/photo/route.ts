import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { requireHouseholdRole, AuthError } from "@/server/auth/requireHouseholdRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireHouseholdRole();
    const member = await prisma.familyMember.findFirst({
      where: { id: params.id, householdId: auth.householdId },
    });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File))
      return NextResponse.json({ error: "File is required" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(buffer, file.name, file.type);

    const updated = await prisma.familyMember.update({
      where: { id: params.id },
      data: { photoUrl: result.url },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    console.error("[POST /api/family/[id]/photo]", err);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
