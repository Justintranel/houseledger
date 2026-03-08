import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TimePageClient from "./TimePageClient";

export default async function TimePage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role!;
  const userId = session!.user.id!;

  return <TimePageClient role={role} userId={userId} />;
}
