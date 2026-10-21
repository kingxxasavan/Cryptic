"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { CATEGORIES } from "@/lib/catalog";
import { SORTS, toSearchString } from "@/lib/query";
import type { SearchQuery, SortKey } from "@/lib/types";
import { SearchIcon } from "@/components/ui/icons";

const PRICES: { label: string; min?: number; max?: number }[] = [
  { label: "Any price" },
  { label: "Free", min: 0, max: 0 },
  { label: "Under $25", max: 2500 },
  { label: "$25 to $75", min: 2500, max: 7500 },
  { label: "$75+", min: 7500 },
];

const chip = (active: boolean) =>
  clsx(
    "press whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm",
    active ? "border-gold/40 bg-gold/10 text-gold" : "border-line text-muted hover:border-line-strong hover:text-fg",
  );

export function Filters({ query }: { query: SearchQuery }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState(query.q ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const href = (patch: Partial<SearchQuery>) => {
    const s = toSearchString({ ...query, ...patch });
    return s ? `/explore?${s}` : "/explore";
  };

  // debounce typing into the url
  useEffect(() => {
    if (text.trim() === (query.q ?? "")) return;
    const t = setTimeout(() => start(() => router.replace(href({ q: text.trim() || undefined }), { scroll: false })), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    if (window.location.hash === "#search") inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1" id="search">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
          <label htmlFor="explore-q" className="sr-only">
            Search
          </label>
          <input
            ref={inputRef}
            id="explore-q"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search skills, GPTs, prompts, courses…"
            className="input h-12 rounded-full pl-11"
            autoComplete="off"
          />
          {pending && <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-gold" />}
        </div>
        <label className="relative">
          <span className="sr-only">Sort by</span>
          <select
            value={query.sort ?? "trending"}
            onChange={(e) => start(() => router.replace(href({ sort: e.target.value as SortKey }), { scroll: false }))}
            className="input h-12 cursor-pointer appearance-none rounded-full pr-10 sm:w-56"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id} className="bg-raised">
                {s.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-faint">▾</span>
        </label>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href({ category: undefined })} className={chip(!query.category)} scroll={false}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={href({ category: c.id })} className={chip(query.category === c.id)} scroll={false}>
            <span className="mr-1.5 opacity-70">{c.glyph}</span>
            {c.name}
          </Link>
        ))}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {PRICES.map((p) => (
          <Link key={p.label} href={href({ min: p.min, max: p.max })} className={chip(query.min === p.min && query.max === p.max)} scroll={false}>
            {p.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
