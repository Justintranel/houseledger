import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminSignOutButton from "./AdminSignOutButton";

const NAV = [
  { href: "/admin", label: "Overview", icon: "📊", exact: true },
  { href: "/admin/accounts", label: "Accounts", icon: "🏠" },
  { href: "/admin/tickets", label: "Support Tickets", icon: "🎫" },
  { href: "/admin/audit", label: "Audit Log", icon: "📜" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Must be authenticated AND be a Super Admin
  if (!session?.user || !(session.user as any).isSuperAdmin) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col bg-slate-900 text-white h-full overflow-y-auto">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-white/10">
          <Image
            src="/images/logo.png"
            alt="The House Ledger"
            width={160}
            height={52}
            className="w-auto h-10 object-contain brightness-0 invert"
            priority
          />
          <p className="text-xs text-white/50 mt-1">Super Admin</p>
        </div>

        {/* Admin badge */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">
            🔐 Admin Portal
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pb-3 space-y-0.5 pt-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-2 pb-4 border-t border-white/10 pt-3">
          <AdminSignOutButton />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
