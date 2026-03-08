export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  authorTitle: string;
  date: string;
  category: string;
  readTime: string;
  content: string; // safe static HTML — all content is authored internally
}

export const posts: BlogPost[] = [
  {
    slug: "what-to-document-before-hiring-a-house-manager",
    title: "5 Things Every Homeowner Should Document Before Hiring a House Manager",
    excerpt:
      "Starting a new management relationship without a documented foundation is the fastest way to miscommunication. Here's what to have ready before day one.",
    author: "The House Ledger Team",
    authorTitle: "Home Management Experts",
    date: "March 1, 2026",
    category: "Homeowner Tips",
    readTime: "5 min read",
    content: `
<p>Hiring a house manager is one of the best investments you can make in your home — but only if both sides start from the same page. The most common friction between homeowners and managers isn't attitude or work ethic. It's missing information.</p>

<p>Before your new manager shows up on day one, here are the five things every homeowner should have documented and ready to hand over.</p>

<h2>1. A Complete Utility & Systems Reference</h2>
<p>Your manager will eventually need to deal with the power going out, a circuit breaker tripping, or the water heater making a strange noise. If they don't know where the main shutoff valve is, or which breaker panel controls which wing of the house, a small problem becomes a big one.</p>
<p>Document every major system in your home:</p>
<ul>
  <li><strong>Water:</strong> main shutoff location, hot water heater type and age, water softener settings</li>
  <li><strong>Electrical:</strong> breaker panel location, any secondary panels, generator hookup instructions</li>
  <li><strong>HVAC:</strong> thermostat access codes, filter sizes, service schedule, contractor contacts</li>
  <li><strong>Security:</strong> alarm codes, camera system access, gate codes and override procedures</li>
</ul>

<h2>2. Appliance Details and Quirks</h2>
<p>Every home has at least one appliance with a quirk only the owner knows about — the dryer that needs an extra minute, the dishwasher door that has to be held a certain way. Write them all down. Include model numbers and serial numbers too, which makes warranty claims and service calls dramatically faster.</p>

<h2>3. Emergency Contact Hierarchy</h2>
<p>Who does your manager call if something breaks? Who do they call if they can't reach that person? Who handles a plumbing emergency at 11pm on a Friday? A clear, ranked list of emergency contacts — with names, roles, and numbers — means your manager can act fast without having to track you down first.</p>

<h2>4. Your Approved Vendor List</h2>
<p>If your manager needs to hire a plumber, landscaper, or electrician, who are the people you trust? An approved vendor list prevents your manager from hiring a stranger off the internet when something needs attention. Include the vendor name, specialty, contact info, and any per-job spending limits you've authorized.</p>

<h2>5. Household Standards and Preferences</h2>
<p>This is the one most homeowners skip — and it causes the most friction. How do you like the house kept? Are there rooms that are off-limits? Do you prefer a particular cleaning product? Is there a certain way the furniture should be arranged after cleaning?</p>
<p>It might feel trivial to write these down, but standards and preferences are what defines whether your manager is doing a great job or just an acceptable one. When your expectations are documented, your manager can meet them consistently without guessing.</p>

<h2>The Easiest Way to Do All of This</h2>
<p>The House Ledger System's <strong>House Profile</strong> feature is built exactly for this. It walks you through 100+ questions covering every category above — utilities, appliances, emergency contacts, vendors, household standards, and more. You fill it in once, your manager has access to everything they need from day one, and it stays updated as things change.</p>
<p>A well-documented home is a well-managed home. The five categories above are your starting point.</p>
    `,
  },
  {
    slug: "how-to-build-a-home-sop",
    title: "How to Build Room-by-Room SOPs That Your Manager Will Actually Use",
    excerpt:
      "A standard operating procedure for your home sounds formal — but done right, it's the clearest way to get consistent results from anyone who works in your home.",
    author: "The House Ledger Team",
    authorTitle: "Home Management Experts",
    date: "February 20, 2026",
    category: "Home Management",
    readTime: "7 min read",
    content: `
<p>Walk into any well-run hotel, restaurant, or office building and you'll find one thing they all have in common: documented operating procedures. Every staff member knows exactly what "done right" looks like for every task. The result is consistent quality regardless of who's working that day.</p>
<p>Your home deserves the same standard — and a room-by-room SOP is how you get there.</p>

<h2>What Is a Home SOP?</h2>
<p>A home SOP (Standard Operating Procedure) is a document that describes, room by room, what maintained looks like for your property. It might include:</p>
<ul>
  <li>How a room should be left at the end of each day</li>
  <li>Specific cleaning instructions or product requirements</li>
  <li>What to check for during routine walkthroughs</li>
  <li>Reference photos showing exactly how furniture, decor, and surfaces should look</li>
</ul>
<p>A good SOP doesn't micromanage — it clarifies. The goal is that any competent person could walk in, read the SOP for a room, and know exactly what needs to happen without having to ask you.</p>

<h2>Start With the Rooms That Matter Most</h2>
<p>You don't need to document every closet before you start. Begin with the highest-traffic and highest-standard areas:</p>
<ul>
  <li><strong>Kitchen</strong> — food safety, appliance care, countertop standards</li>
  <li><strong>Primary Bedroom</strong> — linen routine, surface care, any owner-specific preferences</li>
  <li><strong>Primary Bathroom</strong> — cleaning frequency, product placement, towel presentation</li>
  <li><strong>Living Areas</strong> — furniture arrangement, cushion placement, floor care</li>
  <li><strong>Outdoor Spaces</strong> — furniture cover rotation, pool/hot tub checks, seasonal tasks</li>
</ul>
<p>Once the core rooms are documented, add supplementary spaces as time allows.</p>

<h2>Reference Photos Are Worth 1,000 Words</h2>
<p>The most underused tool in home management documentation is the photograph. A photo of the living room set up perfectly communicates the standard far better than any written description. After a deep clean, walk through and take a photo of each room showing exactly how it should look.</p>
<p>Attach those photos to the relevant SOP section. Now your manager has a visual target, not just a list of instructions.</p>

<h2>Keep Instructions Specific, Not Vague</h2>
<p>The difference between an SOP that gets followed and one that doesn't is specificity. Compare these two versions:</p>
<ul>
  <li><strong>Vague:</strong> "Clean the kitchen."</li>
  <li><strong>Specific:</strong> "Wipe all countertops with the blue microfiber cloth and granite cleaner. Run the dishwasher after dinner and empty it in the morning. Wipe down the stovetop after every use. Check the refrigerator seal weekly."</li>
</ul>
<p>The specific version can't be misunderstood. The vague version leaves room for ten different interpretations.</p>

<h2>Review and Update Seasonally</h2>
<p>Your home changes — renovations happen, new appliances arrive, your preferences evolve. Build a habit of reviewing your SOPs every season to keep them current. An outdated SOP is worse than none, because it creates confusion about which version to follow.</p>

<h2>Build Your SOPs in The House Ledger</h2>
<p>The House Ledger System's <strong>House SOPs</strong> feature is purpose-built for this. You create a section for each room, write your notes and instructions directly in the app, and attach reference photos. Your house manager sees everything in the same portal they use for tasks and communication — no separate documents to track down, no version control problems.</p>
<p>Start with three rooms this week. Your manager will feel the difference immediately.</p>
    `,
  },
  {
    slug: "why-digital-home-management",
    title: "Why Professional Homeowners Are Ditching Spreadsheets for Digital Home Management",
    excerpt:
      "A shared Google Doc and a text thread can get you started — but they can't scale. Here's why dedicated home management software changes the relationship between owners and managers.",
    author: "The House Ledger Team",
    authorTitle: "Home Management Experts",
    date: "February 5, 2026",
    category: "Industry Insights",
    readTime: "4 min read",
    content: `
<p>When homeowners first bring on a house manager, most start the same way: a shared Google Doc for notes, a group text for daily communication, maybe a spreadsheet for tracking expenses. It works — until it doesn't.</p>
<p>As the relationship grows and the property's needs become more complex, those informal tools start to show their limits. Information gets buried in message threads. Task completion depends on memory rather than a system. The owner has no clear view into what's actually happening in the house day to day.</p>

<h2>The Spreadsheet Problem</h2>
<p>Spreadsheets are powerful tools — for people who love spreadsheets. For a house manager whose job is physical and relationship-driven, maintaining a complex sheet is friction on top of friction. Columns get ignored. Updates fall behind. The spreadsheet that was perfectly organized six months ago becomes an unreliable record that nobody fully trusts.</p>
<p>And even a perfectly maintained spreadsheet can only show you data. It can't assign tasks, send reminders, capture photos, log time, or process approvals.</p>

<h2>What Professional Homeowners Need</h2>
<p>Professional homeowners — those managing high-value properties with full-time or part-time staff — need a system built for their specific situation. That means:</p>
<ul>
  <li><strong>Task clarity:</strong> Every recurring task is assigned, scheduled, and visible. There's no ambiguity about what needs to happen or when.</li>
  <li><strong>Communication in context:</strong> Questions, updates, and notes live alongside the relevant task or room — not buried in a separate thread.</li>
  <li><strong>Financial transparency:</strong> Spending requests are tracked, approved, and documented in one place.</li>
  <li><strong>A living knowledge base:</strong> The home's systems, preferences, and history are documented and accessible — not locked in someone's head or a document nobody updates.</li>
</ul>

<h2>The Real Cost of Disorganization</h2>
<p>The cost of a disorganized home management system isn't always visible on a balance sheet — but it's real. It's the hour spent searching message history for an answer that should be in a document. It's the vendor called twice because nobody logged the first call. It's the manager who leaves because the job lacks structure and clear expectations.</p>
<p>Organized systems retain good people. Clear expectations create consistent outcomes. Documentation protects everyone when something goes wrong.</p>

<h2>Why Dedicated Software Makes the Difference</h2>
<p>Dedicated home management software closes the gap between what a spreadsheet can track and what a household actually needs. When your manager clocks in through the same portal where their tasks live and where purchase approvals get processed, the entire household operation becomes coherent. Everyone sees the same information. Nothing falls through the cracks.</p>
<p><strong>The House Ledger System</strong> was built specifically for this relationship — the owner who wants transparency and control, and the manager who wants clear direction and a simple way to document their work. One platform. Every workflow a managed home requires.</p>
<p>If you're still running your household on a text chain and a spreadsheet, you're not alone — but there's a better way.</p>
    `,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}
