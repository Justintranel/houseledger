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

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/admin/blog — list all posts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      author: true,
      category: true,
      readTime: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(posts);
}

// POST /api/admin/blog — create a new post
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const body = await req.json();
  const { title, excerpt, body: postBody, author, category, readTime, published } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!postBody?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // Generate unique slug from title
  const baseSlug = slugify(title.trim());
  let slug = baseSlug;
  let suffix = 0;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title: title.trim(),
      excerpt: excerpt?.trim() || null,
      body: postBody.trim(),
      author: author?.trim() || "The House Ledger Team",
      category: category?.trim() || null,
      readTime: readTime ? parseInt(readTime) : null,
      published: published === true,
      publishedAt: published === true ? new Date() : null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
