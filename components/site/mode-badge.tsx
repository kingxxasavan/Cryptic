"use client";

import { useAuth } from "@/components/providers/auth";

export function ModeBadge() {
  const { mode } = useAuth();
  const live = mode === "firebase";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.02] px-3 py-1.5 text-xs text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-ok shadow-[0_0_8px_var(--color-ok)]" : "bg-gold"}`} />
      {live ? "Synced with Firebase" : "Demo mode · saved in this browser"}
    </span>
  );
}
