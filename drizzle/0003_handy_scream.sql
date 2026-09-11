CREATE TABLE `insight_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`symbol` text NOT NULL,
	`direction` text DEFAULT 'bullish' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`angle` text DEFAULT '' NOT NULL,
	`insight` text DEFAULT '' NOT NULL,
	`judgment` text DEFAULT '' NOT NULL,
	`confidence` text DEFAULT 'medium' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
