import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { workspaceEvents } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ events: [] });
  const db = await getDb();
  const events = await db.select().from(workspaceEvents)
    .where(eq(workspaceEvents.ownerEmail, user.email))
    .orderBy(desc(workspaceEvents.updatedAt), desc(workspaceEvents.id)).limit(100);
  return Response.json({ events });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "需要使用 ChatGPT 身份登录。" }, { status: 401 });
  const payload = await request.json() as { symbol?: string; source?: string; reason?: string };
  const symbol = String(payload.symbol ?? "").trim().toUpperCase();
  const reason = String(payload.reason ?? "").trim();
  if (!/^[A-Z0-9.-]{1,12}$/.test(symbol) || !reason) {
    return Response.json({ error: "标的和关注理由不能为空。" }, { status: 400 });
  }
  const db = await getDb();
  const [event] = await db.insert(workspaceEvents).values({
    ownerEmail: user.email, channel: "WEB", eventKey: crypto.randomUUID(), symbol, symbolsJson: JSON.stringify([symbol]), eventType: "WATCHLIST_ADD",
    suggestedArea: "选股", workflowStatus: "CONFIRMED", requiresConfirmation: false,
    rawText: reason, source: String(payload.source ?? "网页工作区").trim(),
    originalReason: reason, currentReason: reason, triggerScore: 100,
  }).returning();
  return Response.json({ event }, { status: 201 });
}
