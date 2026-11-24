"use client";
// Home: describe a new project (and paste the brief), watch the AI research
// and design it, or open the sample and your own projects.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/provider";
import { SignInDialog } from "@/components/auth/sign-in";
import { designWithAI } from "@/lib/ai/client";
import { deleteProject, listProjects, newId, saveProject, type Summary } from "@/lib/store/projects";
import { sampleGlasses } from "@/lib/sample";
import type { Project } from "@/lib/recipe/types";

const ago = (t: number) => {
  const s = (Date.now() - t) / 1000;
  return s < 60 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : s < 86400 ? Math.round(s / 3600) + " h ago" : new Date(t).toLocaleDateString();
};

export default function Home() {
  const { me, ready, token, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brief, setBrief] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [signIn, setSignIn] = useState<string | null>(null);
  const [projects, setProjects] = useState<Summary[] | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { if (ready) listProjects(me?.uid || null).then(setProjects); }, [ready, me]);

  const open = async (p: Project) => { await saveProject(p, me?.uid || null); router.push("/p/" + p.id); };

  const design = async () => {
    if (!description.trim()) { toast.error("Say what you're building first."); return; }
    if (!me) { setSignIn("Sign in so the AI can research and design your parts. It's free."); return; }
    setBusy(true); setSteps(["Starting"]); setModel("");
    abort.current = new AbortController();
    try {
      const p = await designWithAI({ description, brief, name: name.trim() || undefined, id: newId() }, token,
        { step: (s) => setSteps((x) => [...x, s]), model: setModel }, abort.current.signal);
      toast.success(`Designed ${p.parts.length} parts`);
      await open({ ...p, owner: me.uid });
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message, { duration: 10000 });
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-gold text-[#17130b]">◆</span>Cryptic Parts</Link>
        <span className="flex-1" />
        {me ? <><span className="hidden text-sm text-muted sm:inline">{me.email}</span><button className="btn btn-sm btn-ghost" onClick={() => signOut()}>Sign out</button></>
          : <button className="btn btn-sm" onClick={() => setSignIn("")}>Sign in</button>}
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-6 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Describe it.<br /><span className="text-gold">Get every part in 3D.</span></h1>
          <p className="mt-4 max-w-xl text-muted">Tell Cryptic Parts what you&apos;re building and paste in everything you&apos;ve worked out. The AI researches real sizes on the web, designs every part with exact millimetres, and gives you a model you can pull apart, edit, color and export for printing.</p>
          <ul className="mt-6 grid max-w-xl grid-cols-2 gap-2 text-sm text-muted">
            {["Sizes from real research, with sources", "Exploded view of every part", "Sliders for every size, or just ask", "STL, 3MF, OBJ, GLB, PLY", "Materials, colors and weights", "Share a link or embed it"].map((t) => (
              <li key={t} className="flex gap-2"><span className="text-gold">◆</span>{t}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn" onClick={() => open(sampleGlasses(newId()))}>Open the sample glasses</button>
            <button className="btn btn-ghost" onClick={() => open({ ...sampleGlasses(newId()), name: "Untitled project", description: "", brief: "", parts: sampleGlasses("x").parts.slice(0, 1) })}>Start from one part</button>
          </div>
        </section>

        <section className="card p-5">
          {!busy ? (
            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); design(); }}>
              <h2 className="text-lg font-semibold">New project</h2>
              <label className="field"><span className="label">Name (optional)</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cryptic glasses v2" /></label>
              <label className="field"><span className="label">What are you building?</span>
                <textarea className="textarea min-h-0" rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Smart glasses with a camera in the bridge, a battery in each arm and a USB-C port on the right arm" /></label>
              <label className="field"><span className="label">Brief: paste your brainstorms, plans and requirements</span>
                <textarea className="textarea font-mono text-xs" rows={7} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Everything you've talked through: what it's for, who uses it, what you decided, sizes you already know, how it gets made…" /></label>
              <button className="btn btn-primary h-11" type="submit">Research and design it</button>
              <p className="text-xs text-faint">Takes about a minute. {me ? "" : "You'll be asked to sign in (free)."}</p>
            </form>
          ) : (
            <div aria-live="polite">
              <h2 className="text-lg font-semibold">Designing “{name || description.slice(0, 40)}”</h2>
              {model && <p className="mt-1 text-xs text-faint">Using {model}</p>}
              <ol className="mt-4 flex flex-col gap-2">
                {steps.map((s, i) => (
                  <li key={i} className={`flex items-center gap-2 text-sm ${i === steps.length - 1 ? "text-fg" : "text-muted"}`}>
                    {i === steps.length - 1 ? <span className="spinner" /> : <span className="text-ok">✓</span>}{s}
                  </li>
                ))}
              </ol>
              <button className="btn btn-sm btn-ghost mt-6" onClick={() => { abort.current?.abort(); setBusy(false); }}>Cancel</button>
            </div>
          )}
        </section>

        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-3"><h2 className="text-lg font-semibold">Your projects</h2>{!me && <span className="text-xs text-faint">Saved in this browser. Sign in to keep them everywhere and share them.</span>}</div>
          {projects === null ? <span className="spinner" /> : !projects.length ? <p className="text-sm text-muted">None yet. Open the sample or design your first one.</p> : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <li key={p.id} className="card group flex items-center gap-3 p-4">
                  <Link href={"/p/" + p.id} className="min-w-0 flex-1">
                    <div className="truncate font-medium group-hover:text-gold">{p.name}</div>
                    <div className="text-xs text-faint">{p.parts} parts · {ago(p.updatedAt)} · {p.where === "cloud" ? (p.shared ? "shared" : "saved") : "this browser"}</div>
                  </Link>
                  <button className="btn btn-sm btn-ghost text-faint" aria-label={"Delete " + p.name} onClick={async () => {
                    if (!confirm(`Delete “${p.name}”? This can't be undone.`)) return;
                    await deleteProject(p.id, me?.uid || null); setProjects((x) => (x || []).filter((y) => y.id !== p.id));
                  }}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      {signIn !== null && <SignInDialog why={signIn || undefined} onClose={() => setSignIn(null)} />}
    </div>
  );
}
