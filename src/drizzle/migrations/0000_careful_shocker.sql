CREATE TABLE `hololive_talent` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`en_name` text,
	`live_avatar` text,
	`avatar` text,
	`status` text,
	`youtube_link` text,
	`deleted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `name` ON `hololive_talent` (`name`);