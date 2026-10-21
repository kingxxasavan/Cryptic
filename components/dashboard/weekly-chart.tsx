"use client";

import { useState } from "react";

const BAR = "#b8862f"; // validated vs the dark surface (lightness band, chroma, 3:1 contrast)
const BAR_HOVER = "#d9a441";

/** single series weekly bar chart, hover a bar for its value */
export function WeeklyChart({ title, values, format }: { title: string; values: number[]; format: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 220;
  const pad = { t: 16, r: 8, b: 28, l: 44 };
  const max = Math.max(1, ...values);
  const nice = Math.ceil(max / 4 / 10 ** Math.floor(Math.log10(max / 4 || 1))) * 10 ** Math.floor(Math.log10(max / 4 || 1)) * 4;
  const step = (W - pad.l - pad.r) / values.length;
  const bw = Math.max(4, step - 6);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / nice);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice);

  return (
    <figure className="card p-6">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-faint">Last {values.length} weeks</span>
      </figcaption>
      <div className="relative mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${title}: ${values.map(format).join(", ")}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.06)" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-faint text-[10px]">
                {format(t)}
              </text>
            </g>
          ))}
          {values.map((v, i) => {
            const x = pad.l + i * step + (step - bw) / 2;
            const top = y(v);
            const h = Math.max(0, H - pad.b - top);
            const r = Math.min(4, h, bw / 2);
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {/* hit target bigger than the mark */}
                <rect x={pad.l + i * step} y={pad.t} width={step} height={H - pad.t - pad.b} fill="transparent" />
                {h > 0 && (
                  <path
                    d={`M${x},${H - pad.b} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${H - pad.b} Z`}
                    fill={hover === i ? BAR_HOVER : BAR}
                    className="transition-[fill] duration-150"
                  />
                )}
                {i % 2 === values.length % 2 && (
                  <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="fill-faint text-[10px]">
                    W{i + 1}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="rgb(255 255 255 / 0.14)" />
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-raised px-2.5 py-1.5 text-xs shadow-xl"
            style={{ left: `${((pad.l + hover * step + step / 2) / W) * 100}%`, top: `${(y(values[hover]) / H) * 100}%` }}
          >
            <span className="text-faint">Week {hover + 1}</span> <span className="font-medium text-fg tabular-nums">{format(values[hover])}</span>
          </div>
        )}
      </div>
      <details className="mt-3 text-xs text-faint">
        <summary className="cursor-pointer hover:text-muted">View as table</summary>
        <table className="mt-2 w-full text-left">
          <tbody>
            {values.map((v, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-1">Week {i + 1}</td>
                <td className="py-1 text-right tabular-nums text-muted">{format(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
