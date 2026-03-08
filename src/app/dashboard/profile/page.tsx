import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const hid = session.user.householdId;
  const role = session.user.role as string;

  if (!hid) redirect("/login");

  // Load both global (householdId=null) and household-specific custom questions
  // MANAGER cannot see ownerOnly questions — filter after the query to avoid
  // a union-typed `where` variable that breaks Prisma's `include` return types.
  const questions = await prisma.houseProfileQuestion.findMany({
    where: {
      OR: [{ householdId: null }, { householdId: hid }],
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: {
      answers: {
        where: { householdId: hid },
        take: 1,
      },
    },
  });

  const visibleQuestions =
    role === "MANAGER" ? questions.filter((q) => !q.ownerOnly) : questions;

  const formatted = visibleQuestions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    category: q.category,
    ownerOnly: q.ownerOnly,
    isCustom: q.householdId !== null && q.householdId === hid,
    answer: q.answers[0] ? { id: q.answers[0].id, answer: q.answers[0].answer } : null,
  }));

  // Group by category
  const categoryOrder: string[] = [];
  const grouped: Record<string, typeof formatted> = {};
  for (const q of formatted) {
    if (!grouped[q.category]) {
      grouped[q.category] = [];
      categoryOrder.push(q.category);
    }
    grouped[q.category].push(q);
  }

  const categoryGroups = categoryOrder.map((cat) => ({
    category: cat,
    questions: grouped[cat],
  }));

  const availableCategories = [
    "General", "Utilities", "HVAC & Climate", "Plumbing", "Electrical",
    "Appliances", "Security & Safety", "Garden & Exterior",
    "Insurance & Documents", "Emergency Contacts", "Smart Home & Tech", "Service History",
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">House Profile</h1>
        <p className="text-slate-500 text-sm mt-1">
          {role === "MANAGER"
            ? "A complete reference guide to this property."
            : "Document everything about your home so your house manager always has the info they need."}
        </p>
      </div>
      <ProfileClient
        categoryGroups={categoryGroups}
        role={role}
        availableCategories={availableCategories}
      />
    </div>
  );
}
