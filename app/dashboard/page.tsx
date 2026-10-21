"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth";
import { getCategory } from "@/lib/catalog";
import { buildDownload, triggerDownload } from "@/lib/download";
import { formatDate } from "@/lib/format";
import { useCartProducts, useLibrary } from "@/lib/hooks";
import { Eyebrow } from "@/components/ui/bits";
import { Button, ButtonLink } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { DownloadIcon, PlayIcon } from "@/components/ui/icons";

export default function LibraryPage() {
  const { user } = useAuth();
  const lib = useLibrary();
  const { items } = useCartProducts(lib.items);
  const when = new Map(lib.items.map((i) => [i.productId, i.purchasedAt]));
  const sorted = [...items].sort((a, b) => (when.get(b.id) ?? "").localeCompare(when.get(a.id) ?? ""));

  return (
    <div>
      <Eyebrow>Library</Eyebrow>
      <h1 className="text-gradient mt-3 text-4xl font-semibold tracking-[-0.04em]">Hey {user?.name.split(" ")[0]}, here’s your stuff.</h1>

      {lib.loading ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-white/[0.03]" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center px-6 py-20 text-center">
          <p className="font-display text-5xl italic text-gold/70">Empty shelf</p>
          <p className="mt-4 max-w-sm text-muted">Everything you buy shows up here instantly. Start with a free prompt pack if you want to test it out.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/explore">Explore the marketplace</ButtonLink>
            <ButtonLink href="/explore?min=0&max=0" variant="outline">
              Free stuff
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p) => {
            const course = p.contents.some((c) => c.minutes);
            return (
              <li key={p.id} className="card flex flex-col overflow-hidden p-2">
                <Link href={p.userMade ? `/listing/${p.id}` : `/product/${p.slug}`}>
                  <Cover product={p} className="aspect-[16/9] rounded-[14px]" />
                </Link>
                <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
                  <p className="text-xs text-faint">
                    {getCategory(p.category)?.name} · Bought {formatDate(when.get(p.id) ?? new Date().toISOString())}
                  </p>
                  <p className="mt-1.5 font-medium">{p.title}</p>
                  <div className="mt-auto flex gap-2 pt-5">
                    {course && !p.userMade && (
                      <ButtonLink href={`/dashboard/learn/${p.slug}`} size="sm" className="flex-1">
                        <PlayIcon width={14} height={14} /> Start learning
                      </ButtonLink>
                    )}
                    <Button variant={course ? "outline" : "gold"} size="sm" className="flex-1" onClick={() => triggerDownload(buildDownload(p))}>
                      <DownloadIcon width={15} height={15} /> Download
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
