import Link from "next/link";
import { getCategory, getCreator } from "@/lib/catalog";
import { formatCount, formatDate } from "@/lib/format";
import type { Product, Review } from "@/lib/types";
import { Avatar, Container, Pill, Stars, Verified } from "@/components/ui/bits";
import { Cover } from "@/components/ui/cover";
import { LockIcon, PlayIcon } from "@/components/ui/icons";
import { ProductCard } from "@/components/ui/product-card";
import { BuyBox } from "@/components/product/buy-box";
import { Reviews } from "@/components/product/reviews";

export function ProductDetail({ product, seededReviews, related }: { product: Product; seededReviews: Review[]; related: Product[] }) {
  const cat = getCategory(product.category);
  const creator = getCreator(product.creatorHandle);
  const name = creator?.name ?? product.creatorName ?? "Creator";
  const isCourse = product.contents.some((c) => c.minutes);
  const totalMin = product.contents.reduce((s, c) => s + (c.minutes ?? 0), 0);

  return (
    <Container className="pt-8">
      <nav className="flex items-center gap-2 text-sm text-faint" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-fg">
          Explore
        </Link>
        <span>/</span>
        <Link href={`/explore?category=${product.category}`} className="hover:text-fg">
          {cat?.name}
        </Link>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <div className="min-w-0">
          <div className="rise">
            <div className="flex flex-wrap gap-2">
              <Pill>
                {cat?.glyph} {cat?.name}
              </Pill>
              {product.featured && <Pill className="border-gold/25 text-gold">Featured</Pill>}
              {product.userMade && <Pill>Community listing</Pill>}
            </div>
            <h1 className="text-gradient mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.4rem]">{product.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{product.tagline}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              {creator ? (
                <Link href={`/creators/${creator.handle}`} className="flex items-center gap-2.5 hover:text-gold">
                  <Avatar name={name} hue={creator.avatarHue} size={30} />
                  <span className="font-medium">{name}</span>
                  {creator.verified && <Verified />}
                </Link>
              ) : (
                <span className="flex items-center gap-2.5">
                  <Avatar name={name} hue={product.accent} size={30} />
                  <span className="font-medium">{name}</span>
                </span>
              )}
              <Stars rating={product.rating} />
              {product.sales > 0 && <span className="text-muted">{formatCount(product.sales)} sold</span>}
              <span className="text-faint">Updated {formatDate(product.createdAt)}</span>
            </div>
          </div>

          <Cover product={product} large className="rise mt-10 aspect-[16/8] rounded-[26px] [animation-delay:80ms]" />

          <div className="mt-12 grid gap-12">
            <section>
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">About</h2>
              <p className="mt-4 max-w-2xl text-[16.5px] leading-[1.75] text-fg/85">{product.description}</p>
              {product.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <Link key={t} href={`/explore?q=${encodeURIComponent(t)}`} className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-muted hover:text-fg">
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-semibold tracking-[-0.02em]">{isCourse ? "Curriculum" : "What's inside"}</h2>
                {isCourse && (
                  <p className="text-sm text-faint">
                    {product.contents.length} lessons · {Math.round(totalMin / 6) / 10}h
                  </p>
                )}
              </div>
              <ul className="card mt-5 divide-y divide-line overflow-hidden">
                {product.contents.map((c, i) => (
                  <li key={c.title} className="flex items-center gap-4 px-5 py-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.05] font-mono text-xs text-faint">
                      {isCourse ? <PlayIcon width={13} height={13} /> : String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.title}</p>
                      <p className="text-sm text-faint">{c.detail}</p>
                    </div>
                    {c.minutes && <span className="font-mono text-xs text-faint">{c.minutes} min</span>}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">Preview</h2>
              <div className="card relative mt-5 overflow-hidden">
                <pre className="max-h-80 overflow-hidden whitespace-pre-wrap break-words p-6 font-mono text-[13px] leading-relaxed text-muted">{product.preview}</pre>
                <div className="absolute inset-x-0 bottom-0 flex h-32 items-end justify-center bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/90 to-transparent pb-5">
                  <span className="flex items-center gap-2 rounded-full border border-line bg-raised px-3.5 py-1.5 text-xs text-muted">
                    <LockIcon width={14} height={14} /> Full version unlocks after purchase
                  </span>
                </div>
              </div>
            </section>

            <Reviews productId={product.id} seeded={seededReviews} rating={product.rating} count={product.reviewCount} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BuyBox product={product} />
          {creator && (
            <Link href={`/creators/${creator.handle}`} className="card lift mt-4 flex gap-4 p-5">
              <Avatar name={creator.name} hue={creator.avatarHue} size={44} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  {creator.name} {creator.verified && <Verified />}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{creator.bio}</p>
              </div>
            </Link>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-28">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">You might also like</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
