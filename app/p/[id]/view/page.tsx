"use client";
// The embeddable view: just the model, the parts and downloads. Safe in an iframe.
import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { loadProject } from "@/lib/store/projects";
import { usePartBuilds } from "@/lib/geometry/client";
import { FORMATS, download } from "@/components/editor/downloads";
import type { Project } from "@/lib/recipe/types";

const Scene = dynamic(() => import("@/components/viewer/scene").then((m) => m.Scene), { ssr: false });

function View({ project }: { project: Project }) {
  const builds = usePartBuilds(project.parts);
  const [selected, setSelected] = useState<string | null>(null);
  const [explode, setExplode] = useState(0);
  const sel = project.parts.find((p) => p.id === selected);
  return (
    <div className="relative h-dvh">
      <Scene parts={project.parts} builds={builds} selected={selected} onSelect={setSelected} explode={explode} float={!explode} />
      <div className="absolute left-3 top-3 max-w-[70%]">
        <a href={`/p/${project.id}`} target="_blank" rel="noopener noreferrer" className="card block px-3 py-2 text-sm font-semibold hover:bg-hover">{project.name} ↗</a>
        {sel && <div className="card mt-2 px-3 py-2 text-xs"><b>{sel.name}</b> · {sel.material}{sel.purpose ? <div className="mt-1 text-muted">{sel.purpose}</div> : null}</div>}
      </div>
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2">
        <label className="card flex items-center gap-2 px-3 py-2 text-xs text-muted">Exploded<input className="range w-28" type="range" min={0} max={1.5} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} /></label>
        <span className="flex-1" />
        <div className="card flex gap-1 p-1">{FORMATS.slice(0, 3).map((f) => <button key={f.id} className="btn btn-sm btn-ghost" title={f.note} onClick={() => download(project, builds, f.id, selected ? "selected" : "all", selected)}>{f.label}</button>)}</div>
      </div>
      <a href="/" target="_blank" rel="noopener noreferrer" className="absolute right-3 top-3 text-[11px] text-faint hover:text-muted">Made with Cryptic Parts</a>
    </div>
  );
}

export default function Embed({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<{ project: Project } | { error: string } | null>(null);
  useEffect(() => { loadProject(id).then(setState); }, [id]);
  if (!state) return <div className="grid h-dvh place-items-center"><span className="spinner" /></div>;
  if ("error" in state) return <div className="grid h-dvh place-items-center p-4 text-center text-sm text-muted">{state.error}</div>;
  return <View project={state.project} />;
}
