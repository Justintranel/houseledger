import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const blogs = [
  {
    title: "5 Things Every Homeowner Should Document Before Hiring a House Manager",
    slug: "5-things-document-before-hiring-house-manager",
    excerpt: "Most homeowners wait until something breaks to start documenting. Here's what to capture before your manager walks in the door — so nothing gets lost in translation.",
    author: "The House Ledger Team",
    category: "Home Management",
    readTime: 5,
    published: true,
    body: `<h2>Most homeowners wait until something breaks to start documenting.</h2>
<p>By then, it's too late. The plumber's number is buried in a text thread from 2021. The alarm code is written on a sticky note that fell behind the fridge. And your new house manager is standing in the kitchen asking questions you can't answer from your office three states away.</p>
<p>The solution isn't reactive — it's proactive. Before your manager shows up on Day 1, here are the five things you need to have locked down.</p>

<h3>1. Every Vendor and Service Provider</h3>
<p>Your home runs on relationships — with your HVAC technician, your landscaper, your pest control company, your pool service. Document every single one: name, phone number, email, what they service, how often they come, what they charge, and when the contract renews.</p>
<p>If you have a preferred contact at a company (the guy who actually knows your system), note that too. This information lives in your manager's head right now. The moment they leave, it walks out the door with them.</p>

<h3>2. Your Home's Emergency Protocols</h3>
<p>What happens when the power goes out? When a pipe bursts at 2am? When the gate code fails and a vendor is locked outside? Every home has its version of these scenarios, and the answers are almost never written down.</p>
<p>Create a simple emergency reference sheet: utility shutoff locations, backup alarm codes, who to call first, who has a spare key. This isn't just for your manager — it's for any trusted person you might need to send in a pinch.</p>

<h3>3. Room-by-Room Standards</h3>
<p>What does "clean" mean in your home? What products go on the marble countertops vs. the granite? Which pieces of furniture get covered before guests arrive? What's off-limits?</p>
<p>Your preferences are invisible until they're violated. Write them down room by room. It sounds tedious — but a one-time 30-minute walk-through translated into written SOPs will save you dozens of uncomfortable "that's not how I like it" conversations.</p>

<h3>4. Your Appliance and Systems Inventory</h3>
<p>Make, model, purchase date, warranty status, and the location of the manual. For every major appliance and home system. Refrigerator, HVAC units, water heater, washer/dryer, smart home hubs, security cameras, irrigation controllers — all of it.</p>
<p>When something needs repair, this list cuts diagnostic time in half. When something needs to be replaced, you have the data to make a smart decision instead of guessing.</p>

<h3>5. Your Communication Preferences</h3>
<p>How often do you want updates? Text or email? Do you want a weekly summary or real-time notifications? What decisions can your manager make independently, and what requires your sign-off?</p>
<p>Setting these expectations before the job starts eliminates the biggest source of friction in owner-manager relationships: mismatched assumptions about autonomy and reporting.</p>

<h2>The Bottom Line</h2>
<p>None of this has to be perfect on Day 1. But having it written down — somewhere accessible — is the difference between a manager who can hit the ground running and one who's constantly waiting for answers that only you can provide.</p>
<p>The House Ledger was built to make this documentation process simple, searchable, and shareable. If you're ready to get your home organized before your next manager starts, we'd love to show you how.</p>`,
  },
  {
    title: "How to Build Room-by-Room SOPs That Your Manager Will Actually Use",
    slug: "build-room-by-room-sops-house-manager",
    excerpt: "Standard Operating Procedures sound corporate. But for a well-run home, they're the difference between a manager who guesses and one who executes perfectly every time.",
    author: "The House Ledger Team",
    category: "House Manager Tips",
    readTime: 7,
    published: true,
    body: `<h2>SOPs sound corporate. Your home isn't a factory.</h2>
<p>But here's the thing: your home has standards. You just haven't written them down yet.</p>
<p>You know which way the toilet paper goes. You know that the throw pillows on the sectional get arranged in a specific order. You know that nobody touches the Le Creuset with metal utensils. These aren't arbitrary preferences — they're the accumulated knowledge of how your home runs at its best.</p>
<p>The problem is that this knowledge only lives in your head. And the moment someone new is responsible for your home, they're operating blind.</p>
<p>Here's how to build SOPs that are actually useful.</p>

<h3>Start With a Walk-Through, Not a Spreadsheet</h3>
<p>Don't sit at your desk and try to remember everything. Walk through your home room by room with your phone recording audio (or someone taking notes). Narrate what you see, what you care about, and what you'd want done differently than the default.</p>
<p>You'll catch things you'd never remember sitting at a desk: the way light hits the dining table at 4pm and shows every smudge, the cabinet door that needs to be lifted slightly to close properly, the fact that the guest bathroom exhaust fan needs to run for 10 minutes after a shower or the ceiling gets moisture spots.</p>

<h3>The Four Elements of a Good Room SOP</h3>
<p><strong>What gets done:</strong> The specific tasks, in order. Not "clean the kitchen" — "wipe down all appliance faces with the microfiber cloth, clean the stovetop with the degreaser under the sink, empty the Vitamix immediately after use."</p>
<p><strong>How it gets done:</strong> Products, tools, and techniques. Especially for anything that could damage a surface if done wrong. Marble, hardwood, brushed nickel, leather — all of these have right answers and wrong answers.</p>
<p><strong>When it gets done:</strong> Daily, weekly, monthly, seasonally. The cadence matters as much as the task.</p>
<p><strong>What done looks like:</strong> The standard for completion. A photo reference is worth a thousand words here — a photo of the made bed, the arranged pillows, the stocked pantry as it should look.</p>

<h3>Prioritize High-Stakes Rooms First</h3>
<p>You don't have to document everything at once. Start with the rooms where mistakes are most costly or most visible:</p>
<ul>
<li>The kitchen (most complex, most used, most potential for damage)</li>
<li>The primary bedroom and bathroom (most personal)</li>
<li>Guest spaces (where standards matter most when people are watching)</li>
<li>Outdoor areas (where deferred maintenance compounds fastest)</li>
</ul>

<h3>Make It Visual Where Possible</h3>
<p>Photos of how things should look. Short videos for complex processes (like operating a complicated appliance or setting up the outdoor sound system). A labeled diagram of where everything lives in the supply closet.</p>
<p>Written instructions are a starting point. Visual references are what managers actually use when they're not sure.</p>

<h3>Keep It Alive, Not Archived</h3>
<p>An SOP document that lives in a folder nobody opens is worthless. Your SOPs need to be in a system your manager can access on their phone while standing in the room. They need to be updated when things change. And they need to be the actual reference point for any "wait, how do I do this?" question.</p>
<p>That's why we built The House Ledger's SOP system to be room-based, photo-enabled, and mobile-accessible. Your manager should be able to pull up the kitchen SOP while standing in the kitchen.</p>

<h2>The Result</h2>
<p>A manager with good SOPs doesn't need to ask as many questions. They make fewer mistakes. They handle your home with the same care you would. And when they leave (because eventually they all do), their replacement can onboard in days instead of months.</p>`,
  },
  {
    title: "Why Professional Homeowners Are Ditching Spreadsheets for Digital Home Management",
    slug: "ditching-spreadsheets-digital-home-management",
    excerpt: "Spreadsheets work — until they don't. Here's why more homeowners with staff are moving to purpose-built systems, and what they're gaining in the switch.",
    author: "The House Ledger Team",
    category: "Technology",
    readTime: 4,
    published: true,
    body: `<h2>The spreadsheet era of home management is ending.</h2>
<p>For years, organized homeowners ran their properties the same way: a shared Google Sheet for vendor contacts, a notes app for SOPs, a group text thread for task updates, and a folder somewhere in Google Drive with appliance manuals nobody could find.</p>
<p>It worked. Kind of. Until it didn't.</p>

<h3>The Problem With Spreadsheets Isn't the Spreadsheet</h3>
<p>It's the fragmentation. Your vendor list is in one place. Your task calendar is in another. Your manager's notes are in their personal phone. Your maintenance history is in a folder that hasn't been opened since 2022.</p>
<p>When something goes wrong — and something always goes wrong — you're doing archaeology. Searching through old texts, calling your manager, trying to remember which plumber you used last time and whether they were any good.</p>

<h3>What Homeowners With Staff Actually Need</h3>
<p>When you have a house manager or household staff, your information needs are different from a typical homeowner. You need:</p>
<ul>
<li><strong>A shared source of truth</strong> — so your manager and you are looking at the same information</li>
<li><strong>A communication layer</strong> — direct, documented, not buried in iMessage</li>
<li><strong>Task visibility</strong> — knowing what's been done, what's pending, what's overdue</li>
<li><strong>Vendor and maintenance history</strong> — so institutional knowledge survives staff turnover</li>
<li><strong>Access control</strong> — you're the owner; you set the standards and your manager executes them</li>
</ul>
<p>No spreadsheet does all of this. No combination of apps does it cleanly. They all require manual syncing, repeated data entry, and a lot of "wait, which version is current?"</p>

<h3>What the Switch Actually Looks Like</h3>
<p>Homeowners who move to a purpose-built system like The House Ledger typically describe the same experience: the first two weeks feel like setup, and then everything gets quieter.</p>
<p>Fewer "quick question" texts from the manager. Fewer "what did we decide?" conversations. Fewer moments of not knowing whether a task actually got done. The information is in the system. Anyone who needs it can find it.</p>

<h3>This Isn't About Technology — It's About Control</h3>
<p>The owners who manage their homes best aren't necessarily the most organized people. They're the ones who have built systems that don't depend on any one person's memory or habits.</p>
<p>When the information lives in a shared system, the owner is always informed. When the manager leaves, the knowledge doesn't. When something breaks, the history is there. When a new vendor needs context, the record exists.</p>
<p>Spreadsheets can technically hold all of this. But they don't — because they're too flexible, too manual, and too easy to let slide. Purpose-built tools create structure that people actually follow.</p>

<h2>Ready to See the Difference?</h2>
<p>The House Ledger was built specifically for homeowners who employ household staff. Every feature — from the SOP builder to the vendor directory to the direct messaging system — was designed for the owner-manager relationship. If you're running your home on a patchwork of apps and good intentions, we built this for you.</p>`,
  },
  {
    title: "7 Signs You Need a Professional House Manager",
    slug: "7-signs-you-need-professional-house-manager",
    excerpt: "There's a point where a home becomes too complex to manage reactively. Here are the signs that you've crossed that line — and what to do about it.",
    author: "The House Ledger Team",
    category: "Homeowner Advice",
    readTime: 5,
    published: true,
    body: `<h2>Your home is running you. It should be the other way around.</h2>
<p>For most homeowners, there's a tipping point. The property gets bigger, or there's a second home, or the renovation finishes and the maintenance complexity multiplies overnight. Suddenly, managing the house is a part-time job — and it's your part-time job, even though that's not what you signed up for.</p>
<p>Here are seven signs you've crossed the line into needing professional help.</p>

<h3>1. You're Coordinating Vendors Yourself — From Your Work Phone</h3>
<p>If your cell phone has active text threads with your plumber, landscaper, pool guy, and housekeeper, that's not normal homeownership — that's property management. Your time costs money. Spending it scheduling service windows is an expensive hobby.</p>

<h3>2. Maintenance Is Reactive, Not Proactive</h3>
<p>You find out about problems when they become emergencies. The leak that's been dripping inside the wall. The HVAC filter that hasn't been changed in 14 months. The deck that needed sealing last spring. A professional house manager runs a proactive maintenance schedule. You stop paying emergency rates for things that could have been caught early.</p>

<h3>3. You Have No Idea What's In Your Home</h3>
<p>You couldn't name the make and model of your water heater. You're not sure when the roof was last inspected. You've lost the manuals for every major appliance. This isn't a character flaw — it's what happens when nobody is responsible for keeping that information organized. A manager changes that.</p>

<h3>4. Staff Turnover Is Destroying Institutional Knowledge</h3>
<p>Every time a housekeeper or property caretaker leaves, they take with them everything they knew about your home. Which vendors you prefer. Where things are kept. How the irrigation controller works. If you're starting from scratch every time someone new comes on, you don't have a system — you have a dependency.</p>

<h3>5. You Own More Than One Property</h3>
<p>Managing two homes without dedicated help is genuinely difficult. The complexity doesn't double — it multiplies. Different vendor relationships, different maintenance schedules, different seasonal needs. A house manager who oversees multiple properties for you is often the only way to make this sustainable.</p>

<h3>6. Your Home Doesn't Meet Your Standards — But You Don't Know Why</h3>
<p>Something always feels off. A room that's never quite right. A standard that's never quite met. But you can't put your finger on it because nobody is accountable for the details. A professional manager owns the standard and is responsible for hitting it consistently.</p>

<h3>7. You're Not Present Enough to Stay on Top of It Yourself</h3>
<p>Travel, work, family — life gets busy. If you're away from your home more than you're present, you need someone who is the constant. Someone who is there, who knows the property, and who you trust to manage it with your standards when you can't.</p>

<h2>What to Do Next</h2>
<p>If three or more of these resonated, you're past the point of pushing through on your own. The question isn't whether to get help — it's how to set it up correctly.</p>
<p>The House Ledger is designed to make the owner-manager relationship structured, documented, and manageable. From the day you hire your first house manager to the day you're running a multi-property portfolio, we give you the tools to stay in control.</p>`,
  },
  {
    title: "The Complete Guide to Home Vendor Management",
    slug: "complete-guide-home-vendor-management",
    excerpt: "Your home runs on vendor relationships. Here's how to build, document, and manage those relationships so your property never gets stuck waiting on a contractor.",
    author: "The House Ledger Team",
    category: "Home Management",
    readTime: 8,
    published: true,
    body: `<h2>The average well-maintained home requires 8 to 15 active vendor relationships.</h2>
<p>HVAC. Plumbing. Electrical. Landscaping. Pool service. Pest control. Window cleaning. Housekeeping. Appliance repair. General handyman. Irrigation. Roof inspection. The list grows with the size and complexity of the property.</p>
<p>Managing these relationships well is one of the highest-leverage things you can do for your home. Here's how.</p>

<h3>Step 1: Document Every Vendor Before You Need Them</h3>
<p>The worst time to find a plumber is when water is coming through your ceiling. Build your vendor directory proactively — before anything breaks.</p>
<p>For each vendor, document:</p>
<ul>
<li>Company name and primary contact</li>
<li>Phone, email, and preferred contact method</li>
<li>What they service and what they don't</li>
<li>Service frequency and contract terms</li>
<li>Typical response time and emergency availability</li>
<li>Payment method and billing cycle</li>
<li>Notes on quality, reliability, and any preferences</li>
</ul>
<p>This information is worth gold when you need it at 7pm on a Friday.</p>

<h3>Step 2: Build Redundancy Into Critical Categories</h3>
<p>For anything mission-critical — plumbing, electrical, HVAC — have at least two vendors documented. Your primary vendor won't always be available when you need them. Having a vetted backup prevents you from making a panicked decision when something goes wrong.</p>

<h3>Step 3: Formalize the Relationship With a Briefing</h3>
<p>When you bring on a new vendor, give them a brief orientation. What are your standards? What's the communication protocol? Who do they contact for access? Where do they park? What are the house rules?</p>
<p>Vendors who understand your home and your expectations deliver better service. The ones who feel like they're walking into an unknown property every visit will give you unknown-property service.</p>

<h3>Step 4: Log Every Service Visit</h3>
<p>Date, vendor, what was done, what was found, what was left unresolved, what follow-up is needed. This log becomes your home's maintenance history — and it's invaluable when something happens again (because it will), when a vendor tries to bill you for something they already fixed, or when you're deciding whether to replace vs. repair.</p>

<h3>Step 5: Review Vendor Performance Annually</h3>
<p>Once a year, look at your vendor roster with fresh eyes. Are you still happy with the landscaping company? Is the pool service actually doing what the contract says? Are there better options available now?</p>
<p>Homeowners who never review their vendors often keep paying for mediocre service because switching feels like effort. One annual review keeps your vendor relationships honest.</p>

<h3>Step 6: Transfer Knowledge When Staff Changes</h3>
<p>When your house manager leaves, your vendor relationships shouldn't leave with them. If your vendor directory lives in a shared system (not in your manager's phone), the transition is a briefing — not a rebuild.</p>
<p>This is the single most common place where homeowner knowledge gets lost. Protect it by keeping it in a system you own.</p>

<h2>The Vendor Directory Is the Foundation</h2>
<p>Almost everything else in home management depends on knowing who to call and having a record of what's been done. Get this part right, and a lot of other things get easier.</p>
<p>The House Ledger's vendor module is built for exactly this: a centralized, shared directory that your manager maintains and you always have access to. No more hunting for a phone number when you need it most.</p>`,
  },
  {
    title: "How to Onboard a New House Manager Without the Chaos",
    slug: "how-to-onboard-new-house-manager",
    excerpt: "The first 30 days with a new house manager set the tone for everything that follows. Here's how to structure the onboarding so your standards are clear from day one.",
    author: "The House Ledger Team",
    category: "House Manager Tips",
    readTime: 6,
    published: true,
    body: `<h2>Most house manager onboardings are improvised. That's why most are painful.</h2>
<p>The new manager shows up. They get a tour. They're handed a few phone numbers. And then they're expected to figure out the rest through trial, error, and a lot of questions you didn't expect to have to answer.</p>
<p>It doesn't have to be this way. A structured onboarding takes more work upfront — and saves enormous amounts of time, friction, and frustration for the next year.</p>

<h3>Week 1: The Foundation</h3>
<p><strong>The property walkthrough.</strong> Not a casual tour — a systematic walk through every space with the purpose of documenting how things work and what the standards are. Record it. Take photos. This becomes the basis for your SOPs.</p>
<p><strong>Vendor introductions.</strong> Wherever possible, introduce your new manager to your key vendors directly — or at minimum, share contact information with context. "This is Maria at Coastal Landscaping — she's been with us three years and knows the property. Call her directly for anything lawn-related."</p>
<p><strong>System access.</strong> Alarm codes, smart home access, gate codes, vehicle codes, wifi passwords, delivery instructions. All of it, in writing, in a place that's secure and accessible.</p>

<h3>Week 2: Standards and Expectations</h3>
<p><strong>Review your SOPs together.</strong> Walk through each room's standards in person, not just on paper. Let your manager ask questions. Clarify anything that could be interpreted multiple ways.</p>
<p><strong>Establish the communication cadence.</strong> How often do you want updates? What format? What decisions can they make independently vs. what needs your approval? Set these expectations explicitly — don't let them be inferred.</p>
<p><strong>Define success.</strong> What does excellent look like? What would cause you to have a problem? Having this conversation directly, early, is awkward for about 10 minutes and prevents months of simmering frustration.</p>

<h3>Week 3: Supervised Independence</h3>
<p>Let your manager start executing with you available for questions. Don't micromanage — but be responsive. This week surfaces the gaps in your documentation and the places where your instructions were less clear than you thought.</p>
<p>Every question your manager asks this week is a SOP you haven't written yet. Take note of them. Update your documentation.</p>

<h3>Week 4: Review and Calibrate</h3>
<p>Sit down for a formal 30-day check-in. What's working? What's unclear? What needs to be changed? What questions keep coming up?</p>
<p>This conversation, done honestly, sets the relationship up for success. It signals that you're a thoughtful employer who wants the working relationship to work well — not just an owner waiting to catch mistakes.</p>

<h3>The Documentation Advantage</h3>
<p>Everything described above is dramatically easier when it lives in a system. The SOPs your manager can pull up on their phone. The vendor directory they can search by category. The task list that makes expectations visible and progress trackable.</p>
<p>The House Ledger was designed to be the onboarding system for owner-manager relationships. When your home is documented in the platform, a new manager can get oriented in days — not weeks.</p>`,
  },
  {
    title: "Building a Home Maintenance Schedule That Actually Works",
    slug: "home-maintenance-schedule-that-works",
    excerpt: "Most maintenance schedules get abandoned by March. Here's how to build one that survives contact with real life — and keeps your home in peak condition year-round.",
    author: "The House Ledger Team",
    category: "Cleaning & Maintenance",
    readTime: 6,
    published: true,
    body: `<h2>The average homeowner handles maintenance reactively.</h2>
<p>They fix things when they break. They call the HVAC company when it stops working. They patch the roof when water comes in. They replace the water heater when it fails.</p>
<p>This approach is expensive. Emergency service rates are 40-60% higher than scheduled service rates. Deferred maintenance compounds — the small leak that becomes structural damage, the clogged filter that kills a $4,000 system.</p>
<p>A proactive maintenance schedule changes the economics of homeownership. Here's how to build one that sticks.</p>

<h3>Start With the Four Seasons Framework</h3>
<p>Organize your maintenance tasks by season. This makes the schedule feel manageable — you're only looking at the next 90 days at any time, not a year-long list that feels overwhelming.</p>
<p><strong>Spring:</strong> HVAC service for cooling season, exterior inspection after winter, irrigation system startup, outdoor furniture condition check, deck/patio inspection, gutter clearing.</p>
<p><strong>Summer:</strong> Pool equipment inspection, pest control assessment, landscaping adjustment, window and door seal check, outdoor lighting check.</p>
<p><strong>Fall:</strong> HVAC service for heating season, irrigation winterization, gutter cleaning (post-leaf drop), fireplace and chimney inspection, weather stripping check, generator test.</p>
<p><strong>Winter:</strong> Pipe insulation check, emergency kit review, deep cleaning of rarely-accessed spaces, vendor contract renewals, annual appliance checks.</p>

<h3>Add Monthly and Weekly Cadences</h3>
<p>Beyond seasonal tasks, build in regular recurring maintenance:</p>
<p><strong>Monthly:</strong> HVAC filter check, smoke and CO detector test, refrigerator coil cleaning, garbage disposal treatment, drain clearing.</p>
<p><strong>Weekly:</strong> Pool chemistry check (if applicable), trash and recycling, exterior walkthrough for anything that needs attention.</p>

<h3>Assign Every Task to a Responsible Party</h3>
<p>A maintenance schedule without ownership is a wish list. Every task needs a name next to it — your house manager, a specific vendor, or you. When nobody is accountable, everything gets deferred.</p>

<h3>Build In the Buffer</h3>
<p>Maintenance rarely happens exactly when scheduled. Vendors get delayed. Weather interferes. Life intervenes. Schedule tasks with a two-week window, not a single date. "HVAC service: first two weeks of April" is more executable than "HVAC service: April 3rd."</p>

<h3>Track Completion, Not Just Scheduling</h3>
<p>The most valuable part of a maintenance system isn't the schedule — it's the history. When was the last time the water heater was flushed? When did we last have the electrical panel inspected? When was the roof last looked at?</p>
<p>This record is what lets you make smart decisions. It's what you show a buyer when you sell. It's what your insurance company asks about when there's a claim.</p>

<h2>Make It Visible</h2>
<p>A maintenance schedule that lives in a notebook in a drawer doesn't work. It needs to be somewhere your house manager sees it, where completion gets logged, and where you can check status without asking.</p>
<p>The House Ledger's task system is built for exactly this — recurring maintenance tasks with cadence, ownership, and completion tracking. Your home's maintenance schedule becomes a living document, not an annual intention.</p>`,
  },
  {
    title: "What to Do When Your House Manager Quits",
    slug: "what-to-do-when-house-manager-quits",
    excerpt: "Staff turnover in private homes is common. Here's how to handle a manager's departure without losing everything they knew about your property.",
    author: "The House Ledger Team",
    category: "Home Management",
    readTime: 5,
    published: true,
    body: `<h2>It happens to everyone eventually. Your house manager is leaving.</h2>
<p>Maybe it's a better opportunity. Maybe it's personal circumstances. Maybe it simply ran its course. Whatever the reason, the departure of a trusted house manager can feel like losing an entire operating system for your home.</p>
<p>How disruptive this is depends almost entirely on one thing: how much of your home's knowledge lives in your manager's head vs. in a documented system.</p>

<h3>The Two-Week Window</h3>
<p>Most managers give two weeks notice. This is your documentation sprint window. If you don't already have your home's information captured, this is the time to do it — with your manager's help.</p>
<p>Sit down with them and go through:</p>
<ul>
<li>Every vendor they work with, including informal contacts and preferences</li>
<li>Current open tasks and where things stand</li>
<li>Any quirks of the property they've learned that aren't written down</li>
<li>Pending vendor appointments or contract renewals</li>
<li>The status of any ongoing projects or issues</li>
<li>Their notes on what works, what doesn't, and what they wish they'd known when they started</li>
</ul>
<p>This is also the moment to change access credentials: alarm codes, smart home access, property keys, digital accounts. Do this systematically on their last day, not as an afterthought.</p>

<h3>The Interim Period</h3>
<p>Before your next manager starts, you or someone you trust will be managing the home. For this period, you need:</p>
<ul>
<li>A clear list of what actually requires immediate attention vs. what can wait</li>
<li>Direct vendor contacts for anything time-sensitive</li>
<li>A simple daily/weekly task checklist for whoever is filling the gap</li>
</ul>
<p>Don't try to maintain everything at your usual standards during the transition. Triage to critical maintenance and let non-essentials wait.</p>

<h3>Hiring the Next Manager</h3>
<p>The best time to think about what you want in your next manager is right after the last one leaves — when the gaps are fresh and specific. Write down what your departing manager did well and where you wished things were different. Use this to sharpen your job description and interview questions.</p>

<h3>The System Makes the Difference</h3>
<p>Homeowners who've been through multiple manager transitions know the difference between a documented home and an undocumented one. With documentation, a new manager onboards in a week or two. Without it, you're rebuilding from scratch every time — at significant cost to your time, your vendors' time, and your home's consistency.</p>
<p>The House Ledger was designed to hold institutional knowledge at the property level, not the person level. Your manager is logged into the system. When they leave, the information stays. The next manager logs in and inherits a complete record of your home.</p>
<p>If you're going through a manager transition right now, we can have your home's foundational information set up in a day. Let's talk.</p>`,
  },
  {
    title: "Managing a Home From Afar: A Guide for Frequent Travelers",
    slug: "managing-home-from-afar-frequent-travelers",
    excerpt: "If you spend significant time away from your primary residence, you need more than a house sitter. Here's how to stay genuinely in control when you're not there.",
    author: "The House Ledger Team",
    category: "Homeowner Advice",
    readTime: 6,
    published: true,
    body: `<h2>Being away from your home doesn't have to mean being out of the loop.</h2>
<p>For homeowners who travel frequently — whether for work, for a second residence, or simply by lifestyle choice — the challenge isn't finding someone to watch the house. It's staying genuinely informed about what's happening, what's been handled, and what needs your attention, without being tethered to your phone.</p>

<h3>The Trust-But-Verify Reality</h3>
<p>Even the best house managers have their own judgment about what's worth reporting and what can wait. Left to their own devices, most managers underreport — not out of deception, but because they don't know exactly what level of detail you want.</p>
<p>The solution isn't to demand more communication. It's to build a system where visibility is automatic, not dependent on someone choosing to tell you something.</p>

<h3>What "Remote Control" Actually Requires</h3>
<p><strong>A task system with completion tracking.</strong> Not "tell me when things are done" — a system where your manager marks tasks complete and you can see it. The difference between "it's handled" and being able to see that it's handled is significant when you're 3,000 miles away.</p>
<p><strong>A communication channel that creates a record.</strong> Text messages are ephemeral and easily lost. A documented communication channel — where conversations about your home live in one place and can be referenced later — is more useful for a property than a text thread.</p>
<p><strong>Vendor access protocols.</strong> While you're away, vendors will come and go. Who lets them in? Who supervises the work? Who signs off on completion? These questions need answers before you leave, not solved ad hoc while you're in a meeting in another time zone.</p>
<p><strong>A photo documentation habit.</strong> Train your manager to photo-document issues, completed work, and anything unusual. A picture sent through your management system is worth more than any amount of verbal reassurance.</p>

<h3>The Pre-Departure Checklist</h3>
<p>Before any extended absence, run through:</p>
<ul>
<li>All scheduled vendor visits during your absence — confirmed and on the calendar</li>
<li>Emergency contact hierarchy (your manager → your property contact → you)</li>
<li>Budget authority — what decisions can your manager make without you?</li>
<li>What you want documented while you're gone</li>
<li>Check-in schedule — even a brief weekly summary keeps you informed without demanding constant updates</li>
</ul>

<h3>The Return Walkthrough</h3>
<p>When you come back, don't skip the walkthrough. A 20-minute walk through the property with your manager — reviewing what happened while you were away — catches things that might otherwise slip, and signals to your manager that attention to detail matters.</p>
<p>It also builds trust in both directions. They know you're paying attention. You get direct confirmation that standards are being maintained.</p>

<h2>Peace of Mind Is a System Problem</h2>
<p>The homeowners who travel most comfortably are the ones who've invested in the systems that give them visibility. They're not constantly wondering. They have a manager they trust, a platform where they can see what's happening, and a property that runs to their standards whether they're home or not.</p>
<p>That's what The House Ledger is designed to enable. If your home currently requires your physical presence to stay on track, let's change that.</p>`,
  },
  {
    title: "The True Cost of Running a Home at a High Standard",
    slug: "true-cost-running-home-high-standard",
    excerpt: "Most homeowners underestimate what it actually costs to maintain a property at a genuinely high standard. Here's an honest breakdown — and how to spend those dollars smarter.",
    author: "The House Ledger Team",
    category: "Homeowner Advice",
    readTime: 7,
    published: true,
    body: `<h2>The sticker price on a home is just the beginning.</h2>
<p>Maintaining a property at a high standard — the kind where things work reliably, where guests are impressed, where you're never embarrassed to come home — requires ongoing investment that most homeowners dramatically underestimate.</p>
<p>This isn't a complaint. It's useful information. Understanding the real cost of home management lets you budget properly, make smarter decisions, and stop being surprised by expenses that were actually predictable.</p>

<h3>The Rule of Thumb: 1-3% Annually</h3>
<p>Financial advisors typically recommend budgeting 1-3% of your home's value per year for maintenance and repairs. For a $2 million home, that's $20,000-$60,000 annually. For a $5 million property, $50,000-$150,000.</p>
<p>This number surprises most people. But it's not arbitrary — it reflects the real cost of keeping systems current, addressing deferred maintenance, and handling the inevitable unexpected repairs that every property generates.</p>

<h3>Where the Money Actually Goes</h3>
<p><strong>Routine maintenance contracts:</strong> HVAC service contracts, landscaping, pool service, pest control, gutter cleaning, window washing, housekeeping. These are your baseline operational costs — the price of maintaining what you have.</p>
<p><strong>Preventive maintenance:</strong> Roof inspections, chimney sweeps, electrical panel checks, plumbing assessments, appliance servicing. These catch problems before they become expensive. Skipping them is a false economy.</p>
<p><strong>System replacements:</strong> HVAC units last 10-15 years. Water heaters last 8-12. Roofs last 20-30. Appliances have their own lifecycles. A well-managed home has a capital replacement budget — money set aside each year for eventual major system replacements.</p>
<p><strong>Responsive repairs:</strong> No matter how proactive you are, things break. Budgeting for responsive repairs separately from planned maintenance prevents unpleasant surprises.</p>
<p><strong>Staffing:</strong> A full-time house manager costs $60,000-$120,000 or more depending on market and property size. Part-time or shared arrangements cost proportionally less. This is often the expense homeowners add last — and wish they'd added sooner.</p>

<h3>The Hidden Cost: Your Time</h3>
<p>Every hour you spend coordinating vendors, managing staff, troubleshooting home issues, and chasing down information about your property is an hour you're not spending on something else. For most homeowners with well-staffed homes, that time has meaningful dollar value.</p>
<p>A house manager who handles all vendor coordination, maintenance scheduling, and daily operations for 40 hours a week is not a luxury — it's a reasonable solution to a real time problem.</p>

<h3>How to Spend the Money Smarter</h3>
<p><strong>Invest in prevention, not just repair.</strong> The HVAC service contract that seems expensive saves significantly compared to emergency replacement.</p>
<p><strong>Build a maintenance reserve.</strong> Set aside money monthly toward known future capital expenses. It's less painful than writing a $15,000 check when the HVAC fails.</p>
<p><strong>Track everything.</strong> Homeowners who track their maintenance spending make better decisions than those who don't. You can't optimize what you don't measure.</p>
<p><strong>Hire before you're desperate.</strong> Homeowners who hire house managers proactively — before they're overwhelmed — get better candidates and set up better systems than those hiring in a crisis.</p>

<h2>Knowledge Is the Best Investment</h2>
<p>The most expensive home management mistakes happen in information vacuums. Not knowing a system's service history. Not having a relationship with a reliable contractor before you need one. Not knowing what your manager is (or isn't) doing while you're away.</p>
<p>The House Ledger is built around the idea that information, properly organized and shared, makes every dollar you spend on your home work harder. That's a return worth having.</p>`,
  },
];

async function main() {
  console.log("🌱 Seeding 10 blog posts...\n");

  for (const blog of blogs) {
    const post = await prisma.blogPost.upsert({
      where: { slug: blog.slug },
      update: blog,
      create: {
        ...blog,
        publishedAt: new Date(),
      },
    });
    console.log(`  ✔ "${post.title}"`);
  }

  console.log("\n✅ All 10 blog posts published!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
