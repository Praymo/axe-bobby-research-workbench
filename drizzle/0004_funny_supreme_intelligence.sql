ALTER TABLE `insight_entries` ADD `note_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `insight_entries` ADD `event_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `insight_entries` ADD `note_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `insight_entries` ADD `channel` text DEFAULT 'WEB' NOT NULL;--> statement-breakpoint
ALTER TABLE `insight_entries` ADD `classification_status` text DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `insight_entries` ADD `raw_text` text DEFAULT '' NOT NULL;