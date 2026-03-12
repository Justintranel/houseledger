/**
 * Standalone seed for HouseProfileQuestion records.
 * Run with: npx tsx prisma/seed-profile.ts
 *
 * Safe to re-run — uses upsert on stable IDs so nothing is duplicated.
 */
import { PrismaClient } from "@prisma/client";
import { QUESTIONS } from "./profile-questions";

export { QUESTIONS };

const prisma = new PrismaClient();

async function main() {
  console.log(`\n🏠 Seeding ${QUESTIONS.length} house profile questions…\n`);

  let created = 0;

  for (const q of QUESTIONS) {
    const result = await prisma.houseProfileQuestion.upsert({
      where: { id: q.id },
      update: { category: q.category, prompt: q.prompt, ownerOnly: q.ownerOnly, sortOrder: q.sortOrder },
      create: { id: q.id, category: q.category, prompt: q.prompt, ownerOnly: q.ownerOnly, sortOrder: q.sortOrder },
    });
    if (result) created++;
  }

  const deleted = await prisma.houseProfileQuestion.deleteMany({
    where: { id: { startsWith: "seed-q-" } },
  });
  if (deleted.count > 0) console.log(`  🗑  Removed ${deleted.count} legacy seed-q-* questions`);

  console.log(`  ✔ ${QUESTIONS.length} questions upserted`);

  const total = await prisma.houseProfileQuestion.count();
  const categories = new Set(QUESTIONS.map((q) => q.category));
  console.log(`\n✅ House profile now has ${total} questions across ${categories.size} categories.\n`);
  for (const cat of Array.from(categories).sort()) {
    const count = QUESTIONS.filter((q) => q.category === cat).length;
    console.log(`    • ${cat}: ${count} questions`);
  }
  console.log();
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
