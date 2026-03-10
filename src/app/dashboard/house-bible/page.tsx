import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import HouseBible from "@/components/emergency/HouseBible";

export const metadata = {
  title: "House Bible | The House Ledger",
};

export default async function HouseBiblePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role as string;
  // Managers can also view the House Bible — it's for them to reference
  // Only exclude FAMILY role if you want; for now allow all authenticated users
  if (!role) redirect("/dashboard");

  return <HouseBible />;
}
