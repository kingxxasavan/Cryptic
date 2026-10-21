"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth";
import { CATEGORIES } from "@/lib/catalog";
import { getStore } from "@/lib/store";
import { validateDraft } from "@/lib/store/listing";
import type { CategoryId, ListingDraft, Product } from "@/lib/types";
import { Eyebrow } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";

export default function NewListing() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ title: "", tagline: "", description: "", category: "claude-skills" as CategoryId, price: "19", tags: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const draft: ListingDraft = {
    title: form.title,
    tagline: form.tagline,
    description: form.description,
    category: form.category,
    priceCents: Math.round(Number(form.price || 0) * 100),
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
  };

  const preview: Product = {
    id: "preview",
    slug: "preview",
    title: form.title || "Your listing title",
    tagline: form.tagline || "A one line pitch that makes people click.",
    description: form.description,
    category: form.category,
    priceCents: Number.isFinite(draft.priceCents) ? Math.max(0, draft.priceCents) : 0,
    creatorHandle: "preview",
    creatorName: user?.name ?? "You",
    rating: 0,
    reviewCount: 0,
    sales: 0,
    tags: draft.tags,
    createdAt: "2026-10-21",
    accent: (form.title.length * 37 + 200) % 360,
    contents: [],
    preview: "",
    userMade: true,
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const err = validateDraft(draft);
    if (err) return setError(err);
    setError(null);
    setBusy(true);
    try {
      const p = await getStore().createListing(user.uid, draft);
      toast.success("Listing published", { description: p.title });
      router.push(`/listing/${p.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <Eyebrow>New listing</Eyebrow>
      <h1 className="text-gradient mt-3 text-4xl font-semibold tracking-[-0.04em]">Sell something great.</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8" noValidate>
          <div>
            <label htmlFor="title" className="mb-2 block text-sm text-muted">
              Title
            </label>
            <input id="title" className="input" maxLength={80} value={form.title} onChange={set("title")} placeholder="e.g. Sales Call Prep Skill" />
          </div>
          <div>
            <label htmlFor="tagline" className="mb-2 block text-sm text-muted">
              Tagline
            </label>
            <input id="tagline" className="input" maxLength={120} value={form.tagline} onChange={set("tagline")} placeholder="One sentence on the outcome" />
          </div>
          <div>
            <label htmlFor="description" className="mb-2 block text-sm text-muted">
              Description
            </label>
            <textarea id="description" rows={5} className="input resize-y" value={form.description} onChange={set("description")} placeholder="What's inside, who it's for, and what it does better than doing it by hand." />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-2 block text-sm text-muted">
                Category
              </label>
              <select id="category" className="input cursor-pointer" value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-raised">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="price" className="mb-2 block text-sm text-muted">
                Price (USD)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">$</span>
                <input id="price" inputMode="decimal" className="input pl-7" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, "") })} />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="tags" className="mb-2 block text-sm text-muted">
              Tags <span className="text-faint">(comma separated)</span>
            </label>
            <input id="tags" className="input" value={form.tags} onChange={set("tags")} placeholder="sales, calls, prep" />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
            <p className="text-xs text-faint">You keep 90%. Listings go live right away.</p>
            <Button disabled={busy}>{busy ? "Publishing…" : "Publish listing"}</Button>
          </div>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-sm text-muted">Live preview</p>
          <div className="pointer-events-none" aria-hidden inert>
            <ProductCard product={preview} />
          </div>
        </div>
      </div>
    </div>
  );
}
