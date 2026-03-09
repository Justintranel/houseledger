"use client";

import { useState, useEffect } from "react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  author: string;
  category: string | null;
  readTime: number | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  "Home Management",
  "House Manager Tips",
  "Homeowner Advice",
  "Cleaning & Maintenance",
  "Organization",
  "Technology",
  "Case Studies",
];

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  body: "",
  author: "The House Ledger Team",
  category: "",
  readTime: "",
  published: false,
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      if (res.ok) setPosts(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(post: BlogPost) {
    setEditing(post);
    setForm({
      title: post.title,
      excerpt: post.excerpt ?? "",
      body: post.body,
      author: post.author,
      category: post.category ?? "",
      readTime: post.readTime?.toString() ?? "",
      published: post.published,
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function save() {
    setError("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.body.trim()) { setError("Content is required."); return; }

    setSaving(true);
    try {
      const url = editing ? `/api/admin/blog/${editing.id}` : "/api/admin/blog";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }

      await load();
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(post: BlogPost) {
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) await load();
  }

  async function deletePost(id: string) {
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteConfirm(null);
      await load();
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Posts</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Create and manage posts for the public blog
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
        >
          + New Post
        </button>
      </div>

      {/* Form / Editor */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? "Edit Post" : "New Blog Post"}
            </h2>
            <button
              onClick={closeForm}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="5 Things Every Homeowner Should Know…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Excerpt{" "}
                <span className="text-slate-400 font-normal">(shown in blog list)</span>
              </label>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="A short summary of the post…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Content <span className="text-red-400">*</span>{" "}
                <span className="text-slate-400 font-normal">(HTML supported)</span>
              </label>
              <textarea
                rows={14}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="<p>Write your blog post here…</p>"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
              />
            </div>

            {/* Row: Author / Category / Read Time */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Author</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">— None —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Read Time (min)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.readTime}
                  onChange={(e) => setForm((f) => ({ ...f, readTime: e.target.value }))}
                  placeholder="5"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  form.published ? "bg-emerald-500" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.published ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-slate-700">
                {form.published ? "Published — visible on public blog" : "Draft — not visible publicly"}
              </span>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
              >
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Post"}
              </button>
              <button
                onClick={closeForm}
                className="px-4 py-2 text-slate-600 text-sm rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <p className="text-slate-400 text-sm">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-4xl mb-3">✍️</p>
          <p className="text-slate-600 font-medium">No blog posts yet</p>
          <p className="text-slate-400 text-sm mt-1">Click "New Post" to write your first article.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Author</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 line-clamp-1">{post.title}</p>
                    {post.excerpt && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{post.excerpt}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {post.category ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{post.author}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(post)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition ${
                        post.published
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${post.published ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {post.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(post)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Edit
                      </button>
                      {deleteConfirm === post.id ? (
                        <span className="flex items-center gap-1">
                          <button
                            onClick={() => deletePost(post.id)}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-slate-400 hover:underline"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(post.id)}
                          className="text-xs text-slate-400 hover:text-red-500 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
