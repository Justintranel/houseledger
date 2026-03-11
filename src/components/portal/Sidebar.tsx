"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  flag: string | null;
  /** null = all roles; array = only these roles */
  roles: string[] | null;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "The Ledger",
    items: [
      { href: "/dashboard",             icon: "🏠", label: "Dashboard",        flag: null,           roles: null },
      { href: "/dashboard/profile",   icon: "🏡", label: "House Profile",    flag: "houseprofile", roles: null },
      { href: "/dashboard/sop",       icon: "📖", label: "House SOPs",       flag: null,           roles: null },
      { href: "/dashboard/vendors",     icon: "🔨", label: "Vendors",          flag: "vendors",      roles: null },
      { href: "/dashboard/maintenance", icon: "🔩", label: "Maintenance",       flag: null,           roles: null },
      { href: "/dashboard/family",    icon: "👨‍👩‍👧‍👦", label: "Family Bio",       flag: null,           roles: null },
      { href: "/dashboard/emergency", icon: "🚨", label: "Emergency Info",    flag: null,           roles: null },
      { href: "/dashboard/training",  icon: "🎓", label: "Training Videos",  flag: null,           roles: null },
      { href: "/dashboard/house-bible", icon: "📚", label: "House Ledger",     flag: null,           roles: null },
    ],
  },
  {
    label: "House Operations",
    items: [
      { href: "/dashboard/today",      icon: "✅",  label: "Today",           flag: null,          roles: ["MANAGER"] },
      { href: "/dashboard/tasks",      icon: "📋",  label: "Assign Tasks",    flag: null,          roles: ["OWNER", "FAMILY"] },
      { href: "/dashboard/tasks",      icon: "📋",  label: "Tasks",           flag: null,          roles: ["MANAGER"] },
      { href: "/dashboard/chat",       icon: "💬",  label: "Chat",            flag: "chat",        roles: null },
      { href: "/dashboard/notes",      icon: "📝",  label: "Notes",           flag: null,          roles: null },
      { href: "/dashboard/inventory",  icon: "📦",  label: "Inventory",       flag: "inventory",   roles: null },
      { href: "/dashboard/approvals",  icon: "💳",  label: "Approvals",       flag: "approvals",   roles: null },
      { href: "/dashboard/meals",      icon: "🍽️", label: "Meal Planner",    flag: null,          roles: null },
      { href: "/dashboard/travel",     icon: "✈️",  label: "Travel",          flag: null,          roles: null },
      { href: "/dashboard/calendar",   icon: "📅",  label: "Family Calendar", flag: null,          roles: null },
    ],
  },
  {
    label: "Compliance / Review",
    items: [
      { href: "/dashboard/time",               icon: "⏱️",  label: "Timesheet",           flag: "timetracking", roles: null },
      { href: "/dashboard/time/clock",         icon: "⏲️",  label: "Clock In/Out",         flag: "timetracking", roles: ["MANAGER"] },
      { href: "/dashboard/contracts",          icon: "📄",  label: "Contracts",            flag: "contracts",    roles: null },
      { href: "/dashboard/settings/workers",   icon: "👥",  label: "Workers & Rates",      flag: null,           roles: ["OWNER"] },
      { href: "/dashboard/reviews",            icon: "⭐",  label: "Performance Reviews",  flag: null,           roles: ["OWNER", "FAMILY"] },
      { href: "/dashboard/reviews/my-reviews", icon: "⭐",  label: "Performance Reviews",  flag: null,           roles: ["MANAGER"] },
      { href: "/dashboard/payroll",            icon: "💸",  label: "Payroll",              flag: null,           roles: ["OWNER"] },
    ],
  },
];

const ADMIN_NAV = [
  { href: "/dashboard/settings", icon: "⚙️", label: "Settings" },
  { href: "/dashboard/billing",  icon: "💰", label: "Billing" },
];

interface Props {
  role: string;
  householdName: string;
  flags: Record<string, boolean>;
  communityLabel?: string;
  communityUrl?: string;
}

export default function Sidebar({ role, householdName, flags, communityLabel, communityUrl }: Props) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-brand-900 text-white h-full overflow-y-auto">
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
        <p className="text-xs text-white/50 mt-1 truncate">{householdName}</p>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          {role === "MANAGER" ? "House Manager" : role === "OWNER" ? "Owner" : role === "FAMILY" ? "Family" : role}
        </span>
      </div>


      {/* ── Hire + Community quick links (OWNER only, top of nav) ── */}
      {role === "OWNER" && (
        <div className="px-2 pb-1 space-y-0.5">
          <Link
            href="/dashboard/hire"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${isActive("/dashboard/hire") ? "bg-white/15 text-white font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <span>🤝</span> Hire Manager
          </Link>
          <Link
            href="/dashboard/hire/recruit"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${isActive("/dashboard/hire/recruit") ? "bg-white/15 text-white font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <span>🔍</span> Recruit For Me
          </Link>
          <a
            href={communityUrl || "https://www.skool.com/thehouseledger"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <span>👩</span> {communityLabel || "Community"}
          </a>
          <div className="mx-1 border-t border-white/10 mt-1" />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 pb-3">
        {NAV_SECTIONS.map((section, sectionIndex) => {
          // Filter items for this section before rendering the section at all
          const visibleItems = section.items.filter((item) => {
            if (item.flag && !flags[item.flag]) return false;
            if (item.roles && !item.roles.includes(role)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              {/* Separator between sections (not before the first) */}
              {sectionIndex > 0 && (
                <div className="mx-3 border-t border-white/10 mb-1" />
              )}

              {/* Section header */}
              <div className="pt-3 pb-1 px-3">
                <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                  {section.label}
                </span>
              </div>

              {/* Section items */}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${active ? "bg-white/15 text-white font-medium" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

      </nav>

      {/* ── Bottom nav ──────────────────────────────────────────────── */}
      <div className="px-2 border-t border-white/10 pt-3 pb-2 space-y-0.5">

        {/* My Profile */}
        <Link
          href="/dashboard/account"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${isActive("/dashboard/account") ? "bg-white/15 text-white font-medium" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
        >
          <span>👤</span> My Profile
        </Link>

        {/* Admin: Settings + Billing (OWNER only) */}
        {role === "OWNER" && (
          <>
            <div className="px-3 pt-2 pb-0.5">
              <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Admin</span>
            </div>
            <Link
              href="/dashboard/settings"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${isActive("/dashboard/settings") ? "bg-white/15 text-white font-medium" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              <span>⚙️</span> Settings
            </Link>
            <Link
              href="/dashboard/billing"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${isActive("/dashboard/billing") ? "bg-white/15 text-white font-medium" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              <span>💰</span> Billing
            </Link>
          </>
        )}

        {/* Sign Out (right after Admin) */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/10 hover:text-white transition"
        >
          <span>🚪</span> Sign Out
        </button>

        {/* Get Support — very bottom */}
        <div className="mx-3 border-t border-white/10 my-1" />
        <Link
          href="/dashboard/support"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${isActive("/dashboard/support") ? "bg-white/15 text-white font-medium" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
        >
          <span>🎫</span> Get Support
        </Link>
      </div>
    </aside>
  );
}
