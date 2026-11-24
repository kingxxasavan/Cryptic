// GET → whether the AI is set up, and which model it would use first.
import { json } from "@/lib/server/http";
import { candidates, modelLabel, nvidiaReady } from "@/lib/server/nvidia";

export const runtime = "nodejs";

export async function GET() {
  if (!nvidiaReady()) return json({ ready: false, why: "NVIDIA_API_KEY isn't set on the server." });
  const list = await candidates();
  return json({ ready: true, model: list[0] || "", label: list[0] ? modelLabel(list[0]) : "", research: (process.env.TAVILY_API_KEY || "").trim() ? "tavily" : "free" });
}
