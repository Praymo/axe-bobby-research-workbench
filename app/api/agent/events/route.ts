import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { workspaceEvents } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { AgentPayload, normalizeTelegramText, saveAgentEvent } from "../normalization";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ events: [] });
  const db = await getDb();
  const events = await db.select().from(workspaceEvents)
    .where(eq(workspaceEvents.ownerEmail, user.email))
    .orderBy(desc(workspaceEvents.occurredAt), desc(workspaceEvents.id)).limit(200);
  return Response.json({ events });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "需要使用 ChatGPT 身份登录。" }, { status: 401 });
  const payload = await request.json() as AgentPayload;
  if (!payload.event_key) payload.event_key = crypto.randomUUID();
  if (!payload.event_type && payload.raw_text) {
    const normalized = normalizeTelegramText(payload.raw_text);
    payload.event_type = normalized.eventType; payload.suggested_area = normalized.area; payload.symbols = normalized.symbols;
  }
  try {
    const result = await saveAgentEvent(await getDb(), payload, user.email);
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EVENT") return Response.json({ error: "事件字段不完整。" }, { status: 400 });
    throw error;
  }
}
