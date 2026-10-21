import Link from "next/link";
import { CATEGORIES, CREATORS, PRODUCTS, getCreator, productsByCreator } from "@/lib/catalog";
import { formatCount } from "@/lib/format";
import { Avatar, Container, Eyebrow, Pill, SectionHeading, Stars, Verified } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { ArrowRight, SearchIcon, SparkIcon } from "@/components/ui/icons";
import { ProductCard } from "@/components/ui/product-card";

const featured = PRODUCTS.filter((p) => p.featured).slice(0, 8);
const hero = PRODUCTS.find((p) => p.slug === "contract-redliner-skill")!;
const heroCourse = PRODUCTS.find((p) => p.slug === "prompt-engineering-masterclass")!;
const topCreators = [...CREATORS].sort((a, b) => b.followers - a.followers).slice(0, 6);
const totalSales = PRODUCTS.reduce((s, p) => s + p.sales, 0);

const TESTIMONIALS = [
  { quote: "I bought the Contract Redliner on a Tuesday. By Friday our legal queue was half the size. Best $79 we spent all year.", name: "Priya N.", role: "Head of Ops, Series B fintech", hue: 280 },
  { quote: "The Prompt Engineering Masterclass is the first course that taught me to measure prompts instead of guessing. Worth 10x the price.", name: "Marcus L.", role: "Staff engineer", hue: 200 },
  { quote: "I sold my first Claude Skill here and made more in a month than my freelance retainer. The creator studio is so clean.", name: "Elena R.", role: "Independent creator", hue: 20 },
];

const FAQ = [
  ["What's a Claude Skill?", "A Skill is a folder with a SKILL.md file plus optional scripts and references. Claude loads it only when a task needs it, so it can carry deep expertise without cluttering every conversation. You add it to Claude in a couple of clicks."],
  ["Do GPTs and prompt packs work with other models?", "Yes. GPT listings include the full system prompt and knowledge files, so you can use them as a custom GPT, a Claude Project, or with any model you like. Prompt packs are model agnostic."],
  ["How do I get what I bought?", "Everything you buy lands in your Library instantly. Download files, copy prompts, or watch course lessons right in the browser. Updates from the creator are free forever."],
  ["Can I sell my own stuff?", "Yep. Open the Creator studio, make a listing in about two minutes and it shows up in the marketplace. Creators keep 90% of every sale."],
  ["Is this real money?", "Not yet. Cryptic is running as a demo storefront: checkout uses the test card 4242 4242 4242 4242 and no money moves."],
];

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* ambient light */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="animate-drift absolute -top-40 left-1/2 h-[640px] w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(143,132,255,0.28),transparent)] blur-2xl" />
        <div className="animate-drift absolute top-20 right-[-10%] h-[420px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(230,199,143,0.18),transparent)] blur-2xl [animation-delay:-6s]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
          }}
        />
      </div>

      <Container className="grid items-center gap-16 pb-24 pt-16 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:pb-32">
        <div>
          <Link href="/explore?category=claude-skills" className="rise press inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] py-1 pl-1 pr-3 text-sm text-muted hover:border-line-strong hover:text-fg">
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">New</span>
            Claude Skills just landed
            <ArrowRight width={14} height={14} />
          </Link>

          <h1 className="rise mt-7 text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.045em] [animation-delay:60ms] sm:text-7xl">
            <span className="text-gradient">The marketplace</span>
            <br />
            <span className="text-gradient">for </span>
            <span className="text-gold font-display font-normal italic tracking-[-0.02em]">AI craft.</span>
          </h1>

          <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-muted [animation-delay:120ms]">
            Claude Skills, custom GPTs, prompt packs and courses on prompting and context engineering. Made by people who ship with AI every single day.
          </p>

          <form action="/explore" className="rise mt-9 flex max-w-xl items-center gap-2 rounded-full border border-line-strong bg-white/[0.04] p-1.5 pl-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur [animation-delay:180ms] focus-within:border-gold/40">
            <SearchIcon className="shrink-0 text-faint" />
            <label htmlFor="hero-q" className="sr-only">
              Search the marketplace
            </label>
            <input id="hero-q" name="q" placeholder="Try “contract review” or “RAG”" className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-faint" />
            <button className="press h-11 shrink-0 rounded-full bg-fg px-5 text-sm font-medium text-ink hover:bg-white">Search</button>
          </form>

          <div className="rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-faint [animation-delay:240ms]">
            <span className="flex -space-x-2">
              {topCreators.slice(0, 5).map((c) => (
                <Avatar key={c.handle} name={c.name} hue={c.avatarHue} size={28} className="ring-2 ring-ink" />
              ))}
            </span>
            <span>
              <span className="text-fg">{formatCount(totalSales)}+</span> purchases from <span className="text-fg">{CREATORS.length * 120}+</span> creators
            </span>
          </div>
        </div>

        <HeroVisual />
      </Container>
    </section>
  );
}

function HeroVisual() {
  const creator = getCreator(hero.creatorHandle)!;
  return (
    <div className="rise relative mx-auto mb-16 w-full max-w-[520px] [animation-delay:200ms] lg:mb-0" aria-hidden>
      <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-b from-white/[0.06] to-transparent blur-2xl" />
      <div className="card relative overflow-hidden rounded-[26px] p-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 font-mono text-[11px] text-faint">contract-redliner/SKILL.md</span>
        </div>
        <pre className="overflow-hidden rounded-[18px] bg-black/50 p-5 font-mono text-[12.5px] leading-relaxed text-muted ring-1 ring-inset ring-white/5">
          <code>
            <span className="text-faint">---</span>
            {"\n"}
            <span className="text-iris">name</span>: contract-redliner{"\n"}
            <span className="text-iris">description</span>: Use when the user{"\n"}  shares a contract and wants review.{"\n"}
            <span className="text-faint">---</span>
            {"\n\n"}
            <span className="text-gold"># Contract Redliner</span>
            {"\n\n"}1. Identify contract type and law.{"\n"}2. Compare each clause to the playbook.{"\n"}3. Output risk, redline, fallback.{"\n"}
            <span className="text-ok">✓ loaded in 0.4s</span>
          </code>
        </pre>
      </div>

      <div className="card absolute -bottom-20 -left-4 w-[250px] rotate-[-4deg] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:-left-12">
        <Cover product={hero} className="aspect-[16/9] rounded-[14px]" />
        <div className="px-2.5 pb-2 pt-3">
          <p className="text-sm font-medium">{hero.title}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1.5">
              {creator.name} <Verified />
            </span>
            <Stars rating={hero.rating} />
          </div>
        </div>
      </div>

      <div className="card absolute -right-6 -top-14 hidden w-[200px] rotate-[5deg] p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Course · 28 lessons</p>
        <p className="mt-2 text-sm font-medium leading-snug">{heroCourse.title}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-gold-deep to-gold" />
        </div>
        <p className="mt-2 text-xs text-muted">64% complete</p>
      </div>
    </div>
  );
}

function Marquee() {
  const words = ["Claude Skills", "Custom GPTs", "Prompt Packs", "Context Engineering", "MCP Servers", "Agent Blueprints", "Prompting Courses", "Evals", "RAG", "Claude Code"];
  const row = [...words, ...words];
  return (
    <div className="relative overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]" aria-hidden>
      <div className="animate-marquee flex w-max gap-12">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap font-display text-2xl italic text-faint">
            {w}
            <span className="text-gold/50">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Categories() {
  return (
    <Container className="pt-28">
      <SectionHeading eyebrow="Browse" title="Everything you need to work with AI." sub="Six aisles, all curated. Every listing is reviewed before it goes live." />
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c, i) => {
          const count = PRODUCTS.filter((p) => p.category === c.id).length;
          return (
            <Link key={c.id} href={`/explore?category=${c.id}`} className="card lift group relative overflow-hidden p-6">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
                style={{ background: `hsl(${[268, 152, 32, 196, 222, 178][i]} 70% 55%)` }}
              />
              <div className="flex items-start justify-between">
                <span className="font-display text-4xl leading-none text-fg/90">{c.glyph}</span>
                <span className="font-mono text-xs text-faint">{String(count).padStart(2, "0")} items</span>
              </div>
              <h3 className="mt-10 text-lg font-medium tracking-[-0.01em]">{c.name}</h3>
              <p className="mt-1.5 text-sm text-muted">{c.blurb}</p>
              <ArrowRight className="absolute bottom-6 right-6 text-faint transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-gold" />
            </Link>
          );
        })}
      </div>
    </Container>
  );
}

function Featured() {
  return (
    <Container className="pt-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow="Featured drops" title="Hand picked this week." sub="The listings our curators keep coming back to." />
        <ButtonLink href="/explore?sort=trending" variant="outline" size="md">
          View all <ArrowRight width={16} height={16} />
        </ButtonLink>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
    </Container>
  );
}

function HowItWorks() {
  const steps = [
    ["01", "Find the right tool", "Search by job, not jargon. Every listing shows exactly what's inside before you pay."],
    ["02", "Buy once, own forever", "Checkout in seconds. Your purchase lands in your Library with every future update included."],
    ["03", "Put it to work", "Drop a Skill into Claude, publish a GPT, or start a lesson. Most people get value the same day."],
  ];
  return (
    <Container className="pt-32">
      <div className="card relative overflow-hidden p-8 sm:p-14">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-iris/20 blur-3xl" aria-hidden />
        <SectionHeading eyebrow="How it works" title="From browsing to shipping in an afternoon." />
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="relative">
              <span className="font-mono text-sm text-gold">{n}</span>
              <div className="mt-4 h-px bg-gradient-to-r from-line-strong to-transparent" />
              <h3 className="mt-6 text-lg font-medium">{t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

function Creators() {
  return (
    <Container className="pt-32">
      <SectionHeading eyebrow="Top creators" title="Learn from people at the frontier." />
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topCreators.map((c) => (
          <Link key={c.handle} href={`/creators/${c.handle}`} className="card lift flex items-center gap-4 p-5">
            <Avatar name={c.name} hue={c.avatarHue} size={52} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="truncate">{c.name}</span>
                {c.verified && <Verified />}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted">{c.bio}</p>
              <p className="mt-1.5 text-xs text-faint">
                {formatCount(c.followers)} followers · {productsByCreator(c.handle).length} listings
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}

function Stats() {
  const stats = [
    [`${formatCount(totalSales)}+`, "Purchases"],
    ["$2.4M", "Paid to creators"],
    ["4.8", "Average rating"],
    ["90%", "Creator revenue share"],
  ];
  return (
    <Container className="pt-32">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
        {stats.map(([v, l]) => (
          <div key={l} className="bg-ink px-6 py-10 text-center">
            <p className="text-gold font-display text-5xl tracking-[-0.02em]">{v}</p>
            <p className="mt-2 text-sm text-muted">{l}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}

function Testimonials() {
  return (
    <Container className="pt-32">
      <SectionHeading eyebrow="Loved by builders" title="Small purchases. Big unlocks." />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="card flex flex-col p-7">
            <span className="font-display text-5xl leading-none text-gold/60">“</span>
            <blockquote className="mt-2 flex-1 text-[16px] leading-relaxed text-fg/90">{t.quote}</blockquote>
            <figcaption className="mt-8 flex items-center gap-3">
              <Avatar name={t.name} hue={t.hue} size={36} />
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-faint">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Container>
  );
}

function SellCta() {
  return (
    <Container className="pt-32">
      <div className="relative isolate overflow-hidden rounded-[32px] border border-gold/20 px-6 py-16 text-center sm:px-16 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_120%_at_50%_0%,rgba(230,199,143,0.22),transparent_60%),linear-gradient(180deg,#0f0d09,#060608)]" aria-hidden />
        <Pill className="border-gold/25 text-gold">
          <SparkIcon width={14} height={14} /> For creators
        </Pill>
        <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
          <span className="text-gradient">Turn what you know into </span>
          <span className="text-gold font-display font-normal italic">income.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">List a Skill, GPT, prompt pack or course in two minutes. Keep 90% of every sale. Get paid weekly.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/dashboard/creator/new" size="lg">
            Start selling <ArrowRight width={16} height={16} />
          </ButtonLink>
          <ButtonLink href="/sell" variant="outline" size="lg">
            How it works
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}

function Faq() {
  return (
    <Container className="grid gap-12 pt-32 lg:grid-cols-[1fr_1.4fr]">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." sub="Anything else? Our support team replies in under a day." />
      <div className="divide-y divide-line border-y border-line">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-faint transition-transform duration-200 ease-[var(--ease-out)] group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 pr-12 text-[15px] leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </Container>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Categories />
      <Featured />
      <HowItWorks />
      <Creators />
      <Stats />
      <Testimonials />
      <SellCta />
      <Faq />
      <Eyebrow className="sr-only">End of page</Eyebrow>
    </>
  );
}
