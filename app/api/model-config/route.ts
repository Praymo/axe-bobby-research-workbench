import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { modelConfigs } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const templates = new Set(["balanced", "liquidity_stress", "industry_expansion", "catalyst_window", "valuation_repair"]);

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ active: null, history: [] }, { status: 200 });
  const db = await getDb();
  const history = await db.select().from(modelConfigs)
    .where(eq(modelConfigs.ownerEmail, user.email))
    .orderBy(desc(modelConfigs.createdAt), desc(modelConfigs.id)).limit(30);
  return Response.json({ active: history.find(row => row.status === "ACTIVE") ?? null, history });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "需要使用 ChatGPT 身份登录。" }, { status: 401 });
  const payload = await request.json() as { template?: string; reason?: string };
  const template = String(payload.template ?? "");
  const reason = String(payload.reason ?? "").trim();
  if (!templates.has(template)) return Response.json({ error: "未知权重模板。" }, { status: 400 });
  if (!reason) return Response.json({ error: "确认模板时必须记录理由。" }, { status: 400 });
  const db = await getDb();
  const current = await db.select().from(modelConfigs)
    .where(and(eq(modelConfigs.ownerEmail, user.email), eq(modelConfigs.status, "ACTIVE")));
  if (current.length) {
    await db.update(modelConfigs).set({ status: "RETIRED" })
      .where(and(eq(modelConfigs.ownerEmail, user.email), eq(modelConfigs.status, "ACTIVE")));
  }
  const [created] = await db.insert(modelConfigs).values({ ownerEmail: user.email, template, reason, modelVersion: "ab6d-2026.07-v1" }).returning();
  return Response.json({ active: created }, { status: 201 });
}
