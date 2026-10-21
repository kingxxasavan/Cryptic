import clsx from "clsx";
import { StarIcon, VerifiedIcon } from "@/components/ui/icons";

export function Avatar({ name, hue, size = 36, className }: { name: string; hue: number; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={clsx("inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ring-1 ring-white/15", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `radial-gradient(circle at 30% 25%, hsl(${hue} 80% 70%), hsl(${hue} 55% 32%) 70%)`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 text-gold", className)} aria-label={`${rating.toFixed(1)} out of 5`}>
      <StarIcon width={14} height={14} />
      <span className="text-sm font-medium text-fg tabular-nums">{rating > 0 ? rating.toFixed(1) : "New"}</span>
    </span>
  );
}

export function Verified() {
  return <VerifiedIcon width={15} height={15} className="text-gold" aria-label="Verified creator" />;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={clsx("font-mono text-[11px] uppercase tracking-[0.22em] text-gold/90", className)}>{children}</p>
  );
}

export function SectionHeading({ eyebrow, title, sub, className }: { eyebrow?: string; title: React.ReactNode; sub?: string; className?: string }) {
  return (
    <div className={clsx("max-w-2xl", className)}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className="text-gradient text-3xl font-semibold tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.08]">{title}</h2>
      {sub && <p className="mt-4 text-[17px] leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-xs text-muted", className)}>
      {children}
    </span>
  );
}
