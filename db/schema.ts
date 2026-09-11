import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const modelConfigs = sqliteTable("model_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerEmail: text("owner_email").notNull(),
  template: text("template").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  reason: text("reason").notNull().default(""),
  modelVersion: text("model_version").notNull().default("ab6d-2026.07-v1"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workspaceEvents = sqliteTable("workspace_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerEmail: text("owner_email").notNull(),
  channel: text("channel").notNull().default("WEB"),
  eventKey: text("event_key").notNull().default(""),
  externalId: text("external_id").notNull().default(""),
  symbol: text("symbol").notNull(),
  symbolsJson: text("symbols_json").notNull().default("[]"),
  eventType: text("event_type").notNull(),
  suggestedArea: text("suggested_area").notNull().default("待整理"),
  rawText: text("raw_text").notNull().default(""),
  source: text("source").notNull().default(""),
  originalReason: text("original_reason").notNull().default(""),
  currentReason: text("current_reason").notNull().default(""),
  triggerScore: integer("trigger_score").notNull().default(0),
  status: text("status").notNull().default("ACTIVE"),
  workflowStatus: text("workflow_status").notNull().default("INBOX"),
  requiresConfirmation: integer("requires_confirmation", { mode: "boolean" }).notNull().default(true),
  occurredAt: text("occurred_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const experimentReviews = sqliteTable("experiment_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerEmail: text("owner_email").notNull(),
  modelId: text("model_id").notNull(),
  decision: text("decision").notNull(),
  reason: text("reason").notNull(),
  metricsJson: text("metrics_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const scoreSnapshots = sqliteTable("score_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerEmail: text("owner_email").notNull(),
  operationDay: text("operation_day").notNull(),
  symbol: text("symbol").notNull(),
  modelVersion: text("model_version").notNull(),
  weightTemplate: text("weight_template").notNull(),
  rawScoresJson: text("raw_scores_json").notNull(),
  weightsJson: text("weights_json").notNull(),
  attentionScore: integer("attention_score"),
  positionScore: integer("position_score"),
  eligible: integer("eligible", { mode: "boolean" }).notNull().default(false),
  dataDate: text("data_date").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const researchFiles = sqliteTable("research_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerEmail: text("owner_email").notNull(),
  objectKey: text("object_key").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  symbol: text("symbol").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reviewEntries = sqliteTable("review_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerEmail: text("owner_email").notNull(),
  tradeDate: text("trade_date").notNull(),
  symbol: text("symbol").notNull().default(""),
  evidence: text("evidence").notNull().default(""),
  discipline: text("discipline").notNull().default(""),
  nextCheck: text("next_check").notNull().default(""),
  lesson: text("lesson").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insightEntries = sqliteTable("insight_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerEmail: text("owner_email").notNull(),
  noteKey: text("note_key").notNull().default(""),
  eventKey: text("event_key").notNull().default(""),
  noteDate: text("note_date").notNull().default(""),
  channel: text("channel").notNull().default("WEB"),
  symbol: text("symbol").notNull(),
  direction: text("direction").notNull().default("bullish"),  // bullish | bearish | neutral
  title: text("title").notNull().default(""),
  source: text("source").notNull().default(""),
  angle: text("angle").notNull().default(""),  // e.g. 基本面改善 | 技术突破 | 政策利好 | 资金流向 | 估值修复 | 行业轮动
  insight: text("insight").notNull().default(""),
  judgment: text("judgment").notNull().default(""),
  confidence: text("confidence").notNull().default("medium"),  // high | medium | low
  classificationStatus: text("classification_status").notNull().default("MANUAL"),
  rawText: text("raw_text").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
