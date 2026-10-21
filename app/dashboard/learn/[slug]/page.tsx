"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import { getCreator, getProduct } from "@/lib/catalog";
import { useLibrary } from "@/lib/hooks";
import { Button, ButtonLink } from "@/components/ui/button";
import { CheckIcon, LockIcon, PlayIcon } from "@/components/ui/icons";
import { Cover } from "@/components/ui/cover";

const key = (slug: string) => `cryptic:progress:${slug}`;
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: number[] }>();

function readDone(slug: string): number[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key(slug));
  } catch {}
  const hit = cache.get(slug);
  if (hit && hit.raw === raw) return hit.value;
  let value: number[] = [];
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    value = Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : [];
  } catch {}
  cache.set(slug, { raw, value });
  return value;
}

function writeDone(slug: string, done: number[]) {
  try {
    localStorage.setItem(key(slug), JSON.stringify(done));
  } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const EMPTY: number[] = [];

export default function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = getProduct(slug);
  const lib = useLibrary();
  const [current, setCurrent] = useState(0);
  const done = useSyncExternalStore(subscribe, () => readDone(slug), () => EMPTY);

  if (!product || !product.contents.some((c) => c.minutes)) notFound();

  if (lib.loading) return <div className="mt-10 h-96 animate-pulse rounded-3xl bg-white/[0.03]" />;

  if (!lib.owns(product.id)) {
    return (
      <div className="card mx-auto mt-10 flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/5 text-muted">
          <LockIcon />
        </span>
        <p className="mt-5 text-lg font-medium">You don’t own this course yet</p>
        <ButtonLink href={`/product/${product.slug}`} className="mt-6">
          View course
        </ButtonLink>
      </div>
    );
  }

  const lessons = product.contents;
  const lesson = lessons[current];
  const pct = Math.round((done.filter((i) => i < lessons.length).length / lessons.length) * 100);
  const isDone = done.includes(current);
  const creator = getCreator(product.creatorHandle);

  const toggle = () => {
    const next = isDone ? done.filter((i) => i !== current) : [...done, current];
    writeDone(slug, next);
    if (!isDone && current < lessons.length - 1) setCurrent(current + 1);
  };

  return (
    <div className="grid gap-8 pt-2 lg:grid-cols-[320px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Link href="/dashboard" className="text-sm text-faint hover:text-fg">
          ← Library
        </Link>
        <p className="mt-4 font-medium leading-snug">{product.title}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-faint">{pct}% complete</p>
        <ol className="mt-6 space-y-1">
          {lessons.map((l, i) => (
            <li key={l.title}>
              <button
                onClick={() => setCurrent(i)}
                aria-current={i === current ? "step" : undefined}
                className={clsx("press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm", i === current ? "bg-white/[0.06] text-fg" : "text-muted hover:bg-white/[0.03] hover:text-fg")}
              >
                <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px]", done.includes(i) ? "bg-gold text-ink" : "border border-line text-faint")}>
                  {done.includes(i) ? <CheckIcon width={13} height={13} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{l.title}</span>
                <span className="font-mono text-[11px] text-faint">{l.minutes}m</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <article className="min-w-0">
        <div className="relative overflow-hidden rounded-[26px]">
          <Cover product={product} large className="aspect-video" />
          <div className="absolute inset-0 grid place-items-center bg-black/30">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md">
              <PlayIcon width={30} height={30} />
            </span>
          </div>
          <span className="absolute bottom-5 left-6 rounded-full bg-black/50 px-3 py-1 font-mono text-xs text-white/80 backdrop-blur">
            {lesson.detail} · {lesson.minutes} min
          </span>
        </div>
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.03em]">{lesson.title}</h1>
        <p className="mt-2 text-sm text-faint">with {creator?.name}</p>
        <div className="mt-6 max-w-2xl space-y-4 text-[16.5px] leading-[1.75] text-fg/85">
          {current === 0 ? (
            <p className="whitespace-pre-line">{product.preview}</p>
          ) : (
            <>
              <p>
                In this lesson we dig into <strong className="font-medium text-fg">{lesson.title.toLowerCase()}</strong>. Watch the video first, then work through the exercise below before you move on.
              </p>
              <p>Exercise: take one real task from your week and apply what you just learned. Write down what changed in the output, and what still feels off. We’ll use those notes in the next lesson.</p>
            </>
          )}
        </div>
        <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6">
          <Button onClick={toggle} variant={isDone ? "outline" : "gold"}>
            {isDone ? "Mark as not done" : current === lessons.length - 1 ? "Finish course" : "Complete & continue"}
          </Button>
          {current > 0 && (
            <Button variant="ghost" onClick={() => setCurrent(current - 1)}>
              Previous lesson
            </Button>
          )}
        </div>
      </article>
    </div>
  );
}
