"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/components/providers/auth";
import { useCart } from "@/components/providers/cart";
import { Avatar } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { BagIcon, CloseIcon, MenuIcon, SearchIcon } from "@/components/ui/icons";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/explore?category=claude-skills", label: "Claude Skills" },
  { href: "/explore?category=gpts", label: "GPTs" },
  { href: "/explore?category=courses", label: "Courses" },
  { href: "/sell", label: "Sell" },
];

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Cryptic home">
      <span className="relative grid h-7 w-7 place-items-center rounded-[9px] bg-gradient-to-br from-[#f3ddb0] to-[#a9824a] shadow-[0_0_24px_-4px_rgba(230,199,143,0.6)]">
        <span className="font-display text-lg leading-none text-[#1a1408]">C</span>
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.03em]">Cryptic</span>
    </Link>
  );
}

function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="press rounded-full" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu">
        <Avatar name={user.name} hue={(user.uid.charCodeAt(user.uid.length - 1) * 37) % 360} size={34} />
      </button>
      <div
        role="menu"
        className={clsx(
          "absolute right-0 top-12 z-50 w-56 origin-top-right rounded-2xl border border-line bg-raised/95 p-1.5 shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-200 ease-[var(--ease-out)]",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="px-3 py-2.5">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-faint">{user.email}</p>
        </div>
        <div className="my-1 h-px bg-line" />
        {[
          ["/dashboard", "Library"],
          ["/dashboard/creator", "Creator studio"],
          ["/dashboard/creator/new", "New listing"],
        ].map(([href, label]) => (
          <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-fg">
            {label}
          </Link>
        ))}
        <div className="my-1 h-px bg-line" />
        <button
          role="menuitem"
          onClick={async () => {
            setOpen(false);
            await signOut();
            router.push("/");
          }}
          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-white/5 hover:text-fg"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export function Header() {
  const { user, loading } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // close the mobile menu when the route changes
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobile(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 transition-[background-color,border-color] duration-300",
        scrolled || mobile ? "border-b border-line bg-ink/75 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/explore#search" className="press grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-fg" aria-label="Search">
            <SearchIcon />
          </Link>
          <Link href="/cart" className="press relative grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-fg" aria-label={`Cart, ${count} items`}>
            <BagIcon />
            {count > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink tabular-nums">
                {count}
              </span>
            )}
          </Link>
          <div className="ml-1.5 hidden items-center gap-2 sm:flex">
            {loading ? (
              <span className="h-9 w-20 animate-pulse rounded-full bg-white/5" />
            ) : user ? (
              <AccountMenu />
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Log in
                </ButtonLink>
                <ButtonLink href="/signup" variant="light" size="sm">
                  Get started
                </ButtonLink>
              </>
            )}
          </div>
          <button
            className="press grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-white/5 md:hidden"
            onClick={() => setMobile((m) => !m)}
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
          >
            {mobile ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {mobile && (
        <nav className="rise border-t border-line px-4 pb-6 pt-3 md:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="block border-b border-line py-3.5 text-[15px] text-fg">
              {n.label}
            </Link>
          ))}
          <div className="mt-5 flex gap-2">
            {user ? (
              <ButtonLink href="/dashboard" variant="light" size="md" className="flex-1">
                My library
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="outline" size="md" className="flex-1">
                  Log in
                </ButtonLink>
                <ButtonLink href="/signup" variant="light" size="md" className="flex-1">
                  Get started
                </ButtonLink>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
