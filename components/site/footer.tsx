import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { Container } from "@/components/ui/bits";
import { Logo } from "@/components/site/header";
import { ModeBadge } from "@/components/site/mode-badge";

export function Footer() {
  const cols = [
    { title: "Marketplace", links: CATEGORIES.map((c) => [`/explore?category=${c.id}`, c.name]) },
    { title: "Creators", links: [["/sell", "Start selling"], ["/dashboard/creator", "Creator studio"], ["/dashboard/creator/new", "New listing"], ["/creators/mira", "Featured creator"]] },
    { title: "Account", links: [["/login", "Log in"], ["/signup", "Sign up"], ["/dashboard", "Library"], ["/cart", "Cart"]] },
  ];
  return (
    <footer className="relative mt-32 border-t border-line">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            The marketplace for AI craft. Claude Skills, GPTs, prompts and courses from people who actually use them every day.
          </p>
          <div className="mt-6">
            <ModeBadge />
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-4 text-sm font-medium text-fg">{c.title}</p>
            <ul className="space-y-2.5">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted transition-colors hover:text-fg">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="flex flex-col gap-3 border-t border-line py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Cryptic. Demo storefront, no real payments are taken.</p>
        <p>Claude is a trademark of Anthropic. ChatGPT is a trademark of OpenAI. Cryptic is independent.</p>
      </Container>
    </footer>
  );
}
