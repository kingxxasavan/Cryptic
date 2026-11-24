"use client";
// A project: the editor when it's yours (or lives in this browser), the
// read only view with downloads when someone shared it with you.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Editor } from "@/components/editor/editor";
import { loadProject, newId, saveProject } from "@/lib/store/projects";
import type { Project } from "@/lib/recipe/types";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [state, setState] = useState<{ project: Project; where: "browser" | "shared" } | { error: string } | null>(null);
  useEffect(() => { loadProject(id).then(setState); }, [id]);
  if (!state) return <div className="grid h-dvh place-items-center"><span className="spinner" /></div>;
  if ("error" in state) return (
    <div className="grid h-dvh place-items-center p-6 text-center"><div><p className="text-lg">{state.error}</p><Link className="btn mt-4" href="/">Back to Cryptic Parts</Link></div></div>
  );
  // Yours when it lives in this browser; a shared link from someone else is view only.
  const mine = state.where === "browser";
  const copy = async () => {
    const p: Project = { ...JSON.parse(JSON.stringify(state.project)), id: newId(), name: state.project.name + " (copy)", shared: false, createdAt: Date.now(), updatedAt: Date.now() };
    await saveProject(p);
    toast.success("Copied. This one's yours to change.");
    router.push("/p/" + p.id);
  };
  return (
    <>
      <Editor key={state.project.id + (mine ? ":edit" : ":view")} initial={state.project} readOnly={!mine} />
      {!mine && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-line-strong bg-raised/95 px-4 py-2 text-sm shadow-xl backdrop-blur">
          <span className="text-muted">Shared with you · view only</span>
          <button className="btn btn-sm btn-primary" onClick={copy}>Make a copy to edit</button>
        </div>
      )}
    </>
  );
}
