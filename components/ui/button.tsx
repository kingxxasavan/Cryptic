import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps } from "react";

type Variant = "gold" | "light" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const styles: Record<Variant, string> = {
  gold: "bg-gradient-to-b from-[#f3ddb0] to-[#d7b47a] text-[#1a1408] shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_8px_30px_-8px_rgba(230,199,143,0.55)] hover:brightness-105",
  light: "bg-fg text-ink hover:bg-white",
  ghost: "text-muted hover:text-fg hover:bg-white/5",
  outline: "border border-line-strong text-fg hover:bg-white/5 hover:border-white/25",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-full gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-full gap-2",
  lg: "h-13 px-7 text-base rounded-full gap-2",
};

export const buttonClass = (variant: Variant = "gold", size: Size = "md", extra?: string) =>
  clsx("press inline-flex select-none items-center justify-center font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-50", styles[variant], sizes[size], extra);

export function Button({ variant, size, className, ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonLink({ variant, size, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
