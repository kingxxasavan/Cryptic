import { NextResponse, type NextRequest } from "next/server";
import { PRODUCTS, searchProducts } from "@/lib/catalog";
import { parseSearchParams } from "@/lib/query";

export function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const query = parseSearchParams(raw);
  const items = searchProducts(PRODUCTS, query);
  return NextResponse.json({ query, count: items.length, items }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } });
}
