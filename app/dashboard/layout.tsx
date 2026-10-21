"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import clsx from "clsx";
import { useAuth } from "@/components/providers/auth";
import { Container } from "@/components/ui/bits";
import { ModeBadge } from "@/components/site/mode-badge";

const TABS = [
  { href: "/dashboard", label: "Library" },
  { href: "/dashboard/creator", label: "Creator studio" },
  { href: "/dashboard/creator/new", label: "New listing" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <Container className="pt-14">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-white/5" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-white/[0.03]" />
          ))}
        </div>
      </Container>
    );
  }

  const learning = pathname.startsWith("/dashboard/learn");

  return (
    <Container className="pt-10">
      {!learning && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-0">
          <nav className="-mb-px flex gap-6" aria-label="Dashboard">
            {TABS.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx("border-b-2 pb-3.5 text-sm transition-colors", active ? "border-gold text-fg" : "border-transparent text-muted hover:text-fg")}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <div className="pb-3">
            <ModeBadge />
          </div>
        </div>
      )}
      <div className={learning ? "" : "pt-10"}>{children}</div>
    </Container>
  );
}
