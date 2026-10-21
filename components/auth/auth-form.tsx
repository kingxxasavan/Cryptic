"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth";
import { safeNext } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/header";

const DEMO = { name: "Demo Buyer", email: "demo@cryptic.dev", password: "cryptic-demo" };

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function run(fn: () => Promise<unknown>, welcome: string) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      toast.success(welcome);
      router.push(next);
    } catch (e) {
      setError((e as Error).message || "Something went wrong.");
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (signup && name.trim().length < 2) return setError("Tell us your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("That email doesn’t look right.");
    if (password.length < 6) return setError("Password needs at least 6 characters.");
    run(() => (signup ? auth.signUp(name, email, password) : auth.signIn(email, password)), signup ? "Welcome to Cryptic" : "Welcome back");
  }

  const demo = () =>
    run(async () => {
      try {
        await auth.signIn(DEMO.email, DEMO.password);
      } catch {
        await auth.signUp(DEMO.name, DEMO.email, DEMO.password);
      }
    }, "Signed in to the demo account");

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <div className="rise">
        <Logo />
        <h1 className="text-gradient mt-10 text-4xl font-semibold tracking-[-0.04em]">{signup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-3 text-muted">{signup ? "Buy, learn and sell AI craft. Takes 20 seconds." : "Log in to see your library and creator studio."}</p>
      </div>

      <form onSubmit={submit} className="rise mt-10 space-y-4 [animation-delay:80ms]" noValidate>
        {signup && (
          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-muted">
              Name
            </label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ada Lovelace" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-muted">
            Email
          </label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
            {error}
          </p>
        )}

        <Button size="lg" className="w-full" disabled={busy}>
          {busy ? "One sec…" : signup ? "Create account" : "Log in"}
        </Button>
      </form>

      <div className="rise my-6 flex items-center gap-4 text-xs text-faint [animation-delay:120ms]">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <Button variant="outline" size="lg" className="rise w-full [animation-delay:140ms]" onClick={demo} disabled={busy} type="button">
        Try the demo account
      </Button>

      <p className="mt-8 text-center text-sm text-muted">
        {signup ? "Already have an account? " : "New here? "}
        <Link href={`${signup ? "/login" : "/signup"}${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-gold underline-offset-4 hover:underline">
          {signup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
