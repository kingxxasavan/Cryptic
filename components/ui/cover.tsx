import clsx from "clsx";
import { getCategory } from "@/lib/catalog";
import type { Product } from "@/lib/types";

/** generative cover art, so every product looks distinct without image files */
export function Cover({ product, className, large, mini }: { product: Pick<Product, "accent" | "category" | "title">; className?: string; large?: boolean; mini?: boolean }) {
  const h = product.accent;
  const cat = getCategory(product.category);
  return (
    <div
      className={clsx("relative isolate overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 90% at 85% 0%, hsl(${h} 70% 55% / 0.55), transparent 55%),
          radial-gradient(90% 80% at 0% 100%, hsl(${(h + 40) % 360} 60% 45% / 0.45), transparent 60%),
          linear-gradient(160deg, hsl(${h} 30% 12%), #08080b 70%)`,
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "linear-gradient(rgb(255 255 255 / .5) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .5) 1px, transparent 1px)",
          backgroundSize: large ? "44px 44px" : "28px 28px",
          maskImage: "radial-gradient(ellipse at 70% 30%, black, transparent 70%)",
        }}
      />
      <div
        className={clsx(
          "absolute font-display leading-none text-white/85 drop-shadow-[0_0_30px_rgba(255,255,255,0.35)]",
          large ? "right-10 bottom-6 text-[9rem]" : mini ? "inset-0 grid place-items-center text-2xl" : "right-4 bottom-2 text-6xl",
        )}
      >
        {cat?.glyph}
      </div>
      {!mini && (
        <div className={clsx("absolute font-mono uppercase tracking-[0.18em] text-white/60", large ? "left-8 top-7 text-xs" : "left-4 top-4 text-[10px]")}>
          {cat?.name}
        </div>
      )}
      <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
    </div>
  );
}
