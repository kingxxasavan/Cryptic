// A tiny arithmetic language for sizes: numbers, param names, + - * / ( ),
// and min/max. Parsed by hand; nothing is ever passed to eval.

export class ExprError extends Error {}

type Tok = { t: "num"; v: number } | { t: "name"; v: string } | { t: "op"; v: string };

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t") { i++; continue; }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(src.slice(i));
    if (num) { out.push({ t: "num", v: Number(num[0]) }); i += num[0].length; continue; }
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
    if (name) { out.push({ t: "name", v: name[0] }); i += name[0].length; continue; }
    if ("+-*/(),".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
    throw new ExprError(`"${c}" isn't allowed in a size`);
  }
  return out;
}

const FUNCS: Record<string, (...a: number[]) => number> = { min: Math.min, max: Math.max };

export function evalExpr(src: number | string, params: Record<string, number>): number {
  if (typeof src === "number") {
    if (!Number.isFinite(src)) throw new ExprError("not a finite number");
    return src;
  }
  const toks = lex(String(src));
  let pos = 0;
  const peek = () => toks[pos];
  const take = (v?: string) => {
    const t = toks[pos];
    if (!t || (v !== undefined && t.v !== v)) throw new ExprError(`expected ${v ?? "more"} in "${src}"`);
    pos++;
    return t;
  };
  const expr = (): number => {
    let v = term();
    while (peek() && (peek().v === "+" || peek().v === "-")) v = take().v === "+" ? v + term() : v - term();
    return v;
  };
  const term = (): number => {
    let v = unary();
    while (peek() && (peek().v === "*" || peek().v === "/")) {
      if (take().v === "*") v *= unary();
      else {
        const d = unary();
        if (d === 0) throw new ExprError(`division by zero in "${src}"`);
        v /= d;
      }
    }
    return v;
  };
  const unary = (): number => {
    if (peek() && peek().v === "-") { take(); return -unary(); }
    if (peek() && peek().v === "+") { take(); return unary(); }
    return atom();
  };
  const atom = (): number => {
    const t = take();
    if (t.t === "num") return t.v as number;
    if (t.t === "op" && t.v === "(") { const v = expr(); take(")"); return v; }
    if (t.t === "name") {
      const name = t.v as string;
      if (peek() && peek().v === "(") {
        const fn = FUNCS[name];
        if (!fn) throw new ExprError(`unknown function ${name}()`);
        take("(");
        const args = [expr()];
        while (peek() && peek().v === ",") { take(","); args.push(expr()); }
        take(")");
        return fn(...args);
      }
      if (!Object.prototype.hasOwnProperty.call(params, name)) throw new ExprError(`unknown size "${name}"`);
      return params[name];
    }
    throw new ExprError(`unexpected "${t.v}" in "${src}"`);
  };
  const v = expr();
  if (pos !== toks.length) throw new ExprError(`unexpected "${toks[pos].v}" in "${src}"`);
  if (!Number.isFinite(v)) throw new ExprError(`"${src}" isn't a finite number`);
  return v;
}

/** The param names an expression refers to, in order, without repeats. */
export function namesIn(src: number | string): string[] {
  if (typeof src === "number") return [];
  const out: string[] = [];
  let toks: Tok[];
  try { toks = lex(String(src)); } catch { return []; }
  toks.forEach((t, i) => {
    if (t.t === "name" && !(toks[i + 1] && toks[i + 1].v === "(") && !out.includes(t.v as string)) out.push(t.v as string);
  });
  return out;
}
