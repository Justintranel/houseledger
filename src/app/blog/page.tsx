import Link from "next/link";
import Image from "next/image";
import { posts } from "@/lib/blog";

const CATEGORY_COLORS: Record<string, string> = {
  "Homeowner Tips": "bg-emerald-100 text-emerald-700",
  "Home Management": "bg-brand-100 text-brand-700",
  "Industry Insights": "bg-amber-100 text-amber-700",
};

export const metadata = {
  title: "Blog | The House Ledger",
  description:
    "Expert advice on home management, house SOPs, hiring house managers, and building systems that keep your property running smoothly.",
};

export default function BlogPage() {
  const [featured, ...rest] = posts;

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
            <Link href="/blog" className="text-brand-600 font-medium">Blog</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">Log in</Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">Get started</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">The House Ledger Blog</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Expert advice on home management, house SOPs, and building systems that keep your property running smoothly.
          </p>
        </div>

        {/* Featured post */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group block card overflow-hidden mb-10 hover:shadow-lg transition-shadow"
        >
          <div className="md:flex">
            <div className="md:flex-1 p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[featured.category] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {featured.category}
                </span>
                <span className="text-xs text-slate-400">Featured</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-brand-600 transition-colors leading-snug">
                {featured.title}
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">{featured.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{featured.author}</span>
                <span>·</span>
                <span>{featured.date}</span>
                <span>·</span>
                <span>{featured.readTime}</span>
              </div>
            </div>
            <div className="md:w-72 bg-gradient-to-br from-brand-800 to-brand-600 flex items-center justify-center p-10 shrink-0">
              <span className="text-6xl opacity-60">🏠</span>
            </div>
          </div>
        </Link>

        {/* Rest of posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group card p-6 flex flex-col hover:shadow-lg transition-shadow"
            >
              <div className="mb-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {post.category}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 pt-3 border-t border-slate-100">
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-slate-50 rounded-2xl p-10 border border-slate-200">
          <p className="text-2xl font-bold text-slate-900 mb-2">Ready to run your home like a pro?</p>
          <p className="text-slate-500 mb-6">
            Start your free 14-day trial. No credit card required.
          </p>
          <Link href="/signup" className="btn-primary px-8 py-3 text-base">
            Get started for free →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 mt-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} The House Ledger System. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-slate-600">Home</Link>
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
