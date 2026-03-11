import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import HouseBible from "@/components/emergency/HouseBible";

export const metadata = {
  title: "House Ledger | The House Ledger",
};

export default async function HouseBiblePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role as string;
  if (!role) redirect("/dashboard");

  return <HouseBible />;
}
