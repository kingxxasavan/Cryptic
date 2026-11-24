"use client";
import { useState } from "react";
import { useAuth } from "./provider";

export function SignInDialog({ onClose, why }: { onClose: () => void; why?: string }) {
  const { signInGoogle, signInEmail } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr("");
    try { await fn(); onClose(); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Sign in" className="card w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold">{mode === "in" ? "Sign in" : "Create an account"}</h2>
        <p className="mt-1 text-sm text-muted">{why || "Save your projects, share them, and use the AI."}</p>
        <button className="btn mt-5 w-full" disabled={busy} onClick={() => run(signInGoogle)}>Continue with Google</button>
        <div className="my-4 flex items-center gap-3 text-xs text-faint"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); run(() => signInEmail(email, password, mode === "up", name)); }}>
          {mode === "up" && <label className="field"><span className="label">Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
          <label className="field"><span className="label">Email</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          <label className="field"><span className="label">Password</span><input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} /></label>
          {err && <p className="text-sm text-bad" role="alert">{err}</p>}
          <button className="btn btn-primary" disabled={busy} type="submit">{busy ? <span className="spinner" /> : mode === "in" ? "Sign in" : "Create account"}</button>
        </form>
        <button className="mt-4 text-sm text-muted underline-offset-2 hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }}>
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
