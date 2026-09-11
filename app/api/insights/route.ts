import { desc, eq, and, like, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { insightEntries } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ insights: [] });

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.trim() || "";
  const direction = url.searchParams.get("direction")?.trim() || "";
  const angle = url.searchParams.get("angle")?.trim() || "";
  const search = url.searchParams.get("search")?.trim() || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || "100"), 200);

  const db = await getDb();
  const conditions = [eq(insightEntries.ownerEmail, user.email)];
  if (symbol) conditions.push(eq(insightEntries.symbol, symbol.toUpperCase()));
  if (direction) conditions.push(eq(insightEntries.direction, direction));
  if (angle) conditions.push(eq(insightEntries.angle, angle));
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(
      like(insightEntries.title, pattern), like(insightEntries.insight, pattern),
      like(insightEntries.judgment, pattern), like(insightEntries.source, pattern),
    )!);
  }
  const insights = await db.select().from(insightEntries)
    .where(and(...conditions))
    .orderBy(desc(insightEntries.createdAt), desc(insightEntries.id))
    .limit(limit);
  return Response.json({ insights });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "需要使用 ChatGPT 身份登录。" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const direction = String(body.direction ?? "").trim();
  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  const title = String(body.title ?? "").trim();
  const insight = String(body.insight ?? "").trim();
  const judgment = String(body.judgment ?? "").trim();

  if (!["bullish", "bearish", "neutral"].includes(direction)) {
    return Response.json({ error: "方向必须是 bullish / bearish / neutral 之一。" }, { status: 400 });
  }
  if (!symbol) {
    return Response.json({ error: "请输入标的代码。" }, { status: 400 });
  }
  if (!insight && !title) {
    return Response.json({ error: "至少填写标题或洞察内容。" }, { status: 400 });
  }

  const fields = {
    ownerEmail: user.email,
    noteDate: new Date().toISOString().slice(0, 10),
    channel: "WEB",
    symbol,
    direction,
    title,
    source: String(body.source ?? "").trim(),
    angle: String(body.angle ?? "").trim(),
    insight,
    judgment,
    confidence: ["high", "medium", "low"].includes(String(body.confidence ?? "").trim())
      ? String(body.confidence).trim()
      : "medium",
  };

  const db = await getDb();
  const [created] = await db.insert(insightEntries).values(fields).returning();
  return Response.json({ insight: created }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "需要使用 ChatGPT 身份登录。" }, { status: 401 });

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id || id < 1) {
    return Response.json({ error: "需要有效的记录 ID。" }, { status: 400 });
  }

  const db = await getDb();
  await db.delete(insightEntries)
    .where(and(eq(insightEntries.id, id), eq(insightEntries.ownerEmail, user.email)));
  return Response.json({ deleted: id });
}
