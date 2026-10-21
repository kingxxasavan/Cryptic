"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { useAuth } from "@/components/providers/auth";
import { getStore } from "@/lib/store";
import { formatCount, formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";
import { Avatar } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { StarIcon } from "@/components/ui/icons";

export function Reviews({ productId, seeded, rating, count }: { productId: string; seeded: Review[]; rating: number; count: number }) {
  const { user } = useAuth();
  const [mine, setMine] = useState<Review[]>([]);
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getStore()
      .getReviews(productId)
      .then((r) => alive && setMine(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [productId]);

  const all = [...mine, ...seeded];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || body.trim().length < 3) return;
    setBusy(true);
    try {
      const r = await getStore().addReview(productId, { author: user.name, rating: stars, body: body.trim().slice(0, 2000) });
      setMine((m) => [r, ...m]);
      setBody("");
      toast.success("Thanks for the review!");
    } catch (err) {
      toast.error("Couldn't post that review", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="reviews-h">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-h" className="text-2xl font-semibold tracking-[-0.02em]">
            Reviews
          </h2>
          <p className="mt-1 text-sm text-muted">
            {rating > 0 ? (
              <>
                <span className="text-gold">★ {rating.toFixed(1)}</span> average from {formatCount(count + mine.length)} reviews
              </>
            ) : (
              "No reviews yet. Be the first."
            )}
          </p>
        </div>
      </div>

      {user ? (
        <form onSubmit={submit} className="card mt-6 p-5">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setStars(n)}
                className={clsx("press p-0.5", n <= stars ? "text-gold" : "text-white/15")}
              >
                <StarIcon width={22} height={22} />
              </button>
            ))}
          </div>
          <label htmlFor="review-body" className="sr-only">
            Your review
          </label>
          <textarea id="review-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3} placeholder="What did you think?" className="input mt-3 resize-none" />
          <div className="mt-3 flex justify-end">
            <Button size="sm" disabled={busy || body.trim().length < 3}>
              {busy ? "Posting…" : "Post review"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-6 text-sm text-muted">
          <Link href="/login" className="text-gold underline-offset-4 hover:underline">
            Log in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {all.map((r) => (
          <li key={r.id} className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5">
                <Avatar name={r.author} hue={(r.author.charCodeAt(0) * 29) % 360} size={30} />
                <span className="text-sm font-medium">{r.author}</span>
              </span>
              <span className="text-xs text-gold" aria-label={`${r.rating} out of 5`}>
                {"★".repeat(r.rating)}
                <span className="text-white/15">{"★".repeat(5 - r.rating)}</span>
              </span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-fg/85">{r.body}</p>
            <p className="mt-3 text-xs text-faint">{formatDate(r.createdAt)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
