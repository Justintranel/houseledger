import { PrismaClient, Role, RecurrenceType, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, startOfToday } from "date-fns";

const prisma = new PrismaClient();

// ── House profile questions seed ──────────────────────────────────────────────
const PROFILE_QUESTIONS = [
  // General
  { category: "General", prompt: "Year the home was built", sortOrder: 1 },
  { category: "General", prompt: "Square footage", sortOrder: 2 },
  { category: "General", prompt: "Number of bedrooms", sortOrder: 3 },
  { category: "General", prompt: "Number of bathrooms", sortOrder: 4 },
  { category: "General", prompt: "HOA contact information", sortOrder: 5 },
  // Utilities
  { category: "Utilities", prompt: "Electric provider + account number", sortOrder: 10, ownerOnly: true },
  { category: "Utilities", prompt: "Gas provider + account number", sortOrder: 11, ownerOnly: true },
  { category: "Utilities", prompt: "Water provider + account number", sortOrder: 12, ownerOnly: true },
  { category: "Utilities", prompt: "Internet provider + account number", sortOrder: 13 },
  { category: "Utilities", prompt: "Location of main water shut-off", sortOrder: 14 },
  { category: "Utilities", prompt: "Location of electrical panel", sortOrder: 15 },
  // HVAC
  { category: "HVAC", prompt: "HVAC make and model", sortOrder: 20 },
  { category: "HVAC", prompt: "Filter size", sortOrder: 21 },
  { category: "HVAC", prompt: "Last service date", sortOrder: 22 },
  { category: "HVAC", prompt: "Preferred HVAC technician", sortOrder: 23 },
  // Appliances
  { category: "Appliances", prompt: "Refrigerator make/model/serial", sortOrder: 30 },
  { category: "Appliances", prompt: "Washer make/model/serial", sortOrder: 31 },
  { category: "Appliances", prompt: "Dryer make/model/serial", sortOrder: 32 },
  { category: "Appliances", prompt: "Dishwasher make/model/serial", sortOrder: 33 },
  // Security
  { category: "Security", prompt: "Alarm system provider", sortOrder: 40, ownerOnly: true },
  { category: "Security", prompt: "Alarm code location (do not write code here)", sortOrder: 41, ownerOnly: true },
  { category: "Security", prompt: "Spare key locations", sortOrder: 42, ownerOnly: true },
  // Emergency
  { category: "Emergency", prompt: "Emergency contacts (name + phone)", sortOrder: 50 },
  { category: "Emergency", prompt: "Nearest hospital", sortOrder: 51 },
  { category: "Emergency", prompt: "Location of fire extinguisher(s)", sortOrder: 52 },
  { category: "Emergency", prompt: "Location of first aid kit", sortOrder: 53 },
];

// ── Starter task pack ─────────────────────────────────────────────────────────
const DAILY_TASKS = [
  "Check and respond to household messages",
  "Wipe down kitchen counters",
  "Load/unload dishwasher",
  "Take out trash if needed",
  "Quick living area tidy",
];

const WEEKLY_TASKS = [
  { title: "Vacuum all floors", weekdays: [1] },         // Monday
  { title: "Mop hard floors", weekdays: [2] },            // Tuesday
  { title: "Clean bathrooms", weekdays: [3] },            // Wednesday
  { title: "Change bed linens", weekdays: [4] },          // Thursday
  { title: "Grocery shopping", weekdays: [5] },           // Friday
  { title: "Yard / outdoor tidy", weekdays: [6] },        // Saturday
  { title: "Weekly house walkthrough", weekdays: [0] },   // Sunday
];

const MONTHLY_TASKS = [
  { title: "Replace HVAC filter", monthday: 1 },
  { title: "Clean refrigerator coils", monthday: 15 },
  { title: "Test smoke detectors", monthday: 1 },
];

async function main() {
  console.log("🌱 Seeding House Ledger Software…");

  const hash = await bcrypt.hash("Password123!", 12);
  const today = startOfToday();

  // ── Seed house profile questions ────────────────────────────────────────────
  for (const q of PROFILE_QUESTIONS) {
    await prisma.houseProfileQuestion.upsert({
      where: { id: `seed-q-${q.sortOrder}` },
      update: {},
      create: {
        id: `seed-q-${q.sortOrder}`,
        category: q.category,
        prompt: q.prompt,
        ownerOnly: q.ownerOnly ?? false,
        sortOrder: q.sortOrder,
      },
    });
  }
  console.log("  ✔ House profile questions seeded");

  // ── Super Admin ──────────────────────────────────────────────────────────────
  // Credentials: admin@thehouseledger.com / 123
  // Change by updating the email/password below and re-running `npm run db:seed`
  const adminHash = await bcrypt.hash("123", 12);
  // Remove any old super admin accounts before upserting the current one
  await prisma.user.deleteMany({ where: { isSuperAdmin: true } });
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@thehouseledger.com",
      passwordHash: adminHash,
      isSuperAdmin: true,
    },
  });
  console.log("  ✔ Super Admin created (admin@thehouseledger.com / 123)");

  // ── Users ────────────────────────────────────────────────────────────────────
  const owner = await prisma.user.upsert({
    where: { email: "owner@thehouseledger.com" },
    update: {},
    create: { name: "Home Owner", email: "owner@thehouseledger.com", passwordHash: hash },
  });

  const family = await prisma.user.upsert({
    where: { email: "family@thehouseledger.com" },
    update: {},
    create: { name: "Family Member", email: "family@thehouseledger.com", passwordHash: hash },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@thehouseledger.com" },
    update: {},
    create: { name: "House Manager", email: "manager@thehouseledger.com", passwordHash: hash },
  });
  console.log("  ✔ Users created");

  // ── Household ────────────────────────────────────────────────────────────────
  const household = await prisma.household.upsert({
    where: { id: "seed-household-1" },
    update: {},
    create: {
      id: "seed-household-1",
      name: "The Demo Household",
      address: "123 Main Street, Anytown USA",
      workDays: [1, 2, 3, 4, 5], // Mon–Fri
      workStart: "09:00",
      workEnd: "17:00",
      autoApproveUnder: 50,
      requireApprovalOver: 200,
      hourlyRate: 20,
      subscriptionStatus: "active",
      subscriptionPlan: "standard",
      accountStatus: "ACTIVE",
      onboardingCompleted: true,
    },
  });

  // ── Memberships ─────────────────────────────────────────────────────────────
  await prisma.householdMember.upsert({
    where: { householdId_userId: { householdId: household.id, userId: owner.id } },
    update: {},
    create: { householdId: household.id, userId: owner.id, role: "OWNER" },
  });
  await prisma.householdMember.upsert({
    where: { householdId_userId: { householdId: household.id, userId: family.id } },
    update: {},
    create: { householdId: household.id, userId: family.id, role: "FAMILY" },
  });
  await prisma.householdMember.upsert({
    where: { householdId_userId: { householdId: household.id, userId: manager.id } },
    update: {},
    create: { householdId: household.id, userId: manager.id, role: "MANAGER" },
  });
  console.log("  ✔ Members linked");

  // ── Feature flags (all on by default) ───────────────────────────────────────
  const flags = ["chat", "inventory", "approvals", "timetracking", "contracts", "vendors", "houseprofile"];
  for (const key of flags) {
    await prisma.featureFlag.upsert({
      where: { householdId_key: { householdId: household.id, key } },
      update: {},
      create: { householdId: household.id, key, enabled: true },
    });
  }
  console.log("  ✔ Feature flags enabled");

  // ── Default channel ─────────────────────────────────────────────────────────
  const channel = await prisma.channel.upsert({
    where: { householdId_name: { householdId: household.id, name: "house-chat" } },
    update: {},
    create: {
      householdId: household.id,
      name: "house-chat",
      description: "General household communication",
    },
  });

  // Add all members to channel
  for (const uid of [owner.id, family.id, manager.id]) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: channel.id, userId: uid } },
      update: {},
      create: { channelId: channel.id, userId: uid },
    });
  }
  console.log("  ✔ Default channel created");

  // ── Seed a welcome message ───────────────────────────────────────────────────
  const msgCount = await prisma.message.count({ where: { channelId: channel.id } });
  if (msgCount === 0) {
    await prisma.message.create({
      data: {
        channelId: channel.id,
        senderId: owner.id,
        body: "Welcome to House Ledger! 🏠 This is the house-chat channel.",
      },
    });
  }

  // ── Daily task templates ─────────────────────────────────────────────────────
  for (const title of DAILY_TASKS) {
    const existing = await prisma.taskTemplate.findFirst({
      where: { householdId: household.id, title },
    });
    if (!existing) {
      await prisma.taskTemplate.create({
        data: {
          householdId: household.id,
          title,
          category: "Daily",
          defaultDuration: 15,
          recurrenceRule: {
            create: {
              type: "DAILY",
              interval: 1,
              weekdays: [],
              months: [],
              startDate: today,
            },
          },
        },
      });
    }
  }
  console.log("  ✔ Daily tasks seeded");

  // ── Weekly task templates ────────────────────────────────────────────────────
  for (const t of WEEKLY_TASKS) {
    const existing = await prisma.taskTemplate.findFirst({
      where: { householdId: household.id, title: t.title },
    });
    if (!existing) {
      await prisma.taskTemplate.create({
        data: {
          householdId: household.id,
          title: t.title,
          category: "Weekly",
          defaultDuration: 30,
          recurrenceRule: {
            create: {
              type: "WEEKLY",
              interval: 1,
              weekdays: t.weekdays,
              months: [],
              startDate: today,
            },
          },
        },
      });
    }
  }
  console.log("  ✔ Weekly tasks seeded");

  // ── Monthly task templates ───────────────────────────────────────────────────
  for (const t of MONTHLY_TASKS) {
    const existing = await prisma.taskTemplate.findFirst({
      where: { householdId: household.id, title: t.title },
    });
    if (!existing) {
      await prisma.taskTemplate.create({
        data: {
          householdId: household.id,
          title: t.title,
          category: "Monthly",
          defaultDuration: 20,
          recurrenceRule: {
            create: {
              type: "MONTHLY",
              interval: 1,
              weekdays: [],
              monthday: t.monthday,
              months: [],
              startDate: today,
            },
          },
        },
      });
    }
  }
  console.log("  ✔ Monthly tasks seeded");

  // ── Sample inventory items ───────────────────────────────────────────────────
  const inventoryItems = [
    { name: "Paper Towels", qty: 6, unit: "rolls", threshold: 2 },
    { name: "Dish Soap", qty: 2, unit: "bottles", threshold: 1 },
    { name: "Laundry Detergent", qty: 1, unit: "bottles", threshold: 1 },
    { name: "Trash Bags", qty: 20, unit: "bags", threshold: 5 },
    { name: "HVAC Filters", qty: 2, unit: "units", threshold: 1 },
  ];
  for (const item of inventoryItems) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { householdId: household.id, name: item.name },
    });
    if (!existing) {
      await prisma.inventoryItem.create({
        data: { householdId: household.id, ...item },
      });
    }
  }
  console.log("  ✔ Inventory items seeded");

  // ── Sample vendor ────────────────────────────────────────────────────────────
  const vendorCount = await prisma.vendor.count({ where: { householdId: household.id } });
  if (vendorCount === 0) {
    await prisma.vendor.create({
      data: {
        householdId: household.id,
        name: "ABC Plumbing",
        phone: "555-123-4567",
        type: "Plumbing",
        approvalLimit: 500,
      },
    });
  }
  console.log("  ✔ Sample vendor seeded");

  console.log("\n✅ Seed complete!\n");
  console.log("  Owner:      owner@thehouseledger.com   / Password123!");
  console.log("  Family:     family@thehouseledger.com  / Password123!");
  console.log("  Manager:    manager@thehouseledger.com / Password123!");
  console.log("  SuperAdmin: admin@thehouseledger.com   / 123\n");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
