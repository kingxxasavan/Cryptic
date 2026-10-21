import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/catalog";
import { Container, Eyebrow, Pill, SectionHeading } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight, CheckIcon, SparkIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Sell on Cryptic", description: "Sell Claude Skills, GPTs, prompt packs and AI courses. Keep 90% of every sale." };

const PERKS = [
  ["Keep 90%", "The best split in AI marketplaces. No listing fees, no monthly plan."],
  ["Weekly payouts", "Money lands in your account every Monday once you connect payments."],
  ["Built in delivery", "Files, prompts and course lessons are delivered to buyers automatically."],
  ["Reviews and trust", "Verified badges, real reviews and refunds handled for you."],
  ["Analytics", "See views, conversion and revenue for every listing in your studio."],
  ["Free updates", "Push a new version and every buyer gets it, no extra work."],
];

export default function SellPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(230,199,143,0.16),transparent_70%)]" aria-hidden />
        <Container className="pb-20 pt-24 text-center">
          <Pill className="rise border-gold/25 text-gold">
            <SparkIcon width={14} height={14} /> For creators
          </Pill>
          <h1 className="rise mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] [animation-delay:60ms] sm:text-7xl">
            <span className="text-gradient">Your AI know how is </span>
            <span className="text-gold font-display font-normal italic">worth paying for.</span>
          </h1>
          <p className="rise mx-auto mt-6 max-w-2xl text-lg text-muted [animation-delay:120ms]">
            Package the Skills, prompts and workflows you already use into products. We handle checkout, delivery and the boring bits.
          </p>
          <div className="rise mt-10 flex flex-wrap justify-center gap-3 [animation-delay:180ms]">
            <ButtonLink href="/dashboard/creator/new" size="lg">
              Create your first listing <ArrowRight width={16} height={16} />
            </ButtonLink>
            <ButtonLink href="/creators/mira" variant="outline" size="lg">
              See a top creator
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Container>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map(([t, d]) => (
            <div key={t} className="card p-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 text-gold">
                <CheckIcon width={16} height={16} />
              </span>
              <h3 className="mt-5 font-medium">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="grid gap-12 pt-28 lg:grid-cols-2">
        <SectionHeading eyebrow="What sells" title="Six categories, one storefront." sub="Whatever form your expertise takes, there's a place for it." />
        <ul className="divide-y divide-line border-y border-line">
          {CATEGORIES.map((c) => (
            <li key={c.id} className="flex items-center gap-5 py-4">
              <span className="font-display w-8 text-2xl text-fg/80">{c.glyph}</span>
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted">{c.blurb}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>

      <Container className="pt-28">
        <div className="card flex flex-col items-center gap-6 p-10 text-center sm:p-16">
          <Eyebrow>Math</Eyebrow>
          <p className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            <span className="text-gradient">Sell a $49 Skill to 100 people a month and you make </span>
            <span className="text-gold font-display font-normal italic">$4,410.</span>
          </p>
          <ButtonLink href="/signup?next=/dashboard/creator/new" size="lg">
            Start selling free
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
