import Link from "next/link";
import { getCategory, getCreator } from "@/lib/catalog";
import { formatCount, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Cover } from "@/components/ui/cover";
import { Avatar, Stars, Verified } from "@/components/ui/bits";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const creator = getCreator(product.creatorHandle);
  const name = creator?.name ?? product.creatorName ?? "Creator";
  return (
    <Link
      href={`/product/${product.slug}`}
      className="card lift group flex flex-col overflow-hidden p-2"
      prefetch={priority ? true : undefined}
    >
      <Cover product={product} className="aspect-[16/10] rounded-[14px]" />
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15.5px] font-medium leading-snug tracking-[-0.01em] text-fg">{product.title}</h3>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-sm font-medium tabular-nums text-fg">
            {formatPrice(product.priceCents)}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{product.tagline}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-5 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-muted">
            <Avatar name={name} hue={creator?.avatarHue ?? product.accent} size={22} />
            <span className="truncate">{name}</span>
            {creator?.verified && <Verified />}
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <Stars rating={product.rating} />
            {product.sales > 0 && <span className="hidden text-faint sm:inline">{formatCount(product.sales)} sold</span>}
          </span>
        </div>
      </div>
      <span className="sr-only">{getCategory(product.category)?.name}</span>
    </Link>
  );
}
