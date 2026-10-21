import type { Product, Review } from "@/lib/types";

const POOL = [
  { author: "Daniel K.", body: "Paid for itself on day one. The structure alone taught me more than a dozen free threads." },
  { author: "Aiko S.", body: "Super clear and actually practical. I adapted it to my team in about 20 minutes." },
  { author: "Tomás R.", body: "Exactly what the preview promised. The examples are the best part, really well chosen." },
  { author: "Grace O.", body: "I was skeptical about paying for this kind of thing but wow. Using it every day now." },
  { author: "Lena M.", body: "Polished, well documented and the creator answered my question within hours." },
  { author: "Arjun P.", body: "Solid. A couple of parts felt basic but the advanced sections more than make up for it." },
  { author: "Chloe B.", body: "This is the stuff I wish someone had shown me a year ago. Instant buy for my whole team." },
  { author: "Mateo F.", body: "Clean, no fluff. You can tell the creator actually uses this in real work." },
  { author: "Hannah W.", body: "Saved me a full afternoon on my first try. Already recommended it to three friends." },
  { author: "Yusuf A.", body: "Great value. The update last month added even more, love that updates are free." },
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** deterministic sample reviews so seeded products look alive without a db */
export function seededReviews(p: Product, n = 4): Review[] {
  if (p.reviewCount === 0) return [];
  const h = hash(p.id);
  return Array.from({ length: n }, (_, i) => {
    const r = POOL[(h + i * 3) % POOL.length];
    const rating = i === 3 && p.rating < 4.8 ? 4 : 5;
    const day = 1 + ((h >>> (i * 3)) % 20);
    return { id: `seed-${p.id}-${i}`, productId: p.id, author: r.author, body: r.body, rating, createdAt: `2026-10-${String(day).padStart(2, "0")}T12:00:00Z` };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
