/**
 * Standalone seed for HouseProfileQuestion records.
 * Run with: npx tsx prisma/seed-profile.ts
 *
 * Safe to re-run — uses upsert on stable IDs so nothing is duplicated.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const QUESTIONS = [
  // ── General ─────────────────────────────────────────────────────────────────
  { id: "hpq-001", category: "General", sortOrder: 10, ownerOnly: false, prompt: "Year the home was built" },
  { id: "hpq-002", category: "General", sortOrder: 11, ownerOnly: false, prompt: "Total finished square footage" },
  { id: "hpq-003", category: "General", sortOrder: 12, ownerOnly: false, prompt: "Number of bedrooms" },
  { id: "hpq-004", category: "General", sortOrder: 13, ownerOnly: false, prompt: "Number of full bathrooms" },
  { id: "hpq-005", category: "General", sortOrder: 14, ownerOnly: false, prompt: "Number of half bathrooms" },
  { id: "hpq-006", category: "General", sortOrder: 15, ownerOnly: false, prompt: "Home style (e.g. colonial, ranch, contemporary, split-level)" },
  { id: "hpq-007", category: "General", sortOrder: 16, ownerOnly: false, prompt: "Lot size (acres or sq ft)" },
  { id: "hpq-008", category: "General", sortOrder: 17, ownerOnly: false, prompt: "HOA name, contact info, and monthly dues (if applicable)" },

  // ── Utilities ────────────────────────────────────────────────────────────────
  { id: "hpq-010", category: "Utilities", sortOrder: 20, ownerOnly: true,  prompt: "Electric provider + account number" },
  { id: "hpq-011", category: "Utilities", sortOrder: 21, ownerOnly: true,  prompt: "Gas provider + account number" },
  { id: "hpq-012", category: "Utilities", sortOrder: 22, ownerOnly: true,  prompt: "Water / sewer provider + account number" },
  { id: "hpq-013", category: "Utilities", sortOrder: 23, ownerOnly: false, prompt: "City sewer or septic system?" },
  { id: "hpq-014", category: "Utilities", sortOrder: 24, ownerOnly: false, prompt: "Internet provider and plan / speed" },
  { id: "hpq-015", category: "Utilities", sortOrder: 25, ownerOnly: false, prompt: "Trash and recycling pickup day and provider" },
  { id: "hpq-016", category: "Utilities", sortOrder: 26, ownerOnly: false, prompt: "Location of main water shut-off valve" },
  { id: "hpq-017", category: "Utilities", sortOrder: 27, ownerOnly: false, prompt: "Location of main gas shut-off valve" },
  { id: "hpq-018", category: "Utilities", sortOrder: 28, ownerOnly: false, prompt: "Location of electrical panel" },
  { id: "hpq-019", category: "Utilities", sortOrder: 29, ownerOnly: false, prompt: "Water meter location" },

  // ── HVAC & Climate ───────────────────────────────────────────────────────────
  { id: "hpq-020", category: "HVAC & Climate", sortOrder: 30, ownerOnly: false, prompt: "HVAC system make, model, and year installed" },
  { id: "hpq-021", category: "HVAC & Climate", sortOrder: 31, ownerOnly: false, prompt: "Filter size and MERV rating" },
  { id: "hpq-022", category: "HVAC & Climate", sortOrder: 32, ownerOnly: false, prompt: "Recommended filter replacement frequency" },
  { id: "hpq-023", category: "HVAC & Climate", sortOrder: 33, ownerOnly: false, prompt: "Date of last HVAC service" },
  { id: "hpq-024", category: "HVAC & Climate", sortOrder: 34, ownerOnly: false, prompt: "Preferred HVAC company and technician" },
  { id: "hpq-025", category: "HVAC & Climate", sortOrder: 35, ownerOnly: false, prompt: "Number of HVAC zones and thermostat locations" },
  { id: "hpq-026", category: "HVAC & Climate", sortOrder: 36, ownerOnly: false, prompt: "Thermostat brand and model" },
  { id: "hpq-027", category: "HVAC & Climate", sortOrder: 37, ownerOnly: false, prompt: "Fireplace type (gas / wood / electric) and date of last cleaning or inspection" },
  { id: "hpq-028", category: "HVAC & Climate", sortOrder: 38, ownerOnly: false, prompt: "Attic insulation type and R-value (if known)" },

  // ── Plumbing ─────────────────────────────────────────────────────────────────
  { id: "hpq-030", category: "Plumbing", sortOrder: 40, ownerOnly: false, prompt: "Water heater make, model, serial number, and year installed" },
  { id: "hpq-031", category: "Plumbing", sortOrder: 41, ownerOnly: false, prompt: "Water heater type (tank / tankless / heat pump)" },
  { id: "hpq-032", category: "Plumbing", sortOrder: 42, ownerOnly: false, prompt: "Date of last water heater flush or service" },
  { id: "hpq-033", category: "Plumbing", sortOrder: 43, ownerOnly: false, prompt: "Water softener — yes / no; if yes, brand and service schedule" },
  { id: "hpq-034", category: "Plumbing", sortOrder: 44, ownerOnly: false, prompt: "Preferred plumber or plumbing company" },
  { id: "hpq-035", category: "Plumbing", sortOrder: 45, ownerOnly: false, prompt: "Irrigation / sprinkler system — yes / no; zones, controller brand, and schedule" },
  { id: "hpq-036", category: "Plumbing", sortOrder: 46, ownerOnly: false, prompt: "Sump pump location and last test or service date" },
  { id: "hpq-037", category: "Plumbing", sortOrder: 47, ownerOnly: false, prompt: "Septic tank last pumped date and service provider (if applicable)" },

  // ── Electrical ───────────────────────────────────────────────────────────────
  { id: "hpq-040", category: "Electrical", sortOrder: 50, ownerOnly: false, prompt: "Panel amperage (100A / 200A / 400A)" },
  { id: "hpq-041", category: "Electrical", sortOrder: 51, ownerOnly: false, prompt: "Panel brand and approximate age" },
  { id: "hpq-042", category: "Electrical", sortOrder: 52, ownerOnly: false, prompt: "Preferred electrician or electrical company" },
  { id: "hpq-043", category: "Electrical", sortOrder: 53, ownerOnly: false, prompt: "Whole-house generator — yes / no; brand, fuel type, and last service date" },
  { id: "hpq-044", category: "Electrical", sortOrder: 54, ownerOnly: false, prompt: "Solar system — yes / no; provider, kW capacity, and owned or leased" },
  { id: "hpq-045", category: "Electrical", sortOrder: 55, ownerOnly: false, prompt: "EV charger — yes / no; location and charger level (Level 1 / Level 2)" },
  { id: "hpq-046", category: "Electrical", sortOrder: 56, ownerOnly: false, prompt: "Smoke detector locations and last battery replacement date" },
  { id: "hpq-047", category: "Electrical", sortOrder: 57, ownerOnly: false, prompt: "Carbon monoxide detector locations and last replacement date" },

  // ── Appliances ───────────────────────────────────────────────────────────────
  { id: "hpq-050", category: "Appliances", sortOrder: 60, ownerOnly: false, prompt: "Refrigerator — make, model, serial number, and purchase year" },
  { id: "hpq-051", category: "Appliances", sortOrder: 61, ownerOnly: false, prompt: "Range / oven — make, model, serial number, and fuel (gas / electric)" },
  { id: "hpq-052", category: "Appliances", sortOrder: 62, ownerOnly: false, prompt: "Dishwasher — make, model, serial number, and purchase year" },
  { id: "hpq-053", category: "Appliances", sortOrder: 63, ownerOnly: false, prompt: "Microwave — make, model, and purchase year" },
  { id: "hpq-054", category: "Appliances", sortOrder: 64, ownerOnly: false, prompt: "Washer — make, model, serial number, and purchase year" },
  { id: "hpq-055", category: "Appliances", sortOrder: 65, ownerOnly: false, prompt: "Dryer — make, model, serial number, fuel (gas / electric), and purchase year" },
  { id: "hpq-056", category: "Appliances", sortOrder: 66, ownerOnly: false, prompt: "Dryer vent last cleaned date" },
  { id: "hpq-057", category: "Appliances", sortOrder: 67, ownerOnly: false, prompt: "Garbage disposal brand and purchase year" },
  { id: "hpq-058", category: "Appliances", sortOrder: 68, ownerOnly: false, prompt: "Garage door opener brand, model, and year" },
  { id: "hpq-059", category: "Appliances", sortOrder: 69, ownerOnly: false, prompt: "Preferred appliance repair company" },

  // ── Security & Safety ────────────────────────────────────────────────────────
  { id: "hpq-070", category: "Security & Safety", sortOrder: 70, ownerOnly: true,  prompt: "Alarm system provider and account number" },
  { id: "hpq-071", category: "Security & Safety", sortOrder: 71, ownerOnly: true,  prompt: "Alarm monitoring center phone number" },
  { id: "hpq-072", category: "Security & Safety", sortOrder: 72, ownerOnly: true,  prompt: "Note on where alarm code is stored (do NOT write the code here)" },
  { id: "hpq-073", category: "Security & Safety", sortOrder: 73, ownerOnly: true,  prompt: "Spare key locations" },
  { id: "hpq-074", category: "Security & Safety", sortOrder: 74, ownerOnly: true,  prompt: "Safe location and general note on contents" },
  { id: "hpq-075", category: "Security & Safety", sortOrder: 75, ownerOnly: false, prompt: "Security camera system brand and app / platform used" },
  { id: "hpq-076", category: "Security & Safety", sortOrder: 76, ownerOnly: false, prompt: "Video doorbell brand and model" },
  { id: "hpq-077", category: "Security & Safety", sortOrder: 77, ownerOnly: false, prompt: "Location of fire extinguisher(s)" },
  { id: "hpq-078", category: "Security & Safety", sortOrder: 78, ownerOnly: false, prompt: "Location of first aid kit(s)" },
  { id: "hpq-079", category: "Security & Safety", sortOrder: 79, ownerOnly: false, prompt: "Radon test date and result (if tested)" },

  // ── Garden & Exterior ────────────────────────────────────────────────────────
  { id: "hpq-080", category: "Garden & Exterior", sortOrder: 80, ownerOnly: false, prompt: "Roof material (shingles / tile / metal / flat) and year replaced or last inspected" },
  { id: "hpq-081", category: "Garden & Exterior", sortOrder: 81, ownerOnly: false, prompt: "Gutter type and last cleaned date" },
  { id: "hpq-082", category: "Garden & Exterior", sortOrder: 82, ownerOnly: false, prompt: "Exterior paint brand and color codes" },
  { id: "hpq-083", category: "Garden & Exterior", sortOrder: 83, ownerOnly: false, prompt: "Lawn care / landscaping service provider and schedule" },
  { id: "hpq-084", category: "Garden & Exterior", sortOrder: 84, ownerOnly: false, prompt: "Tree service company (if used) and last visit" },
  { id: "hpq-085", category: "Garden & Exterior", sortOrder: 85, ownerOnly: false, prompt: "Fence material and last maintenance or stain date" },
  { id: "hpq-086", category: "Garden & Exterior", sortOrder: 86, ownerOnly: false, prompt: "Driveway material and last sealed or repaired date" },
  { id: "hpq-087", category: "Garden & Exterior", sortOrder: 87, ownerOnly: false, prompt: "Deck or patio material and last sealed, stained, or treated date" },
  { id: "hpq-088", category: "Garden & Exterior", sortOrder: 88, ownerOnly: false, prompt: "Pool service provider and schedule (if applicable)" },

  // ── Insurance & Documents ────────────────────────────────────────────────────
  { id: "hpq-090", category: "Insurance & Documents", sortOrder: 90, ownerOnly: true,  prompt: "Homeowner's insurance provider and policy number" },
  { id: "hpq-091", category: "Insurance & Documents", sortOrder: 91, ownerOnly: true,  prompt: "Homeowner's insurance agent name and phone number" },
  { id: "hpq-092", category: "Insurance & Documents", sortOrder: 92, ownerOnly: true,  prompt: "Annual premium amount and deductible" },
  { id: "hpq-093", category: "Insurance & Documents", sortOrder: 93, ownerOnly: true,  prompt: "Flood insurance provider and policy number (if applicable)" },
  { id: "hpq-094", category: "Insurance & Documents", sortOrder: 94, ownerOnly: false, prompt: "Home warranty provider and coverage details" },
  { id: "hpq-095", category: "Insurance & Documents", sortOrder: 95, ownerOnly: true,  prompt: "Where to find the property deed" },
  { id: "hpq-096", category: "Insurance & Documents", sortOrder: 96, ownerOnly: true,  prompt: "Where to find mortgage or refinance documents" },
  { id: "hpq-097", category: "Insurance & Documents", sortOrder: 97, ownerOnly: false, prompt: "Last home inspection date and inspector contact info" },
  { id: "hpq-098", category: "Insurance & Documents", sortOrder: 98, ownerOnly: false, prompt: "Pest control provider and contract or treatment schedule" },

  // ── Emergency Contacts ───────────────────────────────────────────────────────
  { id: "hpq-100", category: "Emergency Contacts", sortOrder: 100, ownerOnly: false, prompt: "Primary emergency contacts — name, phone, and relationship" },
  { id: "hpq-101", category: "Emergency Contacts", sortOrder: 101, ownerOnly: false, prompt: "Nearest hospital name and address" },
  { id: "hpq-102", category: "Emergency Contacts", sortOrder: 102, ownerOnly: false, prompt: "Preferred urgent care clinic name and address" },
  { id: "hpq-103", category: "Emergency Contacts", sortOrder: 103, ownerOnly: false, prompt: "Trusted neighbor name and phone number" },
  { id: "hpq-104", category: "Emergency Contacts", sortOrder: 104, ownerOnly: false, prompt: "Property or building manager contact (if applicable)" },
  { id: "hpq-105", category: "Emergency Contacts", sortOrder: 105, ownerOnly: false, prompt: "Emergency plumber, electrician, and general contractor contacts" },

  // ── Smart Home & Technology ──────────────────────────────────────────────────
  { id: "hpq-110", category: "Smart Home & Tech", sortOrder: 110, ownerOnly: false, prompt: "Home WiFi network name(s) and router brand / model" },
  { id: "hpq-111", category: "Smart Home & Tech", sortOrder: 111, ownerOnly: false, prompt: "Smart home hub or platform (Alexa / Google Home / Apple HomeKit / SmartThings)" },
  { id: "hpq-112", category: "Smart Home & Tech", sortOrder: 112, ownerOnly: true,  prompt: "Smart lock brand, door location, and access code management note" },
  { id: "hpq-113", category: "Smart Home & Tech", sortOrder: 113, ownerOnly: true,  prompt: "Smart thermostat app name and login location note" },
  { id: "hpq-114", category: "Smart Home & Tech", sortOrder: 114, ownerOnly: false, prompt: "Security camera or NVR app name and device locations" },
  { id: "hpq-115", category: "Smart Home & Tech", sortOrder: 115, ownerOnly: false, prompt: "Network equipment location (router, modem, patch panel, NVR)" },
  { id: "hpq-116", category: "Smart Home & Tech", sortOrder: 116, ownerOnly: false, prompt: "Backup internet option (mobile hotspot or cellular failover device)" },

  // ── Service History ──────────────────────────────────────────────────────────
  { id: "hpq-120", category: "Service History", sortOrder: 120, ownerOnly: false, prompt: "Last pest control treatment date and company" },
  { id: "hpq-121", category: "Service History", sortOrder: 121, ownerOnly: false, prompt: "Last chimney sweep or inspection date" },
  { id: "hpq-122", category: "Service History", sortOrder: 122, ownerOnly: false, prompt: "Last exterior power wash date" },
  { id: "hpq-123", category: "Service History", sortOrder: 123, ownerOnly: false, prompt: "Last window cleaning service date" },
  { id: "hpq-124", category: "Service History", sortOrder: 124, ownerOnly: false, prompt: "Last HVAC duct cleaning date" },
  { id: "hpq-125", category: "Service History", sortOrder: 125, ownerOnly: false, prompt: "Last roof inspection or repair date" },
  { id: "hpq-126", category: "Service History", sortOrder: 126, ownerOnly: false, prompt: "Last plumbing camera or drain inspection date" },
  { id: "hpq-127", category: "Service History", sortOrder: 127, ownerOnly: false, prompt: "Last whole-house deep clean date" },
  { id: "hpq-128", category: "Service History", sortOrder: 128, ownerOnly: false, prompt: "Major repairs or renovations completed in the last 5 years (with dates)" },
];

async function main() {
  console.log(`\n🏠 Seeding ${QUESTIONS.length} house profile questions…\n`);

  let created = 0;
  let skipped = 0;

  for (const q of QUESTIONS) {
    const result = await prisma.houseProfileQuestion.upsert({
      where: { id: q.id },
      update: {
        category: q.category,
        prompt: q.prompt,
        ownerOnly: q.ownerOnly,
        sortOrder: q.sortOrder,
      },
      create: {
        id: q.id,
        category: q.category,
        prompt: q.prompt,
        ownerOnly: q.ownerOnly,
        sortOrder: q.sortOrder,
      },
    });
    if (result) created++;
  }

  // Remove old seed questions from the original seed.ts (seed-q-* IDs)
  const deleted = await prisma.houseProfileQuestion.deleteMany({
    where: { id: { startsWith: "seed-q-" } },
  });
  if (deleted.count > 0) {
    console.log(`  🗑  Removed ${deleted.count} legacy seed-q-* questions`);
  }

  console.log(`  ✔ ${QUESTIONS.length} questions upserted`);

  const total = await prisma.houseProfileQuestion.count();
  console.log(`\n✅ House profile now has ${total} questions across ${new Set(QUESTIONS.map((q) => q.category)).size} categories.\n`);
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
