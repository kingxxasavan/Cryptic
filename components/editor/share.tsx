"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/lib/recipe/types";
import { shareProject, unshareProject } from "@/lib/store/projects";

export function ShareDialog({ project, onClose, onShared }: { project: Project; onClose: () => void; onShared: (shared: boolean) => void }) {
  const [shared, setShared] = useState(!!project.shared);
  const [busy, setBusy] = useState(false);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = `${origin}/p/${project.id}`;
  const embed = `<iframe src="${origin}/p/${project.id}/view" width="100%" height="480" style="border:0;border-radius:12px" title="${project.name.replace(/"/g, "")} in 3D" allow="fullscreen"></iframe>`;
  const copy = async (text: string, what: string) => { try { await navigator.clipboard.writeText(text); toast.success(what + " copied"); } catch { toast.error("Couldn't copy; select it and copy by hand."); } };
  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      if (on) await shareProject({ ...project, shared: true }); else await unshareProject(project.id);
      setShared(on); onShared(on);
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Share" className="card w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold">Share “{project.name}”</h2>
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-line p-3">
          <input type="checkbox" className="mt-1 accent-[var(--color-gold)]" checked={shared} disabled={busy} onChange={(e) => toggle(e.target.checked)} />
          <span><span className="font-medium">Anyone with the link can view and download</span>{busy && <span className="spinner ml-2 align-middle" />}
            <span className="block text-sm text-muted">They see the 3D model, the spec sheet and every export, and can make their own copy. Only this browser can change it; your edits update the link as you go.</span></span>
        </label>
        {shared && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="field"><span className="label">Link</span>
              <div className="flex gap-2"><input className="input font-mono text-xs" readOnly value={link} onFocus={(e) => e.target.select()} /><button className="btn btn-sm" onClick={() => copy(link, "Link")}>Copy</button></div></div>
            <div className="field"><span className="label">Embed on another site (like Andrew&apos;s parts page)</span>
              <div className="flex gap-2"><textarea className="textarea min-h-0 font-mono text-xs" rows={3} readOnly value={embed} onFocus={(e) => e.target.select()} /><button className="btn btn-sm self-start" onClick={() => copy(embed, "Embed code")}>Copy</button></div></div>
          </div>
        )}
        <div className="mt-6 flex justify-end"><button className="btn" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}
