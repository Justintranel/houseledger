/**
 * Standalone seed for HouseProfileQuestion records.
 * Run with: npx tsx prisma/seed-profile.ts
 *
 * Safe to re-run — uses upsert on stable IDs so nothing is duplicated.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const QUESTIONS = [
  // ── General — Structural ─────────────────────────────────────────────────────
  { id: "hpq-001", category: "General", sortOrder: 10, ownerOnly: false, prompt: "Year the home was built" },
  { id: "hpq-002", category: "General", sortOrder: 11, ownerOnly: false, prompt: "Total finished square footage" },
  { id: "hpq-003", category: "General", sortOrder: 12, ownerOnly: false, prompt: "Number of bedrooms" },
  { id: "hpq-004", category: "General", sortOrder: 13, ownerOnly: false, prompt: "Number of full bathrooms" },
  { id: "hpq-005", category: "General", sortOrder: 14, ownerOnly: false, prompt: "Number of half bathrooms" },
  { id: "hpq-006", category: "General", sortOrder: 15, ownerOnly: false, prompt: "Home style (e.g. colonial, ranch, contemporary, split-level)" },
  { id: "hpq-007", category: "General", sortOrder: 16, ownerOnly: false, prompt: "Lot size (acres or sq ft)" },
  { id: "hpq-008", category: "General", sortOrder: 17, ownerOnly: false, prompt: "HOA name, contact info, and monthly dues (if applicable)" },

  // ── General — Communication & Schedule ───────────────────────────────────────
  { id: "hpq-201", category: "General", sortOrder: 20, ownerOnly: false, prompt: "Preferred communication channel (text / call / email / app) and best time window to reach the owner" },
  { id: "hpq-202", category: "General", sortOrder: 21, ownerOnly: false, prompt: "Owner's typical wake-up time and bedtime" },
  { id: "hpq-203", category: "General", sortOrder: 22, ownerOnly: false, prompt: "Owner's work-from-home schedule — days and approximate hours in office vs. home" },
  { id: "hpq-204", category: "General", sortOrder: 23, ownerOnly: false, prompt: "Quiet / Do Not Disturb times (no loud chores, vacuuming, blowers, etc.)" },
  { id: "hpq-205", category: "General", sortOrder: 24, ownerOnly: false, prompt: "Owner's general daily departure and return times (useful for planning noisy tasks)" },

  // ── General — Temperature & Climate Preferences ──────────────────────────────
  { id: "hpq-206", category: "General", sortOrder: 25, ownerOnly: false, prompt: "Preferred daytime thermostat temperature when home (heating and cooling separately if different)" },
  { id: "hpq-207", category: "General", sortOrder: 26, ownerOnly: false, prompt: "Preferred nighttime / sleeping thermostat temperature" },
  { id: "hpq-208", category: "General", sortOrder: 27, ownerOnly: false, prompt: "Preferred thermostat setting when the house is empty / owner is away" },

  // ── General — Kitchen & Groceries ────────────────────────────────────────────
  { id: "hpq-209", category: "General", sortOrder: 28, ownerOnly: false, prompt: "Preferred grocery store(s) for weekly shopping" },
  { id: "hpq-210", category: "General", sortOrder: 29, ownerOnly: false, prompt: "Standing grocery list — staples that should always be stocked (pantry, fridge, freezer)" },
  { id: "hpq-211", category: "General", sortOrder: 30, ownerOnly: false, prompt: "Food allergies, dietary restrictions, or items that must never be purchased" },
  { id: "hpq-212", category: "General", sortOrder: 31, ownerOnly: false, prompt: "Preferred coffee, tea, or beverage brands to keep stocked" },

  // ── General — Laundry & Clothing ─────────────────────────────────────────────
  { id: "hpq-213", category: "General", sortOrder: 32, ownerOnly: false, prompt: "Preferred laundry detergent and fabric softener brand / scent" },
  { id: "hpq-214", category: "General", sortOrder: 33, ownerOnly: false, prompt: "Laundry preferences — wash temperature, dryer heat level, items that must be hang-dried or laid flat" },
  { id: "hpq-215", category: "General", sortOrder: 34, ownerOnly: false, prompt: "Ironing and steaming preferences — what gets ironed vs. steamed vs. neither" },
  { id: "hpq-216", category: "General", sortOrder: 35, ownerOnly: false, prompt: "Dry cleaning schedule and preferred dry cleaner" },

  // ── General — Cleaning & Home Care ───────────────────────────────────────────
  { id: "hpq-217", category: "General", sortOrder: 36, ownerOnly: false, prompt: "Preferred cleaning supply brands (all-purpose, floor, glass/mirror, bathroom, stainless steel)" },
  { id: "hpq-218", category: "General", sortOrder: 37, ownerOnly: false, prompt: "Surfaces or materials requiring special care products (marble, quartz, hardwood, copper fixtures, etc.)" },
  { id: "hpq-219", category: "General", sortOrder: 38, ownerOnly: false, prompt: "Fragrance preferences — candles, diffusers, air freshener scents; or if owner prefers fragrance-free" },
  { id: "hpq-220", category: "General", sortOrder: 39, ownerOnly: false, prompt: "Indoor plant care — list of plants, watering schedule, and who is responsible" },
  { id: "hpq-221", category: "General", sortOrder: 40, ownerOnly: false, prompt: "Fresh flower schedule — frequency, preferred flowers or color palette, florist source, and placement in home" },

  // ── General — Mail, Packages & Errands ───────────────────────────────────────
  { id: "hpq-222", category: "General", sortOrder: 41, ownerOnly: false, prompt: "Mail handling instructions — where to place incoming mail, what to shred, subscriptions to forward or cancel" },
  { id: "hpq-223", category: "General", sortOrder: 42, ownerOnly: false, prompt: "Package delivery protocol — where carriers should leave packages, how to alert owner of deliveries" },
  { id: "hpq-224", category: "General", sortOrder: 43, ownerOnly: false, prompt: "Regular errand expectations (dry cleaning pickup/drop-off, pharmacy runs, post office, etc.)" },

  // ── General — Access, Parking & Guests ───────────────────────────────────────
  { id: "hpq-225", category: "General", sortOrder: 44, ownerOnly: false, prompt: "Parking instructions for house manager and other staff vehicles" },
  { id: "hpq-226", category: "General", sortOrder: 45, ownerOnly: false, prompt: "Guest room preparation protocol — when to prepare, standard setup checklist, preferred amenities" },
  { id: "hpq-227", category: "General", sortOrder: 46, ownerOnly: false, prompt: "Areas of the home that are off-limits to staff or require special permission to enter" },
  { id: "hpq-228", category: "General", sortOrder: 47, ownerOnly: false, prompt: "Rules about staff having personal guests on the property" },

  // ── General — Spending, Vendors & Repairs ────────────────────────────────────
  { id: "hpq-229", category: "General", sortOrder: 48, ownerOnly: false, prompt: "Spending authority — maximum amount that can be spent on any single purchase without prior owner approval" },
  { id: "hpq-230", category: "General", sortOrder: 49, ownerOnly: false, prompt: "Expense tracking and reimbursement process (app used, receipt requirements, how often to submit)" },
  { id: "hpq-231", category: "General", sortOrder: 50, ownerOnly: false, prompt: "Protocol for small repairs — what to handle independently vs. what to escalate to owner before acting" },
  { id: "hpq-232", category: "General", sortOrder: 51, ownerOnly: false, prompt: "Pre-approved vendor list for routine repairs and services (plumber, electrician, handyman, etc.)" },

  // ── General — Security, Vehicles & Special Items ─────────────────────────────
  { id: "hpq-233", category: "General", sortOrder: 52, ownerOnly: false, prompt: "End-of-day lock-up checklist — doors, windows, garage, alarm, lights, appliances to verify before leaving" },
  { id: "hpq-234", category: "General", sortOrder: 53, ownerOnly: false, prompt: "Vehicles owned by household — make, model, fuel type, and any care notes (preferred car wash, tire pressure)" },
  { id: "hpq-235", category: "General", sortOrder: 54, ownerOnly: false, prompt: "High-value, fragile, or sentimental items in the home requiring special handling or awareness" },

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
  { id: "hpq-251", category: "Utilities", sortOrder: 30, ownerOnly: true,  prompt: "Oil, propane, or heating fuel delivery provider, account number, and auto-fill vs. will-call schedule" },
  { id: "hpq-252", category: "Utilities", sortOrder: 31, ownerOnly: false, prompt: "Water filtration or purification system type (whole-house, under-sink, pitcher) and location" },
  { id: "hpq-253", category: "Utilities", sortOrder: 32, ownerOnly: false, prompt: "Yard waste or compost pickup day and provider (if separate from regular trash)" },
  { id: "hpq-254", category: "Utilities", sortOrder: 33, ownerOnly: false, prompt: "Approximate average monthly costs for electric, gas, and water (helpful for spotting abnormal bills)" },

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
  { id: "hpq-261", category: "HVAC & Climate", sortOrder: 39, ownerOnly: false, prompt: "Whole-home humidifier or dehumidifier — brand, location, current settings, and service schedule" },
  { id: "hpq-262", category: "HVAC & Climate", sortOrder: 40, ownerOnly: false, prompt: "Ceiling fan direction preference by season (winter: clockwise / summer: counter-clockwise) and fan locations" },
  { id: "hpq-263", category: "HVAC & Climate", sortOrder: 41, ownerOnly: false, prompt: "Indoor air quality monitor brand and model (e.g. Airthings, IQAir) and any alert thresholds set" },
  { id: "hpq-264", category: "HVAC & Climate", sortOrder: 42, ownerOnly: false, prompt: "Wood-burning fireplace or fire pit — firewood supplier, storage location, and ash removal schedule" },
  { id: "hpq-265", category: "HVAC & Climate", sortOrder: 43, ownerOnly: false, prompt: "Secondary or mini-split HVAC units — locations, make / model, and any separate service contracts" },

  // ── Plumbing ─────────────────────────────────────────────────────────────────
  { id: "hpq-030", category: "Plumbing", sortOrder: 40, ownerOnly: false, prompt: "Water heater make, model, serial number, and year installed" },
  { id: "hpq-031", category: "Plumbing", sortOrder: 41, ownerOnly: false, prompt: "Water heater type (tank / tankless / heat pump)" },
  { id: "hpq-032", category: "Plumbing", sortOrder: 42, ownerOnly: false, prompt: "Date of last water heater flush or service" },
  { id: "hpq-033", category: "Plumbing", sortOrder: 43, ownerOnly: false, prompt: "Water softener — yes / no; if yes, brand and service schedule" },
  { id: "hpq-034", category: "Plumbing", sortOrder: 44, ownerOnly: false, prompt: "Preferred plumber or plumbing company" },
  { id: "hpq-035", category: "Plumbing", sortOrder: 45, ownerOnly: false, prompt: "Irrigation / sprinkler system — yes / no; zones, controller brand, and schedule" },
  { id: "hpq-036", category: "Plumbing", sortOrder: 46, ownerOnly: false, prompt: "Sump pump location and last test or service date" },
  { id: "hpq-037", category: "Plumbing", sortOrder: 47, ownerOnly: false, prompt: "Septic tank last pumped date and service provider (if applicable)" },
  { id: "hpq-271", category: "Plumbing", sortOrder: 48, ownerOnly: false, prompt: "Reverse osmosis or under-sink water filter — brand, location, and last filter cartridge change date" },
  { id: "hpq-272", category: "Plumbing", sortOrder: 49, ownerOnly: false, prompt: "Hot tub or spa — make, model, chemical service schedule, and service provider" },
  { id: "hpq-273", category: "Plumbing", sortOrder: 50, ownerOnly: false, prompt: "Hose bib (exterior spigot) locations and winterization protocol" },
  { id: "hpq-274", category: "Plumbing", sortOrder: 51, ownerOnly: false, prompt: "Grease trap or interceptor location, last service date, and provider (if applicable)" },
  { id: "hpq-275", category: "Plumbing", sortOrder: 52, ownerOnly: false, prompt: "Tankless water heater descale / flush schedule and last service date" },

  // ── Electrical ───────────────────────────────────────────────────────────────
  { id: "hpq-040", category: "Electrical", sortOrder: 50, ownerOnly: false, prompt: "Panel amperage (100A / 200A / 400A)" },
  { id: "hpq-041", category: "Electrical", sortOrder: 51, ownerOnly: false, prompt: "Panel brand and approximate age" },
  { id: "hpq-042", category: "Electrical", sortOrder: 52, ownerOnly: false, prompt: "Preferred electrician or electrical company" },
  { id: "hpq-043", category: "Electrical", sortOrder: 53, ownerOnly: false, prompt: "Whole-house generator — yes / no; brand, fuel type, and last service date" },
  { id: "hpq-044", category: "Electrical", sortOrder: 54, ownerOnly: false, prompt: "Solar system — yes / no; provider, kW capacity, and owned or leased" },
  { id: "hpq-045", category: "Electrical", sortOrder: 55, ownerOnly: false, prompt: "EV charger — yes / no; location and charger level (Level 1 / Level 2)" },
  { id: "hpq-046", category: "Electrical", sortOrder: 56, ownerOnly: false, prompt: "Smoke detector locations and last battery replacement date" },
  { id: "hpq-047", category: "Electrical", sortOrder: 57, ownerOnly: false, prompt: "Carbon monoxide detector locations and last replacement date" },
  { id: "hpq-281", category: "Electrical", sortOrder: 58, ownerOnly: false, prompt: "Outdoor lighting timer or smart schedule — controller brand, app used, and current on/off times" },
  { id: "hpq-282", category: "Electrical", sortOrder: 59, ownerOnly: false, prompt: "GFCI outlet locations throughout the home (kitchen, bathrooms, garage, exterior)" },
  { id: "hpq-283", category: "Electrical", sortOrder: 60, ownerOnly: false, prompt: "Landscape or pathway lighting controller brand, schedule, and bulb replacement notes" },
  { id: "hpq-284", category: "Electrical", sortOrder: 61, ownerOnly: false, prompt: "Smart switches, dimmers, or scene controllers — brand, rooms installed, and hub or app used" },
  { id: "hpq-285", category: "Electrical", sortOrder: 62, ownerOnly: false, prompt: "Battery backup / UPS units — equipment protected, locations, and last battery test or replacement date" },

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
  { id: "hpq-291", category: "Appliances", sortOrder: 70, ownerOnly: false, prompt: "Refrigerator water and ice filter — brand, part number, and last replacement date" },
  { id: "hpq-292", category: "Appliances", sortOrder: 71, ownerOnly: false, prompt: "Standalone ice maker — brand, model, and maintenance or cleaning schedule" },
  { id: "hpq-293", category: "Appliances", sortOrder: 72, ownerOnly: false, prompt: "Wine cooler or beverage refrigerator — brand, model, and set temperature" },
  { id: "hpq-294", category: "Appliances", sortOrder: 73, ownerOnly: false, prompt: "Steam oven, speed oven, or combination oven — brand, model, and any unique care notes" },
  { id: "hpq-295", category: "Appliances", sortOrder: 74, ownerOnly: false, prompt: "Central vacuum system — inlet locations, canister location, and service schedule" },

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
  { id: "hpq-301", category: "Security & Safety", sortOrder: 80, ownerOnly: true,  prompt: "Gate keypad, call box, or entry code — note where the code is stored (do NOT record the code here)" },
  { id: "hpq-302", category: "Security & Safety", sortOrder: 81, ownerOnly: false, prompt: "Intercom system brand, model, and station locations throughout the home" },
  { id: "hpq-303", category: "Security & Safety", sortOrder: 82, ownerOnly: false, prompt: "Exterior motion-sensor light locations and any zones or sensitivity settings" },
  { id: "hpq-304", category: "Security & Safety", sortOrder: 83, ownerOnly: false, prompt: "Trusted locksmith on file — name, phone number, and license number" },

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
  { id: "hpq-311", category: "Garden & Exterior", sortOrder: 89, ownerOnly: false, prompt: "Seasonal planting schedule — preferred annuals, perennials, or bulbs and when they are planted / replaced" },
  { id: "hpq-312", category: "Garden & Exterior", sortOrder: 90, ownerOnly: true,  prompt: "Gate lock combination or key location note (do NOT record the combination here)" },
  { id: "hpq-313", category: "Garden & Exterior", sortOrder: 91, ownerOnly: false, prompt: "Outdoor furniture — cover locations, end-of-season storage area, and winterization schedule" },
  { id: "hpq-314", category: "Garden & Exterior", sortOrder: 92, ownerOnly: false, prompt: "Outdoor fireplace or fire pit — fuel type, gas line shut-off location, and safety protocol" },
  { id: "hpq-315", category: "Garden & Exterior", sortOrder: 93, ownerOnly: false, prompt: "Snow removal provider, priority areas (driveway, walkways, steps), and ice-melt / salt storage location" },
  { id: "hpq-316", category: "Garden & Exterior", sortOrder: 94, ownerOnly: false, prompt: "Irrigation system backflow preventer location and fall winterization / spring startup schedule" },

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
  { id: "hpq-321", category: "Insurance & Documents", sortOrder: 99, ownerOnly: true,  prompt: "Umbrella liability insurance provider and policy number" },
  { id: "hpq-322", category: "Insurance & Documents", sortOrder: 100, ownerOnly: true, prompt: "Vehicle insurance provider, policy number, and renewal date" },
  { id: "hpq-323", category: "Insurance & Documents", sortOrder: 101, ownerOnly: false, prompt: "Appliance and home system warranty storage location (physical binder, digital folder, or app)" },
  { id: "hpq-324", category: "Insurance & Documents", sortOrder: 102, ownerOnly: true, prompt: "Household safe — note where combination or key is stored (do NOT record the combination here)" },
  { id: "hpq-325", category: "Insurance & Documents", sortOrder: 103, ownerOnly: true, prompt: "Property tax due dates, amount, and payment method or escrow note" },

  // ── Emergency Contacts ───────────────────────────────────────────────────────
  { id: "hpq-100", category: "Emergency Contacts", sortOrder: 100, ownerOnly: false, prompt: "Primary emergency contacts — name, phone, and relationship" },
  { id: "hpq-101", category: "Emergency Contacts", sortOrder: 101, ownerOnly: false, prompt: "Nearest hospital name and address" },
  { id: "hpq-102", category: "Emergency Contacts", sortOrder: 102, ownerOnly: false, prompt: "Preferred urgent care clinic name and address" },
  { id: "hpq-103", category: "Emergency Contacts", sortOrder: 103, ownerOnly: false, prompt: "Trusted neighbor name and phone number" },
  { id: "hpq-104", category: "Emergency Contacts", sortOrder: 104, ownerOnly: false, prompt: "Property or building manager contact (if applicable)" },
  { id: "hpq-105", category: "Emergency Contacts", sortOrder: 105, ownerOnly: false, prompt: "Emergency plumber, electrician, and general contractor contacts" },
  { id: "hpq-331", category: "Emergency Contacts", sortOrder: 106, ownerOnly: false, prompt: "Local police non-emergency phone number" },
  { id: "hpq-332", category: "Emergency Contacts", sortOrder: 107, ownerOnly: false, prompt: "Local fire department non-emergency number" },
  { id: "hpq-333", category: "Emergency Contacts", sortOrder: 108, ownerOnly: false, prompt: "Electric utility 24-hour outage reporting line" },
  { id: "hpq-334", category: "Emergency Contacts", sortOrder: 109, ownerOnly: false, prompt: "Gas utility 24-hour emergency line" },
  { id: "hpq-335", category: "Emergency Contacts", sortOrder: 110, ownerOnly: false, prompt: "Trusted locksmith 24-hour contact — name and phone" },
  { id: "hpq-336", category: "Emergency Contacts", sortOrder: 111, ownerOnly: false, prompt: "Secondary emergency contact — name, phone, and relationship" },
  { id: "hpq-337", category: "Emergency Contacts", sortOrder: 112, ownerOnly: false, prompt: "Poison Control Center: 1-800-222-1222 — note any specific chemicals or medications in the home" },
  { id: "hpq-338", category: "Emergency Contacts", sortOrder: 113, ownerOnly: false, prompt: "Emergency veterinarian clinic name, address, and phone (if pets are on the property)" },
  { id: "hpq-339", category: "Emergency Contacts", sortOrder: 114, ownerOnly: false, prompt: "After-hours HVAC emergency service contact name and phone" },

  // ── Smart Home & Technology ──────────────────────────────────────────────────
  { id: "hpq-110", category: "Smart Home & Tech", sortOrder: 110, ownerOnly: false, prompt: "Home WiFi network name(s) and router brand / model" },
  { id: "hpq-111", category: "Smart Home & Tech", sortOrder: 111, ownerOnly: false, prompt: "Smart home hub or platform (Alexa / Google Home / Apple HomeKit / SmartThings)" },
  { id: "hpq-112", category: "Smart Home & Tech", sortOrder: 112, ownerOnly: true,  prompt: "Smart lock brand, door location, and access code management note" },
  { id: "hpq-113", category: "Smart Home & Tech", sortOrder: 113, ownerOnly: true,  prompt: "Smart thermostat app name and login location note" },
  { id: "hpq-114", category: "Smart Home & Tech", sortOrder: 114, ownerOnly: false, prompt: "Security camera or NVR app name and device locations" },
  { id: "hpq-115", category: "Smart Home & Tech", sortOrder: 115, ownerOnly: false, prompt: "Network equipment location (router, modem, patch panel, NVR)" },
  { id: "hpq-116", category: "Smart Home & Tech", sortOrder: 116, ownerOnly: false, prompt: "Backup internet option (mobile hotspot or cellular failover device)" },
  { id: "hpq-341", category: "Smart Home & Tech", sortOrder: 117, ownerOnly: false, prompt: "Guest WiFi network name and where to find the guest password" },
  { id: "hpq-342", category: "Smart Home & Tech", sortOrder: 118, ownerOnly: false, prompt: "Irrigation controller app, account login note, and schedule overview" },
  { id: "hpq-343", category: "Smart Home & Tech", sortOrder: 119, ownerOnly: false, prompt: "Whole-home AV or entertainment system brand, universal remote, and control app" },
  { id: "hpq-344", category: "Smart Home & Tech", sortOrder: 120, ownerOnly: false, prompt: "Printer brand, model, network name, and instructions for connecting a new device" },
  { id: "hpq-345", category: "Smart Home & Tech", sortOrder: 121, ownerOnly: false, prompt: "Robot vacuum model, dock station location, home map zones, and cleaning schedule" },
  { id: "hpq-346", category: "Smart Home & Tech", sortOrder: 122, ownerOnly: true,  prompt: "Garage door keypad code note and spare remote fob locations" },
  { id: "hpq-347", category: "Smart Home & Tech", sortOrder: 123, ownerOnly: false, prompt: "Smart lighting scenes or routines (e.g. 'Good Morning', 'Away Mode') and how to access or modify them" },

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
  { id: "hpq-351", category: "Service History", sortOrder: 129, ownerOnly: false, prompt: "Last carpet, rug, or upholstery cleaning date and company" },
  { id: "hpq-352", category: "Service History", sortOrder: 130, ownerOnly: false, prompt: "Last refrigerator coil cleaning and appliance maintenance date (oven, dishwasher filter, washer drum)" },
  { id: "hpq-353", category: "Service History", sortOrder: 131, ownerOnly: false, prompt: "Last garage door tune-up, lubrication, and cable inspection date" },
  { id: "hpq-354", category: "Service History", sortOrder: 132, ownerOnly: false, prompt: "Last generator oil change, service, and load test date (if applicable)" },
  { id: "hpq-355", category: "Service History", sortOrder: 133, ownerOnly: false, prompt: "Last exterior caulking, weatherstripping, and window / door seal inspection date" },
];

async function main() {
  console.log(`\n🏠 Seeding ${QUESTIONS.length} house profile questions…\n`);

  let created = 0;

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
  const categories = new Set(QUESTIONS.map((q) => q.category));
  console.log(`\n✅ House profile now has ${total} questions across ${categories.size} categories.\n`);
  console.log("  Categories:");
  for (const cat of Array.from(categories).sort()) {
    const count = QUESTIONS.filter((q) => q.category === cat).length;
    console.log(`    • ${cat}: ${count} questions`);
  }
  console.log();
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
