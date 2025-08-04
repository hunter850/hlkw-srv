CREATE TABLE `character` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_char` text NOT NULL,
	`name` text NOT NULL,
	`en_name` text NOT NULL,
	`avatar` text,
	`atk` integer,
	`matk` integer,
	`def` integer,
	`mres` integer,
	`hp` integer,
	`crit_rate` integer,
	`crit_dmg` integer,
	`deleted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `name` ON `character` (`name`);--> statement-breakpoint
CREATE TABLE `costume` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_costume` text NOT NULL,
	`costume_name` text NOT NULL,
	`costume_avatar` text,
	`sp` integer,
	`cd` integer,
	`chain` text,
	`character_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE no action
);
