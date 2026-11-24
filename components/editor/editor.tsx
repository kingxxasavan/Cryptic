"use client";
// The editor: parts on the left, the 3D view in the middle, the inspector on
// the right (stacked on a phone). Every change goes through history, so undo
// is exact, and saves itself a moment later.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import type { Part, Project, Vec3 } from "@/lib/recipe/types";
import { history, type History } from "@/lib/editor/history";
import { applyChanges } from "@/lib/editor/changes";
import { usePartBuilds } from "@/lib/geometry/client";
import { validateProject } from "@/lib/recipe/validate";
import { saveProject, saveMesh, newId } from "@/lib/store/projects";
import { editWithAI, realisticWithAI } from "@/lib/ai/client";
import { AIPanel, BriefPanel, PartPanel, ResearchPanel, SpecsPanel, type Chat, type Tab } from "./inspector";
import { ShareDialog } from "./share";
import { LIBRARY } from "./library";

const Scene = dynamic(() => import("@/components/viewer/scene").then((m) => m.Scene), { ssr: false, loading: () => <div className="grid h-full place-items-center"><span className="spinner" /></div> });

const TABS: [Tab, string][] = [["part", "Part"], ["ai", "Ask AI"], ["brief", "Brief"], ["specs", "Specs"], ["research", "Research"]];

export function Editor({ initial, readOnly = false }: { initial: Project; readOnly?: boolean }) {
  const [hist, setHist] = useState<History>(() => history(initial));
  const project = hist.present;
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(readOnly ? "specs" : "part");
  const [explode, setExplode] = useState(0);
  const [float, setFloat] = useState(true);
  const [gizmo, setGizmo] = useState<"translate" | "rotate" | null>(null);
  const [fitKey, setFitKey] = useState(0);
  const [chat, setChat] = useState<Chat[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [realBusy, setRealBusy] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [share, setShare] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const lastMerge = useRef<{ key: string; at: number } | null>(null);
  const builds = usePartBuilds(project.parts);
  const sel = project.parts.find((p) => p.id === selected) || null;

  // ---- changes ----------------------------------------------------------------
  const commit = useCallback((next: Project, mergeKey?: string) => {
    if (readOnly) return;
    const v = validateProject(next);
    if (!v.ok) { toast.error(v.errors[0]); return; }
    const stamped = { ...v.project, updatedAt: Date.now() };
    const now = Date.now();
    const merge = mergeKey && lastMerge.current && lastMerge.current.key === mergeKey && now - lastMerge.current.at < 1500;
    lastMerge.current = mergeKey ? { key: mergeKey, at: now } : null;
    setHist((h) => (merge ? h.replace(stamped) : h.push(stamped)));
  }, [readOnly]);

  const updatePart = useCallback((next: Part, done: boolean) => {
    commit({ ...project, parts: project.parts.map((p) => (p.id === next.id ? next : p)) }, done ? undefined : "part:" + next.id);
  }, [commit, project]);

  // ---- saving -----------------------------------------------------------------
  const first = useRef(true);
  useEffect(() => {
    if (readOnly) return;
    if (first.current) { first.current = false; return; }
    setSaveState("saving");
    const t = setTimeout(() => {
      saveProject(project).then(() => setSaveState("saved")).catch((e) => { setSaveState("error"); toast.error((e as Error).message); });
    }, 700);
    return () => clearTimeout(t);
  }, [project, readOnly]);

  // ---- keys ---------------------------------------------------------------------
  useEffect(() => {
    if (readOnly) return;
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); setHist((h) => (e.shiftKey ? h.redo() : h.undo())); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") { e.preventDefault(); setHist((h) => h.redo()); }
      else if (e.key === "Escape") { setSelected(null); setGizmo(null); }
      else if (e.key === "g") setGizmo((g) => (g === "translate" ? null : "translate"));
      else if (e.key === "r") setGizmo((g) => (g === "rotate" ? null : "rotate"));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [readOnly]);

  // ---- AI -----------------------------------------------------------------------
  const ask = async (text: string) => {
    const recent = chat.slice(-6).map((c) => ({ role: c.role, content: c.text }));
    setChat((c) => [...c, { role: "user", text }]);
    setAiBusy(true);
    try {
      const r = await editWithAI({ project, selected, request: text, recent });
      // Re-apply on this side so the result is exactly what the change list says.
      const applied = applyChanges(project, r.changes);
      if ("error" in applied) throw new Error(applied.error);
      // Keep realistic looks the server never saw.
      const keepReal = Object.fromEntries(project.parts.filter((p) => p.realistic).map((p) => [p.id, p.realistic]));
      commit({ ...applied.project, parts: applied.project.parts.map((p) => (keepReal[p.id] ? { ...p, realistic: keepReal[p.id] } : p)) });
      setChat((c) => [...c, { role: "assistant", text: r.message + ` (${r.changes.length} change${r.changes.length === 1 ? "" : "s"}, undo with Ctrl+Z)`, label: r.label }]);
    } catch (e) {
      setChat((c) => [...c, { role: "assistant", text: (e as Error).message, error: true }]);
    }
    setAiBusy(false);
  };

  const realistic = async () => {
    if (!sel) return;
    if (sel.realistic) { updatePart({ ...sel, realistic: { ...sel.realistic, on: !sel.realistic.on } }, true); return; }
    setRealBusy(sel.id);
    try {
      const glb = await realisticWithAI(`${sel.name}, ${sel.material.toLowerCase()}, ${sel.finish}`.slice(0, 77));
      const meshId = newId();
      await saveMesh(meshId, glb);
      const now = project.parts.find((p) => p.id === sel.id);
      if (now) updatePart({ ...now, realistic: { meshId, on: true } }, true);
      toast.success("Realistic look ready. It's approximate; sizes still come from the exact shape.");
    } catch (e) { toast.error((e as Error).message); }
    setRealBusy(null);
  };

  const addPart = (make: (id: string) => Part) => {
    let id = "part_" + (project.parts.length + 1);
    while (project.parts.some((p) => p.id === id)) id += "_";
    const part = make(id);
    commit({ ...project, parts: [...project.parts, part] });
    setSelected(id); setTab("part"); setAddOpen(false);
  };

  const duplicate = () => {
    if (!sel) return;
    let id = sel.id + "_copy";
    while (project.parts.some((p) => p.id === id)) id += "_";
    const copy: Part = { ...JSON.parse(JSON.stringify(sel)), id, name: sel.name + " copy", position: [sel.position[0] + 10, sel.position[1], sel.position[2]] as Vec3 };
    commit({ ...project, parts: [...project.parts, copy] }); setSelected(id);
  };
  const remove = () => {
    if (!sel) return;
    const r = applyChanges(project, [{ op: "remove_part", part: sel.id }]);
    if ("error" in r) { toast.error(r.error); return; }
    commit(r.project); setSelected(null);
  };

  const select = (id: string | null) => { setSelected(id); if (id && !readOnly && tab !== "ai") setTab("part"); };

  const errors = useMemo(() => project.parts.filter((p) => builds[p.id]?.error).length, [project.parts, builds]);
  const building = project.parts.some((p) => builds[p.id]?.busy);

  return (
    <div className="flex h-dvh flex-col">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
        <Link href="/" className="flex items-center gap-2 font-semibold" aria-label="Cryptic Parts home"><span className="grid size-7 place-items-center rounded-lg bg-gold text-sm text-[#17130b]">◆</span><span className="hidden sm:inline">Cryptic Parts</span></Link>
        <span className="mx-1 text-faint">/</span>
        <input className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium outline-none focus:underline sm:max-w-md" value={project.name} disabled={readOnly} aria-label="Project name"
          onChange={(e) => commit({ ...project, name: e.target.value || " " }, "name")} />
        <span className="hidden text-xs text-faint md:inline">{readOnly ? "View only" : saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved" : project.shared ? "Saved · shared" : "Saved in this browser"}</span>
        <span className="flex-1" />
        {!readOnly && <>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setHist((h) => h.undo())} disabled={!hist.canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">↶</button>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setHist((h) => h.redo())} disabled={!hist.canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">↷</button>
          <button className="btn btn-sm" onClick={() => setShare(true)}>Share</button>
        </>}
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(280px,45dvh)_1fr] lg:grid-cols-[240px_1fr_380px] lg:grid-rows-1">
        {/* parts */}
        <aside className="hidden min-h-0 flex-col border-r border-line lg:flex">
          <PartsList project={project} builds={builds} selected={selected} onSelect={select} readOnly={readOnly}
            onToggle={(p) => updatePart({ ...p, visible: !p.visible }, true)} onAdd={() => setAddOpen((o) => !o)} addOpen={addOpen} onAddPick={addPart} />
        </aside>

        {/* view */}
        <section className="relative min-h-0 border-b border-line lg:border-b-0">
          <Scene parts={project.parts} builds={builds} selected={selected} onSelect={select} explode={explode} float={float && !explode}
            gizmo={readOnly ? null : gizmo} onMove={(id, position, rotation) => { const p = project.parts.find((x) => x.id === id); if (p) updatePart({ ...p, position, rotation }, true); }} fitKey={fitKey} />
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end gap-2">
            <div className="pointer-events-auto card flex items-center gap-2 px-3 py-2">
              <label className="text-xs font-medium text-muted" htmlFor="explode">Exploded</label>
              <input id="explode" className="range w-28 sm:w-40" type="range" min={0} max={1.5} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
            </div>
            <div className="pointer-events-auto card flex items-center gap-1 p-1">
              <button className={`btn btn-sm ${float ? "" : "btn-ghost"}`} onClick={() => setFloat((f) => !f)} aria-pressed={float}>Float</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setFitKey((k) => k + 1)}>Fit</button>
              {!readOnly && sel && <>
                <button className={`btn btn-sm ${gizmo === "translate" ? "" : "btn-ghost"}`} onClick={() => setGizmo((g) => (g === "translate" ? null : "translate"))} aria-pressed={gizmo === "translate"} title="Move (G)">Move</button>
                <button className={`btn btn-sm ${gizmo === "rotate" ? "" : "btn-ghost"}`} onClick={() => setGizmo((g) => (g === "rotate" ? null : "rotate"))} aria-pressed={gizmo === "rotate"} title="Rotate (R)">Rotate</button>
              </>}
            </div>
            <span className="flex-1" />
            {(building || errors > 0) && <span className="pointer-events-auto card px-3 py-2 text-xs text-muted">{building ? <><span className="spinner mr-2 align-middle" />Building</> : null}{errors ? <span className="text-bad"> {errors} part{errors === 1 ? "" : "s"} didn&apos;t build</span> : null}</span>}
          </div>
          {/* phone: parts as chips */}
          <div className="scroll-thin absolute inset-x-0 top-0 flex gap-1.5 overflow-x-auto p-2 lg:hidden">
            {project.parts.map((p) => (
              <button key={p.id} className={`chip shrink-0 bg-ink/70 ${p.id === selected ? "border-gold text-fg" : ""}`} onClick={() => select(p.id === selected ? null : p.id)}>
                <span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}
              </button>
            ))}
          </div>
        </section>

        {/* inspector */}
        <aside className="flex min-h-0 flex-col border-l border-line">
          <nav className="scroll-thin flex shrink-0 gap-1 overflow-x-auto border-b border-line p-2" role="tablist">
            {TABS.filter(([t]) => !readOnly || (t !== "ai" && t !== "brief")).map(([t, label]) => (
              <button key={t} role="tab" aria-selected={tab === t} className={`btn btn-sm ${tab === t ? "" : "btn-ghost text-muted"}`} onClick={() => setTab(t)}>{label}</button>
            ))}
          </nav>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "part" && (sel ? (
              <PartPanel key={sel.id} part={sel} project={project} build={builds[sel.id]} readOnly={readOnly} onChange={updatePart} onRealistic={realistic} busyReal={realBusy === sel.id} onDelete={remove} onDuplicate={duplicate} />
            ) : (
              <div className="text-sm text-muted">
                <p>Click a part in the view or the list to see its sizes, material and color.</p>
                <p className="mt-3 text-xs text-faint">{project.parts.length} parts. Drag to orbit, scroll to zoom, right drag to pan. Slide <b>Exploded</b> to pull the parts apart.</p>
              </div>
            ))}
            {tab === "ai" && <AIPanel chat={chat} busy={aiBusy} selectedName={sel?.name || null} onSend={ask} onClearSelection={() => setSelected(null)} />}
            {tab === "brief" && <BriefPanel project={project} readOnly={readOnly} onChange={(p) => commit(p)} />}
            {tab === "specs" && <SpecsPanel project={project} builds={builds} selected={selected} />}
            {tab === "research" && <ResearchPanel project={project} />}
          </div>
        </aside>
      </div>
      {share && <ShareDialog project={project} onClose={() => setShare(false)} onShared={(shared) => commit({ ...project, shared })} />}
      <PrintSheet project={project} builds={builds} />
    </div>
  );
}

function PartsList({ project, builds, selected, onSelect, onToggle, readOnly, onAdd, addOpen, onAddPick }: {
  project: Project; builds: ReturnType<typeof usePartBuilds>; selected: string | null; onSelect: (id: string | null) => void; onToggle: (p: Part) => void; readOnly: boolean;
  onAdd: () => void; addOpen: boolean; onAddPick: (make: (id: string) => Part) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-3 pb-1 pt-3"><span className="label">Parts · {project.parts.length}</span>
        {!readOnly && <button className="btn btn-sm btn-ghost" onClick={onAdd} aria-expanded={addOpen}>+ Add</button>}</div>
      {addOpen && (
        <div className="mx-2 mb-2 grid grid-cols-2 gap-1 rounded-xl border border-line bg-raised p-1.5">
          {LIBRARY.map((l) => <button key={l.name} className="rounded-lg px-2 py-1.5 text-left text-xs hover:bg-hover" onClick={() => onAddPick(l.make)}>{l.name}</button>)}
        </div>
      )}
      <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {project.parts.map((p) => (
          <li key={p.id}>
            <div className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 ${p.id === selected ? "bg-gold/12 text-fg" : "text-muted hover:bg-hover"}`}>
              <button className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm" onClick={() => onSelect(p.id === selected ? null : p.id)}>
                <span className="size-3 shrink-0 rounded-full border border-white/10" style={{ background: p.color }} />
                <span className={`truncate ${p.visible ? "" : "opacity-40"}`}>{p.name}</span>
                {builds[p.id]?.error && <span className="text-xs text-bad" title={builds[p.id]?.error}>!</span>}
              </button>
              <button className="text-xs text-faint opacity-60 hover:opacity-100" onClick={() => onToggle(p)} aria-label={(p.visible ? "Hide " : "Show ") + p.name} disabled={readOnly}>{p.visible ? "Hide" : "Show"}</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function PrintSheet({ project, builds }: { project: Project; builds: ReturnType<typeof usePartBuilds> }) {
  // Only shown when printing (see globals.css @media print).
  const rows = project.parts.map((p) => { const s = builds[p.id]?.solid; return { p, size: s ? [0, 1, 2].map((i) => s.bbox.max[i] - s.bbox.min[i]) : null }; });
  return (
    <div className="print-sheet">
      <h1>{project.name}</h1><p>{project.description}</p>
      <table><thead><tr><th>Part</th><th>Size (mm)</th><th>Material</th><th>Color</th><th>Purpose</th><th>Sizes</th></tr></thead>
        <tbody>{rows.map(({ p, size }) => <tr key={p.id}><td>{p.name}</td><td>{size ? size.map((n) => Math.round(n * 10) / 10).join(" × ") : ""}</td><td>{p.material} ({p.finish})</td><td>{p.color}</td><td>{p.purpose}</td>
          <td>{Object.entries(p.params).map(([k, v]) => `${k} ${v.value}${v.unit === "mm" ? "mm" : ""}${v.source === "researched" ? "*" : ""}`).join(", ")}</td></tr>)}</tbody></table>
      <p>* researched size. Made with Cryptic Parts.</p>
    </div>
  );
}
