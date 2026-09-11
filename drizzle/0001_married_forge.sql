CREATE TABLE `experiment_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`model_id` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`metrics_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `model_configs` ADD `model_version` text DEFAULT 'ab6d-2026.07-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_events` ADD `event_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_events` ADD `external_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_events` ADD `symbols_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_events` ADD `suggested_area` text DEFAULT '待整理' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_events` ADD `workflow_status` text DEFAULT 'INBOX' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_events` ADD `requires_confirmation` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace_events` ADD `occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;