import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin(session: any) {
  if (!session?.user || !(session.user as any).isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// GET /api/admin/blog/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

// PATCH /api/admin/blog/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, excerpt, body: postBody, author, category, readTime, published } = body;

  const wasPublished = existing.published;
  const isNowPublished = published === true;

  const post = await prisma.blogPost.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(excerpt !== undefined && { excerpt: excerpt?.trim() || null }),
      ...(postBody !== undefined && { body: postBody.trim() }),
      ...(author !== undefined && { author: author?.trim() || "The House Ledger Team" }),
      ...(category !== undefined && { category: category?.trim() || null }),
      ...(readTime !== undefined && { readTime: readTime ? parseInt(readTime) : null }),
      ...(published !== undefined && {
        published: isNowPublished,
        publishedAt: isNowPublished && !wasPublished ? new Date() : existing.publishedAt,
      }),
    },
  });

  return NextResponse.json(post);
}

// DELETE /api/admin/blog/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.blogPost.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
