import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string;
  if (role !== "OWNER") redirect("/dashboard");

  const baseUrl =
    process.env.NEXTAUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

  async function fetchJson(path: string) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
      if (res.ok) return res.json();
    } catch {}
    return null;
  }

  const [household, flags] = await Promise.all([
    fetchJson("/api/household"),
    fetchJson("/api/flags"),
  ]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <SettingsClient
        initialHousehold={household}
        initialFlags={flags ?? []}
      />
    </div>
  );
}
