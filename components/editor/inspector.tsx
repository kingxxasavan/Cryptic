"use client";
// The right hand side: the selected part's sizes and look, the AI chat, the
// brief, the spec sheet with downloads, and the research.
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Fact, Finish, Param, Part, Project, Vec3 } from "@/lib/recipe/types";
import type { PartBuild } from "@/lib/geometry/client";
import { MATERIALS } from "@/lib/geometry/measure";
import { specRows } from "@/lib/export/spec";
import type { Msg } from "@/lib/ai/prompts";
import { FORMATS, download, downloadCSV, measuresOf, type Format, type Scope } from "./downloads";

export type Tab = "part" | "ai" | "brief" | "specs" | "research";

const fmt = (n: number | null | undefined, d = 1) => (n === null || n === undefined ? "—" : (Math.round(n * 10 ** d) / 10 ** d).toLocaleString());
const stepOf = (p: Param) => (p.unit === "count" ? 1 : p.max - p.min <= 20 ? 0.1 : 0.5);

function SizeRow({ name, p, fact, readOnly, onChange }: { name: string; p: Param; fact?: Fact; readOnly?: boolean; onChange: (v: number, done: boolean) => void }) {
  const unit = p.unit === "mm" ? "mm" : p.unit === "deg" ? "°" : "";
  return (
    <div className="py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{name.replace(/_/g, " ")}</span>
        {p.source === "researched" ? (
          <a className="chip chip-ok" href={fact?.url} target="_blank" rel="noopener noreferrer" title={fact?.text}>researched</a>
        ) : <span className="chip chip-warn" title="The AI's or your own call, not from research">estimated</span>}
        <span className="flex-1" />
        <input aria-label={name} className="input w-20 py-1 text-right font-mono text-xs" type="number" step={stepOf(p)} value={p.value} disabled={readOnly}
          onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) onChange(v, true); }} />
        <span className="w-6 text-xs text-faint">{unit}</span>
      </div>
      {!readOnly && <input className="range mt-1" type="range" min={p.min} max={p.max} step={stepOf(p)} value={Math.min(p.max, Math.max(p.min, p.value))}
        onChange={(e) => onChange(Number(e.target.value), false)} onPointerUp={(e) => onChange(Number((e.target as HTMLInputElement).value), true)} aria-label={name + " slider"} />}
      {p.note && <p className="mt-0.5 text-xs text-faint">{p.note}</p>}
    </div>
  );
}

function Vec({ label, v, onChange, readOnly }: { label: string; v: Vec3; onChange: (v: Vec3) => void; readOnly?: boolean }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div className="grid grid-cols-3 gap-1.5">
        {(["x", "y", "z"] as const).map((a, i) => (
          <label key={a} className="flex items-center gap-1 rounded-lg border border-line-strong bg-surface px-2">
            <span className="text-xs text-faint">{a}</span>
            <input className="w-full bg-transparent py-1.5 text-right font-mono text-xs outline-none" type="number" step={0.5} value={v[i]} disabled={readOnly}
              onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) { const next = [...v] as Vec3; next[i] = n; onChange(next); } }} />
          </label>
        ))}
      </div>
    </div>
  );
}

export function PartPanel({ part, project, build, readOnly, onChange, onRealistic, busyReal, onDelete, onDuplicate }: {
  part: Part; project: Project; build?: PartBuild; readOnly?: boolean;
  onChange: (next: Part, done: boolean) => void; onRealistic: () => void; busyReal: boolean; onDelete: () => void; onDuplicate: () => void;
}) {
  const set = <K extends keyof Part>(k: K, v: Part[K], done = true) => onChange({ ...part, [k]: v }, done);
  const size = build?.solid ? [0, 1, 2].map((i) => build.solid!.bbox.max[i] - build.solid!.bbox.min[i]) : null;
  const facts = Object.fromEntries(project.research.map((f) => [f.id, f]));
  const known = MATERIALS.some((m) => m.name === part.material);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <input className="input text-base font-semibold" value={part.name} disabled={readOnly} aria-label="Part name" onChange={(e) => set("name", e.target.value, false)} onBlur={(e) => set("name", e.target.value.trim() || part.name)} />
      </div>
      {build?.error && <p className="rounded-lg border border-bad/30 bg-bad/10 p-2 text-xs text-bad" role="alert">This shape didn&apos;t build: {build.error}. Showing the last version that did.</p>}
      <div className="grid grid-cols-3 gap-2 text-center">
        {["Width", "Depth", "Height"].map((l, i) => (
          <div key={l} className="rounded-lg border border-line bg-raised p-2"><div className="text-[10px] uppercase tracking-wide text-faint">{l}</div><div className="font-mono text-sm">{size ? fmt(size[i]) : "…"} mm</div></div>
        ))}
      </div>
      {part.purpose || !readOnly ? (
        <label className="field"><span className="label">What it does</span>
          <textarea className="textarea min-h-0" rows={2} value={part.purpose} disabled={readOnly} onChange={(e) => set("purpose", e.target.value, false)} onBlur={(e) => set("purpose", e.target.value)} /></label>
      ) : null}
      {part.attachesTo.length > 0 && (
        <div className="field"><span className="label">Attaches to</span>
          <div className="flex flex-wrap gap-1.5">{part.attachesTo.map((a) => <span key={a} className="chip">{project.parts.find((p) => p.id === a)?.name || a}</span>)}</div></div>
      )}
      <div>
        <div className="label mb-1">Sizes</div>
        {Object.keys(part.params).length === 0 && <p className="text-xs text-faint">This part has no named sizes. Ask the AI to add some.</p>}
        <div className="divide-y divide-line">
          {Object.entries(part.params).map(([k, p]) => (
            <SizeRow key={k} name={k} p={p} fact={p.factId ? facts[p.factId] : undefined} readOnly={readOnly}
              onChange={(v, done) => onChange({ ...part, params: { ...part.params, [k]: { ...p, value: v, source: p.source === "researched" && v !== p.value ? "estimated" : p.source } } }, done)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="field"><span className="label">Material</span>
          <select className="select" value={known ? part.material : "__other"} disabled={readOnly} onChange={(e) => set("material", e.target.value === "__other" ? part.material : e.target.value)}>
            {MATERIALS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            {!known && <option value="__other">{part.material}</option>}
          </select></label>
        <label className="field"><span className="label">Finish</span>
          <select className="select" value={part.finish} disabled={readOnly} onChange={(e) => set("finish", e.target.value as Finish)}>
            {["matte", "satin", "gloss", "metal", "clear"].map((f) => <option key={f} value={f}>{f}</option>)}
          </select></label>
      </div>
      <p className="-mt-2 text-xs text-faint">{MATERIALS.find((m) => m.name === part.material)?.note}</p>
      <label className="field"><span className="label">Color</span>
        <div className="flex items-center gap-2">
          <input type="color" className="h-9 w-12 cursor-pointer rounded-lg border border-line-strong bg-transparent" value={part.color} disabled={readOnly}
            onChange={(e) => set("color", e.target.value, false)} onBlur={(e) => set("color", e.target.value)} aria-label="Color" />
          <input className="input font-mono" value={part.color} disabled={readOnly} onChange={(e) => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) set("color", e.target.value); }} aria-label="Color hex" />
        </div></label>
      <Vec label="Position (mm)" v={part.position} readOnly={readOnly} onChange={(v) => set("position", v)} />
      <Vec label="Rotation (degrees)" v={part.rotation} readOnly={readOnly} onChange={(v) => set("rotation", v)} />
      {!readOnly && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <button className="btn btn-sm" onClick={onRealistic} disabled={busyReal}>
            {busyReal ? <><span className="spinner" />Making it look real…</> : part.realistic ? (part.realistic.on ? "Show exact shape" : "Show realistic look") : "Make it look real"}
          </button>
          <button className="btn btn-sm" onClick={onDuplicate}>Duplicate</button>
          <button className="btn btn-sm btn-danger" onClick={onDelete}>Delete</button>
        </div>
      )}
      {part.realistic?.on && <p className="text-xs text-faint">The realistic look is approximate. Sizes and exports use the exact shape.</p>}
    </div>
  );
}

export interface Chat { role: "user" | "assistant"; text: string; label?: string; error?: boolean }

export function AIPanel({ chat, busy, selectedName, onSend, onClearSelection }: { chat: Chat[]; busy: boolean; selectedName: string | null; onSend: (t: string) => void; onClearSelection: () => void }) {
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const send = () => { const t = text.trim(); if (!t || busy) return; onSend(t); setText(""); setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50); };
  const ideas = selectedName ? [`Make the ${selectedName.toLowerCase()} 10% thinner`, `Round off the edges of the ${selectedName.toLowerCase()}`, `Add two M2 screw holes to the ${selectedName.toLowerCase()}`]
    : ["Add a USB-C charging port to the design", "Make everything printable without supports", "Add a part that holds a 3.7V 150mAh battery"];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-muted">
        {selectedName ? <>Changes go to <span className="chip">{selectedName}</span><button className="underline" onClick={onClearSelection}>whole project instead</button></> : "Changes go to the whole project. Pick a part to change just that one."}
      </div>
      <div className="scroll-thin flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto">
        {!chat.length && <div className="flex flex-col gap-1.5">{ideas.map((i) => <button key={i} className="rounded-lg border border-line px-3 py-2 text-left text-sm text-muted hover:bg-hover" onClick={() => setText(i)}>{i}</button>)}</div>}
        {chat.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-6 self-end rounded-xl bg-gold/15 px-3 py-2 text-sm" : `mr-6 rounded-xl border px-3 py-2 text-sm ${m.error ? "border-bad/40 text-bad" : "border-line bg-raised"}`}>
            {m.text}{m.label && <div className="mt-1 text-[10px] text-faint">{m.label}</div>}
          </div>
        ))}
        {busy && <div className="mr-6 flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm text-muted"><span className="spinner" />Working on it…</div>}
        <div ref={end} />
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea className="textarea min-h-0" rows={2} placeholder="e.g. make the left arm 5 mm longer" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} aria-label="Ask the AI" />
        <button className="btn btn-primary self-end" disabled={busy || !text.trim()} type="submit">Send</button>
      </form>
    </div>
  );
}

export function BriefPanel({ project, readOnly, onChange }: { project: Project; readOnly?: boolean; onChange: (p: Project) => void }) {
  const [brief, setBrief] = useState(project.brief);
  const [desc, setDesc] = useState(project.description);
  return (
    <div className="flex h-full flex-col gap-3">
      <label className="field"><span className="label">What it is</span>
        <textarea className="textarea min-h-0" rows={2} value={desc} disabled={readOnly} onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== project.description && onChange({ ...project, description: desc })} /></label>
      <label className="field flex-1"><span className="label">Brief: brainstorms, plans, constraints, anything the AI should know</span>
        <textarea className="textarea h-full min-h-60 flex-1 font-mono text-xs" value={brief} disabled={readOnly} onChange={(e) => setBrief(e.target.value)}
          onBlur={() => brief !== project.brief && onChange({ ...project, brief })} placeholder="Paste your brainstorming conversations, plans and requirements here." /></label>
      <p className="text-xs text-faint">{brief.length.toLocaleString()} characters. The AI reads this every time it designs or changes something.</p>
    </div>
  );
}

export function SpecsPanel({ project, builds, selected }: { project: Project; builds: Record<string, PartBuild>; selected: string | null }) {
  const rows = specRows(project, measuresOf(builds));
  const [scope, setScope] = useState<Scope>("all");
  const total = rows.reduce((a, r) => a + (r.grams || 0), 0);
  const get = (f: Format) => { const err = download(project, builds, f, scope, selected); if (err) toast.error(err); };
  return (
    <div className="flex flex-col gap-4">
      <div className="card p-3">
        <div className="mb-2 flex items-center gap-2"><span className="label">Download</span><span className="flex-1" />
          <select className="select w-auto py-1 text-xs" value={scope} onChange={(e) => setScope(e.target.value as Scope)} aria-label="What to export">
            <option value="all">Every part</option><option value="visible">Visible parts</option><option value="selected" disabled={!selected}>Selected part</option>
          </select></div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">{FORMATS.map((f) => <button key={f.id} className="btn btn-sm" title={f.note} onClick={() => get(f.id)}>{f.label}</button>)}</div>
        <p className="mt-2 text-xs text-faint">Millimetres. 3MF keeps every part separate with its color; STL works with any slicer.</p>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-sm" onClick={() => downloadCSV(project, builds)}>Spec sheet (CSV)</button>
        <button className="btn btn-sm" onClick={() => window.print()}>Print spec sheet</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-faint"><tr><th className="py-1 pr-2">Part</th><th className="pr-2">W × D × H mm</th><th className="pr-2">Weight</th><th>Material</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="py-1.5 pr-2"><span className="mr-1.5 inline-block size-2.5 rounded-full align-middle" style={{ background: r.color }} />{r.name}</td>
                <td className="pr-2 font-mono">{r.size ? r.size.map((n) => fmt(n)).join(" × ") : "…"}</td>
                <td className="pr-2 font-mono">{r.grams === null ? "—" : fmt(r.grams) + " g"}</td>
                <td>{r.material}<div className="text-faint">{r.finish}</div></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t border-line-strong"><td className="py-1.5 font-semibold">{rows.length} parts</td><td /><td className="font-mono font-semibold">{fmt(total)} g</td><td /></tr></tfoot>
        </table>
      </div>
    </div>
  );
}

export function ResearchPanel({ project }: { project: Project }) {
  if (!project.research.length) return <p className="text-sm text-muted">No research is attached to this project, so every size is marked <span className="chip chip-warn">estimated</span>. Ask the AI to research a part&apos;s real sizes.</p>;
  const uses = (id: string) => project.parts.flatMap((p) => Object.entries(p.params).filter(([, v]) => v.factId === id).map(([k]) => `${p.name}: ${k.replace(/_/g, " ")}`));
  return (
    <ol className="flex flex-col gap-3">
      {project.research.map((f) => (
        <li key={f.id} className="card p-3 text-sm">
          <p>{f.text}</p>
          <a className="mt-1 block truncate text-xs text-iris hover:underline" href={f.url} target="_blank" rel="noopener noreferrer">{f.title || f.url}</a>
          {uses(f.id).length > 0 && <p className="mt-1 text-xs text-faint">Used for {uses(f.id).join(", ")}</p>}
        </li>
      ))}
    </ol>
  );
}

export type { Msg };
