"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function AccountPage() {
  const { data: session, update } = useSession();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setProfileImageUrl(data.profileImageUrl ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          profileImageUrl: preview ?? profileImageUrl,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save.");
        return;
      }
      const updated = await res.json();
      setProfileImageUrl(updated.profileImageUrl);
      setPreview(null);
      setSuccess(true);
      // Update the session name
      await update({ name: updated.name });
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const avatar = preview ?? profileImageUrl;
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const role = (session?.user as any)?.role as string | undefined;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">My Profile</h1>
      <p className="text-slate-500 text-sm mb-8">
        {role === "MANAGER"
          ? "Your profile photo and contact info are visible to the household owner."
          : "Update your name, phone number, and profile photo."}
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile photo */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {initials || "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 text-white rounded-full flex items-center justify-center shadow hover:bg-brand-700 transition text-sm"
              title="Change photo"
            >
              📷
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Profile Photo</p>
            <p className="text-xs text-slate-400 mt-0.5">JPG or PNG, max 2 MB</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-brand-600 hover:underline mt-1 block"
            >
              Upload new photo
            </button>
            {(preview || profileImageUrl) && (
              <button
                type="button"
                onClick={() => { setPreview(null); setProfileImageUrl(null); }}
                className="text-xs text-red-500 hover:underline mt-0.5 block"
              >
                Remove photo
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-full"
            placeholder="Your full name"
            required
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
          <input
            type="email"
            value={session?.user?.email ?? ""}
            className="input w-full opacity-60"
            disabled
          />
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Cell Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input w-full"
            placeholder="(555) 000-0000"
          />
          {role === "MANAGER" && (
            <p className="text-xs text-slate-400 mt-1">
              Shown to the household owner on their dashboard.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">✓ Profile saved successfully!</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      {/* Replay feature tour */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Feature Tour</h2>
        <p className="text-xs text-slate-400 mb-3">
          Re-run the guided walkthrough of all The House Ledger features.
        </p>
        <button
          type="button"
          onClick={() => {
            try { localStorage.removeItem("hl_tour_v1_seen"); } catch {}
            window.location.reload();
          }}
          className="btn-secondary text-sm px-4 py-2"
        >
          🗺️ Replay Feature Tour
        </button>
      </div>
    </div>
  );
}
