import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, published: true },
    select: { title: true, excerpt: true },
  });
  if (!post) return {};
  return {
    title: `${post.title} | The House Ledger Blog`,
    description: post.excerpt ?? undefined,
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  "Home Management": "bg-brand-100 text-brand-700",
  "House Manager Tips": "bg-violet-100 text-violet-700",
  "Homeowner Advice": "bg-emerald-100 text-emerald-700",
  "Cleaning & Maintenance": "bg-cyan-100 text-cyan-700",
  "Organization": "bg-amber-100 text-amber-700",
  "Technology": "bg-sky-100 text-sky-700",
  "Case Studies": "bg-rose-100 text-rose-700",
};

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, published: true },
  });
  if (!post) notFound();

  const related = await prisma.blogPost.findMany({
    where: { published: true, slug: { not: post.slug } },
    orderBy: { publishedAt: "desc" },
    take: 2,
    select: { slug: true, title: true, category: true, readTime: true },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo.png"
              alt="The House Ledger"
              width={140}
              height={46}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="/features" className="hover:text-brand-600 transition">Features</Link>
            <Link href="/pricing" className="hover:text-brand-600 transition">Pricing</Link>
            <Link href="/blog" className="hover:text-brand-600 transition">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">Log in</Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">Get started</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        {/* Article header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {post.category && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-600"}`}>
                {post.category}
              </span>
            )}
            {post.readTime && (
              <span className="text-xs text-slate-400">{post.readTime} min read</span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-slate-500 leading-relaxed mb-6">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">
              HL
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{post.author}</p>
              {post.publishedAt && (
                <p className="text-xs text-slate-400">
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Article content */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* CTA */}
        <div className="mt-14 bg-brand-900 text-white rounded-2xl p-8 text-center">
          <p className="text-xl font-bold mb-2">Try The House Ledger System free for 7 days</p>
          <p className="text-white/70 text-sm mb-5">
            Everything you need to run your home professionally — tasks, SOPs, approvals, time tracking, and more.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-brand-900 font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-white/90 transition"
          >
            Get started →
          </Link>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-lg font-bold text-slate-900 mb-5">More from the blog</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group card p-5 hover:shadow-lg transition-shadow"
                >
                  {p.category && (
                    <div className="mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] ?? "bg-slate-100 text-slate-600"}`}>
                        {p.category}
                      </span>
                    </div>
                  )}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug mb-1">
                    {p.title}
                  </h3>
                  {p.readTime && (
                    <p className="text-xs text-slate-400">{p.readTime} min read</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} The House Ledger System. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-slate-600">Home</Link>
            <Link href="/blog" className="hover:text-slate-600">Blog</Link>
            <Link href="/features" className="hover:text-slate-600">Features</Link>
            <Link href="/pricing" className="hover:text-slate-600">Pricing</Link>
            <Link href="/terms" className="hover:text-slate-600">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
