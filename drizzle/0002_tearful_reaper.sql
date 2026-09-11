CREATE TABLE `research_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`symbol` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `score_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`operation_day` text NOT NULL,
	`symbol` text NOT NULL,
	`model_version` text NOT NULL,
	`weight_template` text NOT NULL,
	`raw_scores_json` text NOT NULL,
	`weights_json` text NOT NULL,
	`attention_score` integer,
	`position_score` integer,
	`eligible` integer DEFAULT false NOT NULL,
	`data_date` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
