import { formatPrice } from "@/lib/format";
import type { CartTotals, Product } from "@/lib/types";
import { Cover } from "@/components/ui/cover";

export function OrderLines({ items, onRemove }: { items: Product[]; onRemove?: (id: string) => void }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((p) => (
        <li key={p.id} className="flex items-center gap-4 py-4">
          <Cover product={p} className="h-14 w-20 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{p.title}</p>
            <p className="truncate text-sm text-faint">{p.tagline}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-medium tabular-nums">{formatPrice(p.priceCents)}</span>
            {onRemove && (
              <button onClick={() => onRemove(p.id)} className="text-xs text-faint hover:text-bad">
                Remove
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TotalsTable({ totals }: { totals: CartTotals }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between text-muted">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(totals.subtotal) === "Free" ? "$0" : formatPrice(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-ok">
          <dt>Discount</dt>
          <dd className="tabular-nums">−{formatPrice(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between text-muted">
        <dt>Fees</dt>
        <dd>$0</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{totals.total === 0 ? "$0" : formatPrice(totals.total)}</dd>
      </div>
    </dl>
  );
}
