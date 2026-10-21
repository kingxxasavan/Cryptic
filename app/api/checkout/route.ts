import { NextResponse } from "next/server";
import { validateCheckout } from "@/lib/checkout";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const result = validateCheckout(body);
  // small delay so the pay button state reads like a real payment
  await new Promise((r) => setTimeout(r, 700));
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
