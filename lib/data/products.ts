import type { CategoryId, ContentItem, Product } from "@/lib/types";

type Seed = {
  title: string;
  tagline: string;
  description: string;
  category: CategoryId;
  price: number;
  by: string;
  rating: number;
  reviews: number;
  sales: number;
  tags: string[];
  date: string;
  accent: number;
  featured?: boolean;
  contents: ContentItem[];
  preview: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const lessons = (titles: string[], base = 9): ContentItem[] =>
  titles.map((title, i) => ({ title, detail: `Lesson ${i + 1}`, minutes: base + ((i * 7) % 14) }));

const SEEDS: Seed[] = [
  // Claude Skills
  {
    title: "Contract Redliner Skill",
    tagline: "Claude reviews NDAs and MSAs like a senior associate.",
    description:
      "A Claude Skill that teaches Claude your firm's playbook. Drop in a contract and get a clause by clause redline, a risk table and a negotiation email. Ships with a playbook template you fill once and reuse forever.",
    category: "claude-skills",
    price: 7900,
    by: "mira",
    rating: 4.9,
    reviews: 312,
    sales: 2840,
    tags: ["legal", "contracts", "review"],
    date: "2026-09-28",
    accent: 268,
    featured: true,
    contents: [
      { title: "SKILL.md", detail: "Core instructions and triggers" },
      { title: "playbook.template.md", detail: "Fill in your fallback positions" },
      { title: "risk-matrix.md", detail: "Scoring rubric for 40 clause types" },
      { title: "examples/", detail: "6 annotated before and after redlines" },
    ],
    preview: `---
name: contract-redliner
description: Use when the user shares a contract (NDA, MSA, SOW, DPA) and wants review, redlines or risk analysis.
---

# Contract Redliner

1. Identify the contract type and governing law.
2. Load playbook.template.md and compare every clause.
3. For each deviation output: clause, risk (low/med/high), suggested redline, fallback.
4. Finish with a short email the user can send to the counterparty.`,
  },
  {
    title: "Brand Voice Guardian",
    tagline: "Every draft Claude writes sounds exactly like your brand.",
    description:
      "Encode your tone, banned words, rhythm and examples into a Skill. Claude checks and rewrites drafts so marketing, support and sales all sound like one company.",
    category: "claude-skills",
    price: 3900,
    by: "jules",
    rating: 4.8,
    reviews: 188,
    sales: 1930,
    tags: ["brand", "writing", "marketing"],
    date: "2026-08-14",
    accent: 12,
    contents: [
      { title: "SKILL.md", detail: "Voice check and rewrite workflow" },
      { title: "voice-profile.md", detail: "Guided worksheet to capture your voice" },
      { title: "scorecard.md", detail: "10 point voice scoring" },
    ],
    preview: `---
name: brand-voice-guardian
description: Use when writing or editing any customer facing copy for the brand.
---

Before returning copy, score it against voice-profile.md.
If the score is under 8/10, rewrite and explain the 3 biggest changes.`,
  },
  {
    title: "SQL Analyst Skill",
    tagline: "Turn plain questions into tested, commented SQL.",
    description:
      "Point Claude at your schema docs and ask questions in English. The Skill plans the query, writes it, explains each join and flags anything that might double count.",
    category: "claude-skills",
    price: 4900,
    by: "rafa",
    rating: 4.7,
    reviews: 141,
    sales: 1210,
    tags: ["data", "sql", "analytics"],
    date: "2026-07-30",
    accent: 290,
    featured: true,
    contents: [
      { title: "SKILL.md", detail: "Query planning workflow" },
      { title: "schema-notes.template.md", detail: "Describe your tables once" },
      { title: "pitfalls.md", detail: "Fan out joins, nulls, time zones" },
      { title: "scripts/validate.sql", detail: "Row count sanity checks" },
    ],
    preview: `---
name: sql-analyst
description: Use when the user asks a business question that needs data from the warehouse.
---

1. Restate the question as a metric + grain + filters.
2. Check schema-notes for the right tables.
3. Write the query with CTEs, one per idea.
4. Run the pitfalls checklist before answering.`,
  },
  {
    title: "Investor Update Writer",
    tagline: "Monthly investor updates in 10 minutes, not 3 hours.",
    description:
      "Feed Claude your metrics and a few bullet notes. The Skill writes a crisp update with highlights, lowlights, asks and a KPI table in the format top investors actually read.",
    category: "claude-skills",
    price: 2900,
    by: "mira",
    rating: 4.8,
    reviews: 96,
    sales: 870,
    tags: ["startup", "finance", "writing"],
    date: "2026-06-11",
    accent: 250,
    contents: [
      { title: "SKILL.md", detail: "Update structure and tone rules" },
      { title: "kpi-table.md", detail: "Auto formatted metrics table" },
      { title: "examples/", detail: "3 real (anonymized) updates" },
    ],
    preview: `---
name: investor-update
description: Use when the user wants to write a monthly or quarterly investor update.
---

Structure: TL;DR (3 lines) -> Highlights -> Lowlights -> Metrics -> Asks.
Never bury bad news. Lead lowlights with what you're doing about it.`,
  },
  {
    title: "Code Review Copilot Skill",
    tagline: "Claude reviews PRs against your team's actual standards.",
    description:
      "Write your engineering standards once. Claude applies them to every diff: naming, error handling, test coverage, security smells. Comments are short, specific and ranked by severity.",
    category: "claude-skills",
    price: 5900,
    by: "orbit",
    rating: 4.9,
    reviews: 220,
    sales: 2010,
    tags: ["engineering", "code review", "dev"],
    date: "2026-10-02",
    accent: 178,
    featured: true,
    contents: [
      { title: "SKILL.md", detail: "Review workflow and severity scale" },
      { title: "standards.template.md", detail: "Your team rules in one file" },
      { title: "security-smells.md", detail: "25 patterns to always flag" },
    ],
    preview: `---
name: code-review-copilot
description: Use when reviewing a diff or pull request.
---

Rank findings: blocker, should fix, nit.
Max 1 sentence per finding plus a code suggestion.
Skip nits if there are more than 3 blockers.`,
  },
  {
    title: "Meeting Notes to Action",
    tagline: "Raw transcripts in, owners and deadlines out.",
    description:
      "A Skill that turns messy meeting transcripts into decisions, action items with owners and dates, open questions and a follow up message ready for Slack or email.",
    category: "claude-skills",
    price: 1900,
    by: "sana",
    rating: 4.6,
    reviews: 403,
    sales: 4120,
    tags: ["productivity", "meetings", "ops"],
    date: "2026-05-20",
    accent: 330,
    contents: [
      { title: "SKILL.md", detail: "Extraction rules" },
      { title: "follow-up.template.md", detail: "Slack and email formats" },
    ],
    preview: `---
name: meeting-to-action
description: Use when the user shares a meeting transcript or notes.
---

Output sections: Decisions, Action items (owner, due), Open questions, Follow up message.`,
  },
  {
    title: "Research Brief Builder",
    tagline: "Deep research briefs with sources, gaps and confidence.",
    description:
      "Teaches Claude a rigorous research workflow: scope, source triage, synthesis and an honest confidence rating for every claim. Great for analysts, PMs and journalists.",
    category: "claude-skills",
    price: 3400,
    by: "contextlabs",
    rating: 4.7,
    reviews: 77,
    sales: 640,
    tags: ["research", "analysis", "writing"],
    date: "2026-09-03",
    accent: 222,
    contents: [
      { title: "SKILL.md", detail: "Research loop" },
      { title: "confidence-scale.md", detail: "How to rate claims" },
      { title: "brief.template.md", detail: "One page brief layout" },
    ],
    preview: `---
name: research-brief
description: Use when the user asks for research, a market scan or a literature review.
---

Every claim gets a source and a confidence: high, medium, low.
End with "What we still don't know".`,
  },

  // GPTs
  {
    title: "Pitch Deck Critic GPT",
    tagline: "A brutally honest VC that reviews your deck slide by slide.",
    description:
      "A custom GPT trained on hundreds of real pitch reviews. Upload your deck and get slide by slide feedback, a fundability score and the 5 questions a partner will ask you.",
    category: "gpts",
    price: 2400,
    by: "kai",
    rating: 4.8,
    reviews: 265,
    sales: 3020,
    tags: ["startup", "fundraising", "feedback"],
    date: "2026-08-22",
    accent: 152,
    featured: true,
    contents: [
      { title: "System prompt", detail: "Full instructions you can paste into a GPT" },
      { title: "Knowledge files", detail: "Rubric + 30 annotated decks" },
      { title: "Setup guide", detail: "Publish it in 4 minutes" },
    ],
    preview: `You are a seed stage partner reviewing a pitch deck.
For each slide: what works, what's missing, one fix.
Then give a fundability score out of 10 and the 5 hardest questions you'd ask.
Be direct. Never pad feedback with compliments.`,
  },
  {
    title: "Cold Email Closer GPT",
    tagline: "Writes cold emails that get replies, not unsubscribes.",
    description:
      "Give it a prospect and an offer. It researches the angle, writes 3 variants under 90 words and a 4 step follow up sequence. Includes a deliverability checklist.",
    category: "gpts",
    price: 1900,
    by: "promptsmith",
    rating: 4.6,
    reviews: 512,
    sales: 5230,
    tags: ["sales", "email", "outreach"],
    date: "2026-04-12",
    accent: 32,
    contents: [
      { title: "System prompt", detail: "Tone, length and structure rules" },
      { title: "Knowledge files", detail: "120 high reply emails" },
      { title: "Sequence builder", detail: "Follow up timing guide" },
    ],
    preview: `Write 3 cold email variants under 90 words.
Line 1 must be about them, not us.
One clear ask. No links in email 1.`,
  },
  {
    title: "Thesis Tutor GPT",
    tagline: "A patient academic advisor for your dissertation.",
    description:
      "Helps students structure arguments, find gaps in literature reviews and tighten academic writing without writing it for them. Socratic by design.",
    category: "gpts",
    price: 1500,
    by: "halcyon",
    rating: 4.7,
    reviews: 158,
    sales: 1440,
    tags: ["education", "writing", "academic"],
    date: "2026-03-08",
    accent: 48,
    contents: [
      { title: "System prompt", detail: "Socratic tutoring rules" },
      { title: "Knowledge files", detail: "Argument mapping guide" },
    ],
    preview: `Never write the student's thesis for them.
Ask one question at a time that moves their argument forward.
When they share a paragraph, point out the single weakest claim.`,
  },
  {
    title: "Recipe Remix GPT",
    tagline: "Fridge photo in, three dinners out.",
    description:
      "Snap a photo of your fridge or list ingredients. Get three recipes ranked by effort, with swaps for allergies and a shopping list for anything missing.",
    category: "gpts",
    price: 900,
    by: "jules",
    rating: 4.5,
    reviews: 690,
    sales: 7810,
    tags: ["lifestyle", "food", "vision"],
    date: "2026-02-17",
    accent: 20,
    contents: [
      { title: "System prompt", detail: "Recipe format and safety rules" },
      { title: "Swap table", detail: "Allergy and diet substitutions" },
    ],
    preview: `From the ingredients shown, suggest 3 recipes: 15 min, 30 min, weekend project.
Flag any allergens. Offer one swap per recipe.`,
  },
  {
    title: "Landing Page Roaster GPT",
    tagline: "Paste a URL, get a conversion teardown.",
    description:
      "Analyses your landing page like a CRO consultant: headline clarity, proof, friction and the CTA. Returns a prioritized fix list and rewritten hero copy.",
    category: "gpts",
    price: 2900,
    by: "kai",
    rating: 4.8,
    reviews: 204,
    sales: 1990,
    tags: ["marketing", "cro", "copywriting"],
    date: "2026-09-15",
    accent: 140,
    contents: [
      { title: "System prompt", detail: "CRO audit framework" },
      { title: "Knowledge files", detail: "50 before and after heroes" },
      { title: "Scoring sheet", detail: "12 point conversion checklist" },
    ],
    preview: `Score the page on clarity, proof, friction, CTA (0 to 5 each).
List the top 5 fixes by expected impact.
Rewrite the hero headline and subhead in 3 styles.`,
  },
  {
    title: "Interview Coach GPT",
    tagline: "Mock interviews with real time feedback for any role.",
    description:
      "Runs behavioural and technical mock interviews tailored to the job description you paste. Scores your answers with STAR and suggests sharper versions.",
    category: "gpts",
    price: 1900,
    by: "sana",
    rating: 4.9,
    reviews: 377,
    sales: 3650,
    tags: ["career", "interview", "coaching"],
    date: "2026-07-01",
    accent: 320,
    contents: [
      { title: "System prompt", detail: "Interviewer persona and scoring" },
      { title: "Question bank", detail: "400 questions across 20 roles" },
    ],
    preview: `Act as the hiring manager for the pasted job description.
Ask one question at a time. After each answer, score it with STAR (1 to 5 each) and show a stronger version.`,
  },

  {
    title: "Legal Plain English GPT",
    tagline: "Explains any legal document like a friend who's a lawyer.",
    description:
      "Paste a lease, terms of service or employment contract. Get a plain English summary, the 5 clauses that matter most to you and questions to ask before signing. Not legal advice, but a great first read.",
    category: "gpts",
    price: 1400,
    by: "mira",
    rating: 4.7,
    reviews: 219,
    sales: 2160,
    tags: ["legal", "plain english", "consumer"],
    date: "2026-09-06",
    accent: 274,
    contents: [
      { title: "System prompt", detail: "Plain language rules and disclaimers" },
      { title: "Clause glossary", detail: "120 common clauses explained" },
    ],
    preview: `Summarize the document in 5 sentences a 15 year old would understand.
Then list the 5 clauses that most affect the reader, each with "what it means for you".
Always end with: questions to ask before signing.`,
  },

  // Prompt packs
  {
    title: "Product Manager Prompt Stack",
    tagline: "PRDs, user interviews and roadmaps in half the time.",
    description:
      "85 prompts for PMs covering discovery, interview synthesis, PRDs, prioritization frameworks, launch plans and stakeholder updates.",
    category: "prompt-packs",
    price: 3400,
    by: "theo",
    rating: 4.8,
    reviews: 174,
    sales: 1590,
    tags: ["product", "pm", "strategy"],
    date: "2026-10-05",
    accent: 190,
    contents: [
      { title: "Discovery", detail: "20 prompts" },
      { title: "PRDs", detail: "15 prompts" },
      { title: "Prioritization", detail: "18 prompts" },
      { title: "Launch and comms", detail: "32 prompts" },
    ],
    preview: `Here are {{n}} interview transcripts.
Cluster pains into themes. For each theme: frequency, severity (1 to 5), 2 verbatim quotes, and the job the user is trying to get done.`,
  },
  {
    title: "The Founder's Prompt Vault",
    tagline: "120 prompts for strategy, hiring, fundraising and ops.",
    description:
      "Every prompt a solo founder needs, organized by job to be done. Each one has variables, an example output and notes on which model handles it best.",
    category: "prompt-packs",
    price: 3900,
    by: "promptsmith",
    rating: 4.8,
    reviews: 621,
    sales: 6120,
    tags: ["startup", "strategy", "ops"],
    date: "2026-06-30",
    accent: 36,
    featured: true,
    contents: [
      { title: "Strategy", detail: "24 prompts" },
      { title: "Hiring", detail: "18 prompts" },
      { title: "Fundraising", detail: "22 prompts" },
      { title: "Ops and finance", detail: "31 prompts" },
      { title: "Marketing", detail: "25 prompts" },
    ],
    preview: `# Pre mortem
You are a skeptical board member. It's 12 months from now and {{project}} failed.
Write the 5 most likely reasons, ranked by probability, and one early warning signal for each.`,
  },
  {
    title: "Midjourney to Claude Image Briefs",
    tagline: "Art direction prompts that work across every image model.",
    description:
      "60 structured image brief prompts for product shots, editorial, brand worlds and UI mockups. Model agnostic with notes for each major image generator.",
    category: "prompt-packs",
    price: 2400,
    by: "jules",
    rating: 4.6,
    reviews: 143,
    sales: 1320,
    tags: ["design", "images", "creative"],
    date: "2026-05-02",
    accent: 0,
    contents: [
      { title: "Product shots", detail: "15 prompts" },
      { title: "Editorial", detail: "15 prompts" },
      { title: "Brand worlds", detail: "15 prompts" },
      { title: "UI mockups", detail: "15 prompts" },
    ],
    preview: `Subject: {{product}} on a {{surface}}
Light: single soft key from top left, deep falloff
Lens: 85mm, f/2.8, eye level
Mood: quiet luxury, muted palette, one accent color {{accent}}`,
  },
  {
    title: "Support Macro Prompt Pack",
    tagline: "Empathetic, on policy replies for 50 support scenarios.",
    description:
      "Refunds, outages, angry customers, feature requests. Prompts that produce replies that are kind, short and never promise what your policy can't keep.",
    category: "prompt-packs",
    price: 1900,
    by: "sana",
    rating: 4.7,
    reviews: 233,
    sales: 2280,
    tags: ["support", "cx", "writing"],
    date: "2026-03-26",
    accent: 340,
    contents: [
      { title: "Billing", detail: "12 prompts" },
      { title: "Bugs and outages", detail: "14 prompts" },
      { title: "Escalations", detail: "10 prompts" },
      { title: "Feature requests", detail: "14 prompts" },
    ],
    preview: `Customer message: {{message}}
Policy: {{policy}}
Reply in under 80 words. Acknowledge the feeling, state what you can do, give one next step. Never invent a timeline.`,
  },
  {
    title: "Data Analysis Prompt Kit",
    tagline: "From CSV to insight deck with 40 chained prompts.",
    description:
      "Chained prompts that clean data, profile it, find drivers and write an exec summary. Works with Claude, ChatGPT and any model with code execution.",
    category: "prompt-packs",
    price: 2900,
    by: "rafa",
    rating: 4.8,
    reviews: 118,
    sales: 990,
    tags: ["data", "analytics", "python"],
    date: "2026-08-05",
    accent: 280,
    contents: [
      { title: "Clean", detail: "8 prompts" },
      { title: "Profile", detail: "10 prompts" },
      { title: "Explain", detail: "12 prompts" },
      { title: "Present", detail: "10 prompts" },
    ],
    preview: `Profile this dataset. For each column: type, % null, distinct count, 3 example values, and one thing that looks wrong.
Do not clean anything yet. Just report.`,
  },
  {
    title: "YouTube Script Engine",
    tagline: "Hooks, retention beats and CTAs that keep viewers watching.",
    description:
      "70 prompts for creators: hook generators, retention beat outlines, title and thumbnail ideation, and repurposing into shorts and threads.",
    category: "prompt-packs",
    price: 2900,
    by: "promptsmith",
    rating: 4.7,
    reviews: 289,
    sales: 2710,
    tags: ["content", "youtube", "creator"],
    date: "2026-09-20",
    accent: 24,
    contents: [
      { title: "Hooks", detail: "20 prompts" },
      { title: "Outlines", detail: "18 prompts" },
      { title: "Titles and thumbnails", detail: "16 prompts" },
      { title: "Repurposing", detail: "16 prompts" },
    ],
    preview: `Topic: {{topic}}
Write 10 hooks under 12 words. Use 5 patterns: contrarian, stakes, curiosity gap, proof, story. Label each.`,
  },
  {
    title: "Learn Anything Prompt Set",
    tagline: "Turn any AI into a world class personal tutor.",
    description:
      "30 prompts that build curricula, run spaced repetition, quiz you Feynman style and adapt to what you get wrong. Free for a reason: we think everyone should learn this way.",
    category: "prompt-packs",
    price: 0,
    by: "halcyon",
    rating: 4.9,
    reviews: 1204,
    sales: 15400,
    tags: ["learning", "education", "free"],
    date: "2026-01-15",
    accent: 54,
    contents: [
      { title: "Curriculum builder", detail: "6 prompts" },
      { title: "Quiz and recall", detail: "12 prompts" },
      { title: "Explain it back", detail: "12 prompts" },
    ],
    preview: `I want to learn {{topic}} in {{weeks}} weeks with {{hours}} hours a week.
Build a curriculum with weekly goals, one project per week and a 5 question check at the end of each week.`,
  },

  // Courses
  {
    title: "Prompt Engineering Masterclass",
    tagline: "The complete course: zero to production grade prompts.",
    description:
      "28 lessons covering structure, examples, chain of thought, evals, tool use and prompt versioning. Every lesson ends with a hands on exercise and a model answer.",
    category: "courses",
    price: 14900,
    by: "theo",
    rating: 4.9,
    reviews: 2140,
    sales: 11800,
    tags: ["prompting", "course", "evals"],
    date: "2026-09-10",
    accent: 196,
    featured: true,
    contents: lessons([
      "Why prompts fail",
      "Anatomy of a great prompt",
      "Examples beat instructions",
      "Thinking step by step",
      "Structured outputs",
      "Writing your first eval",
      "Tool use basics",
      "Prompt versioning in teams",
    ]),
    preview: `Lesson 3: Examples beat instructions

You can write 400 words describing the tone you want, or you can show 3 examples.
In this lesson we'll measure the difference on a real task and learn how to pick examples that generalize.`,
  },
  {
    title: "AI for Busy Professionals",
    tagline: "Save 10 hours a week with AI. No code, no jargon.",
    description:
      "A practical course for managers, marketers and operators. Learn email triage, document drafting, research and meeting workflows you'll use the same day.",
    category: "courses",
    price: 7900,
    by: "sana",
    rating: 4.8,
    reviews: 1630,
    sales: 9420,
    tags: ["productivity", "course", "beginner"],
    date: "2026-07-18",
    accent: 326,
    featured: true,
    contents: lessons([
      "Picking the right AI for the job",
      "Your first 10 minute win",
      "Email triage on autopilot",
      "Drafting docs you'd actually send",
      "Research without hallucinations",
      "Meetings: before, during, after",
    ]),
    preview: `Lesson 2: Your first 10 minute win

Open your inbox. Pick the email you've been avoiding.
We're going to answer it together in under 10 minutes, and you'll see the exact prompt I use every day.`,
  },
  {
    title: "Building Claude Skills from Scratch",
    tagline: "Design, write and sell your own Claude Skills.",
    description:
      "Learn how Skills load, how to write triggers that fire at the right time, how to bundle scripts and references and how to test them. Ends with publishing your first Skill on Cryptic.",
    category: "courses",
    price: 9900,
    by: "mira",
    rating: 4.9,
    reviews: 488,
    sales: 3110,
    tags: ["claude", "skills", "course"],
    date: "2026-10-08",
    accent: 262,
    featured: true,
    contents: lessons([
      "What a Skill really is",
      "Descriptions that trigger correctly",
      "Progressive disclosure",
      "Bundling scripts and references",
      "Testing Skills with evals",
      "Packaging and selling",
    ]),
    preview: `Lesson 2: Descriptions that trigger correctly

The description is the only part Claude always sees. If it's vague, your Skill never loads.
We'll rewrite 5 real descriptions and test which ones fire.`,
  },
  {
    title: "Custom GPT Business Bootcamp",
    tagline: "Build GPTs people pay for, then market them.",
    description:
      "From idea validation to a GPT with actions, knowledge files and a landing page. Includes a growth module on getting your first 1,000 users.",
    category: "courses",
    price: 8900,
    by: "kai",
    rating: 4.6,
    reviews: 402,
    sales: 2650,
    tags: ["gpts", "business", "course"],
    date: "2026-05-28",
    accent: 156,
    contents: lessons([
      "Finding a GPT worth building",
      "Instructions that hold up",
      "Knowledge files that help",
      "Adding actions with an API",
      "Launch and distribution",
    ]),
    preview: `Lesson 1: Finding a GPT worth building

The best GPTs replace a task someone already pays for. We'll use a 3 question filter to score 20 ideas in 15 minutes.`,
  },
  {
    title: "AI Literacy for Teams",
    tagline: "Roll out AI safely across your whole company.",
    description:
      "A team ready course with policy templates, risk training, role based workflows and a manager toolkit. Licensed per seat for companies, this is the single learner edition.",
    category: "courses",
    price: 5900,
    by: "halcyon",
    rating: 4.7,
    reviews: 310,
    sales: 2030,
    tags: ["teams", "policy", "course"],
    date: "2026-04-09",
    accent: 44,
    contents: lessons([
      "How these models actually work",
      "What not to paste into AI",
      "Checking AI output",
      "Role based workflows",
      "Writing your AI policy",
    ]),
    preview: `Lesson 2: What not to paste into AI

A simple traffic light system your whole team can remember: green, yellow, red data and what to do with each.`,
  },
  {
    title: "Evals for Humans",
    tagline: "Measure prompt quality without a PhD.",
    description:
      "Learn to build test sets, write graders, use LLM as judge responsibly and track regressions. Practical, spreadsheet first and then code.",
    category: "courses",
    price: 6900,
    by: "theo",
    rating: 4.8,
    reviews: 276,
    sales: 1780,
    tags: ["evals", "testing", "course"],
    date: "2026-08-27",
    accent: 204,
    contents: lessons([
      "Why vibes aren't enough",
      "Building a golden set",
      "Graders: code, model, human",
      "LLM as judge pitfalls",
      "Regression tracking",
    ]),
    preview: `Lesson 1: Why vibes aren't enough

You changed one line in a prompt and it "feels better". Here's how to prove it in 20 minutes with 30 test cases.`,
  },
  {
    title: "Writing with AI, Without Sounding Like AI",
    tagline: "Keep your voice. Lose the em dash soup.",
    description:
      "For writers, marketers and founders. Learn to use AI for research, structure and editing while keeping your writing unmistakably human.",
    category: "courses",
    price: 4900,
    by: "jules",
    rating: 4.7,
    reviews: 351,
    sales: 2470,
    tags: ["writing", "voice", "course"],
    date: "2026-06-19",
    accent: 8,
    contents: lessons([
      "The tells of AI writing",
      "AI as researcher, not ghostwriter",
      "Outlines you can argue with",
      "Editing passes that keep voice",
    ]),
    preview: `Lesson 1: The tells of AI writing

Rule of three lists. "It's not just X, it's Y." Tidy summaries at the end of every paragraph. Let's learn to spot them so you can cut them.`,
  },

  // Context engineering
  {
    title: "Context Engineering Field Guide",
    tagline: "The playbook for feeding models the right information.",
    description:
      "A deep, practical guide to context windows, retrieval, summarization, memory and tool results. With diagrams, budgets and a checklist you'll keep open on a second monitor.",
    category: "context-engineering",
    price: 4900,
    by: "contextlabs",
    rating: 4.9,
    reviews: 532,
    sales: 4310,
    tags: ["context", "rag", "memory"],
    date: "2026-09-24",
    accent: 222,
    featured: true,
    contents: [
      { title: "Context budgets", detail: "How to spend tokens on purpose" },
      { title: "Retrieval patterns", detail: "Hybrid search, reranking, chunking" },
      { title: "Compaction", detail: "Summaries that don't lose the plot" },
      { title: "Memory", detail: "What to store, when to forget" },
      { title: "Checklist", detail: "40 point context review" },
    ],
    preview: `Rule 1: Every token in context should earn its place.

Before adding a document, ask: if the model never saw this, what would it get wrong?
If you can't answer, leave it out.`,
  },
  {
    title: "RAG That Actually Works",
    tagline: "Video course on retrieval that survives real users.",
    description:
      "Chunking strategies, embeddings, hybrid search, reranking and evaluation, built step by step on a real document set. Includes starter code.",
    category: "context-engineering",
    price: 11900,
    by: "contextlabs",
    rating: 4.8,
    reviews: 389,
    sales: 2290,
    tags: ["rag", "retrieval", "course"],
    date: "2026-07-07",
    accent: 230,
    contents: lessons([
      "Why naive RAG fails",
      "Chunking with structure",
      "Hybrid search",
      "Reranking",
      "Evaluating retrieval",
      "Shipping it",
    ], 14),
    preview: `Lesson 1: Why naive RAG fails

Top 5 chunks by cosine similarity sounds fine until a user asks "what changed in v2?". We'll break it on purpose, then fix it.`,
  },
  {
    title: "Long Context Prompt Templates",
    tagline: "Templates for 100k+ token documents that stay accurate.",
    description:
      "Templates for working with huge contexts: document tagging, quote first answering, map reduce summaries and citation forcing. Tested on contracts, codebases and transcripts.",
    category: "context-engineering",
    price: 2400,
    by: "theo",
    rating: 4.7,
    reviews: 167,
    sales: 1350,
    tags: ["long context", "templates", "prompting"],
    date: "2026-05-14",
    accent: 210,
    contents: [
      { title: "Document tagging", detail: "XML wrappers that help recall" },
      { title: "Quote first", detail: "Extract evidence, then answer" },
      { title: "Map reduce", detail: "Summaries for 500 page docs" },
    ],
    preview: `<documents>
  <document index="1"><source>{{name}}</source><content>{{text}}</content></document>
</documents>

First, quote the passages relevant to the question inside <quotes>. Then answer using only those quotes.`,
  },
  {
    title: "Agent Memory Architecture Kit",
    tagline: "Blueprints for agents that remember the right things.",
    description:
      "Reference designs for short term, episodic and semantic memory, plus schemas, decay rules and retrieval prompts. Framework agnostic.",
    category: "context-engineering",
    price: 6900,
    by: "orbit",
    rating: 4.6,
    reviews: 92,
    sales: 760,
    tags: ["agents", "memory", "architecture"],
    date: "2026-10-12",
    accent: 186,
    contents: [
      { title: "Architecture diagrams", detail: "4 reference designs" },
      { title: "Schemas", detail: "JSON schemas for memory records" },
      { title: "Prompts", detail: "Write, recall and forget prompts" },
    ],
    preview: `Memory write rule: only store facts that will change a future decision.
Every record gets: subject, fact, source, confidence, expires_at.`,
  },
  {
    title: "System Prompt Architecture",
    tagline: "How to structure system prompts for big products.",
    description:
      "A short, dense ebook on layering system prompts: identity, policies, tools, formatting and dynamic context. With real (anonymized) production examples.",
    category: "context-engineering",
    price: 1900,
    by: "theo",
    rating: 4.8,
    reviews: 214,
    sales: 1880,
    tags: ["system prompts", "product", "ebook"],
    date: "2026-03-30",
    accent: 200,
    contents: [
      { title: "Layering", detail: "5 layers every system prompt needs" },
      { title: "Conflicts", detail: "When instructions fight each other" },
      { title: "Case studies", detail: "4 production prompts dissected" },
    ],
    preview: `Layer 1: Who the assistant is and who it serves.
Layer 2: Hard rules (short, few, absolute).
Layer 3: Tools and when to use them.
Layer 4: Output format.
Layer 5: Dynamic context, always last.`,
  },
  {
    title: "Context Window Calculator Sheet",
    tagline: "Plan token budgets before you blow them.",
    description:
      "A spreadsheet plus guide for estimating tokens across system prompt, tools, retrieved docs and history. Includes cost projection per 1,000 conversations.",
    category: "context-engineering",
    price: 900,
    by: "rafa",
    rating: 4.5,
    reviews: 61,
    sales: 540,
    tags: ["tokens", "cost", "planning"],
    date: "2026-02-03",
    accent: 300,
    contents: [
      { title: "Budget sheet", detail: "Plug in your numbers" },
      { title: "Cost model", detail: "Per conversation and monthly" },
    ],
    preview: `System prompt: 2,100 tokens
Tool definitions: 3,400 tokens
Retrieved docs (5 x 800): 4,000 tokens
History (avg): 6,500 tokens
Headroom for output: 4,000 tokens`,
  },

  // Agents and MCP
  {
    title: "MCP Server Starter Pack",
    tagline: "Ship your first MCP server today, in TypeScript or Python.",
    description:
      "Production ready templates for MCP servers with tools, resources, auth, logging and tests. Connect any API to Claude in an afternoon.",
    category: "agents-mcp",
    price: 4900,
    by: "orbit",
    rating: 4.9,
    reviews: 341,
    sales: 3270,
    tags: ["mcp", "typescript", "python"],
    date: "2026-09-30",
    accent: 172,
    featured: true,
    contents: [
      { title: "TypeScript template", detail: "Tools, resources, tests" },
      { title: "Python template", detail: "Same features, idiomatic Python" },
      { title: "Auth guide", detail: "OAuth and API key patterns" },
      { title: "Tool design guide", detail: "Names and schemas models understand" },
    ],
    preview: `server.tool(
  "search_tickets",
  "Search support tickets by text, status or customer. Returns at most 20.",
  { query: z.string(), status: z.enum(["open", "closed"]).optional() },
  async ({ query, status }) => { /* ... */ }
);`,
  },
  {
    title: "Autonomous Research Agent Blueprint",
    tagline: "An agent that plans, searches, reads and writes reports.",
    description:
      "A full blueprint with planner, researcher and writer roles, tool definitions, stop conditions and an eval set so you know it's actually good.",
    category: "agents-mcp",
    price: 7900,
    by: "contextlabs",
    rating: 4.7,
    reviews: 128,
    sales: 980,
    tags: ["agents", "research", "blueprint"],
    date: "2026-08-18",
    accent: 214,
    contents: [
      { title: "Architecture", detail: "Roles, loop and handoffs" },
      { title: "Tool specs", detail: "Search, fetch, note, write" },
      { title: "Stop conditions", detail: "When to stop researching" },
      { title: "Eval set", detail: "25 research questions with rubrics" },
    ],
    preview: `Loop:
1. Plan: list open questions.
2. Research: pick the question with highest value / cost.
3. Note: store findings with sources.
4. Stop when every question has 2+ independent sources or budget is spent.`,
  },
  {
    title: "Customer Support Agent Kit",
    tagline: "A support agent that resolves tickets and knows when to hand off.",
    description:
      "Prompts, tool schemas and escalation logic for an AI support agent. Includes refund guardrails, tone controls and a human handoff protocol.",
    category: "agents-mcp",
    price: 5900,
    by: "orbit",
    rating: 4.6,
    reviews: 97,
    sales: 820,
    tags: ["agents", "support", "cx"],
    date: "2026-06-06",
    accent: 168,
    contents: [
      { title: "Agent prompt", detail: "Persona, policies, tools" },
      { title: "Tool schemas", detail: "Orders, refunds, KB search" },
      { title: "Escalation rules", detail: "When a human takes over" },
    ],
    preview: `Escalate to a human when: the customer asks twice, a refund is over {{limit}}, legal words appear, or you're less than 80% sure.`,
  },
  {
    title: "Claude Code Workflow Pack",
    tagline: "CLAUDE.md files, hooks and slash commands for real teams.",
    description:
      "A curated set of CLAUDE.md templates, custom slash commands, hooks and subagent definitions for web, data and infra teams. Drop in and go.",
    category: "agents-mcp",
    price: 3900,
    by: "rafa",
    rating: 4.8,
    reviews: 186,
    sales: 1660,
    tags: ["claude code", "dev", "workflow"],
    date: "2026-10-15",
    accent: 296,
    featured: true,
    contents: [
      { title: "CLAUDE.md templates", detail: "Web, data, infra, monorepo" },
      { title: "Slash commands", detail: "12 commands" },
      { title: "Hooks", detail: "Lint, test and format on save" },
      { title: "Subagents", detail: "Reviewer, tester, doc writer" },
    ],
    preview: `# CLAUDE.md
## Commands
- npm test: run unit tests (fast, run often)
- npm run e2e: slow, only before pushing
## Rules
- Never edit generated files in /gen
- Prefer small PRs, one concern each`,
  },
  {
    title: "Browser Agent Recipes",
    tagline: "Reliable web automation with computer use agents.",
    description:
      "Recipes for form filling, data extraction, QA testing and monitoring with browser agents. Each recipe includes guardrails and a failure recovery plan.",
    category: "agents-mcp",
    price: 2900,
    by: "kai",
    rating: 4.5,
    reviews: 74,
    sales: 590,
    tags: ["agents", "browser", "automation"],
    date: "2026-04-25",
    accent: 160,
    contents: [
      { title: "Extraction", detail: "5 recipes" },
      { title: "Forms", detail: "4 recipes" },
      { title: "QA testing", detail: "6 recipes" },
    ],
    preview: `Before clicking anything that submits, spends money or sends a message: stop and ask the user to confirm.
After every action, take a screenshot and verify the page changed as expected.`,
  },
  {
    title: "Multi Agent Orchestration Course",
    tagline: "Design agent teams that don't trip over each other.",
    description:
      "Orchestrator patterns, handoffs, shared state, cost control and debugging traces. A course for engineers building serious agent systems.",
    category: "agents-mcp",
    price: 12900,
    by: "orbit",
    rating: 4.8,
    reviews: 211,
    sales: 1240,
    tags: ["agents", "orchestration", "course"],
    date: "2026-10-18",
    accent: 182,
    contents: lessons([
      "When not to use multiple agents",
      "Orchestrator and worker",
      "Handoffs and shared state",
      "Cost and latency control",
      "Reading agent traces",
      "Evaluating agent teams",
    ], 16),
    preview: `Lesson 1: When not to use multiple agents

Most "multi agent" systems should be one agent with better tools. Here's a 4 question test before you add a second agent.`,
  },
];

export const PRODUCTS: Product[] = SEEDS.map((s, i) => ({
  id: `p${String(i + 1).padStart(3, "0")}`,
  slug: slugify(s.title),
  title: s.title,
  tagline: s.tagline,
  description: s.description,
  category: s.category,
  priceCents: s.price,
  creatorHandle: s.by,
  rating: s.rating,
  reviewCount: s.reviews,
  sales: s.sales,
  tags: s.tags,
  createdAt: s.date,
  featured: s.featured,
  accent: s.accent,
  contents: s.contents,
  preview: s.preview,
}));
