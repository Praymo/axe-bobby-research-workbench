CREATE TABLE `model_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`template` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`trade_date` text NOT NULL,
	`symbol` text DEFAULT '' NOT NULL,
	`evidence` text DEFAULT '' NOT NULL,
	`discipline` text DEFAULT '' NOT NULL,
	`next_check` text DEFAULT '' NOT NULL,
	`lesson` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspace_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`channel` text DEFAULT 'WEB' NOT NULL,
	`symbol` text NOT NULL,
	`event_type` text NOT NULL,
	`raw_text` text DEFAULT '' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`original_reason` text DEFAULT '' NOT NULL,
	`current_reason` text DEFAULT '' NOT NULL,
	`trigger_score` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
