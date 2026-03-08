"use client";
import { signOut } from "next-auth/react";

export default function AdminSignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/10 hover:text-white transition"
    >
      <span>🚪</span> Sign out
    </button>
  );
}
