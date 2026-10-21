import { getCategory, getCreator } from "@/lib/catalog";
import type { Product } from "@/lib/types";

export interface DownloadFile {
  filename: string;
  mime: string;
  content: string;
}

/** builds the file a buyer gets from their library. demo content made from the listing */
export function buildDownload(p: Product): DownloadFile {
  const by = getCreator(p.creatorHandle)?.name ?? p.creatorName ?? "Creator";
  const contents = p.contents.map((c) => `- **${c.title}**: ${c.detail}${c.minutes ? ` (${c.minutes} min)` : ""}`).join("\n");

  if (p.category === "claude-skills") {
    return {
      filename: `${p.slug}-SKILL.md`,
      mime: "text/markdown",
      content: `${p.preview}\n\n## Included files\n\n${contents}\n\n---\nBy ${by} · Licensed to you via Cryptic\n`,
    };
  }

  return {
    filename: `${p.slug}.md`,
    mime: "text/markdown",
    content: `# ${p.title}\n\n> ${p.tagline}\n\n${p.description}\n\n## Contents\n\n${contents}\n\n## Start here\n\n\`\`\`\n${p.preview}\n\`\`\`\n\n---\n${getCategory(p.category)?.name} by ${by} · Licensed to you via Cryptic\n`,
  };
}

export function triggerDownload(f: DownloadFile) {
  const url = URL.createObjectURL(new Blob([f.content], { type: `${f.mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = f.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
