CREATE TABLE `character` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_char` text NOT NULL,
	`name` text NOT NULL,
	`en_name` text NOT NULL,
	`avatar` text,
	`property` text DEFAULT 'fire' NOT NULL,
	`attack_way` text DEFAULT 'front' NOT NULL,
	`knock_back_direction` integer DEFAULT 0 NOT NULL,
	`atk` integer,
	`matk` integer,
	`def` integer,
	`mres` integer,
	`hp` integer,
	`crit_rate` integer,
	`crit_dmg` integer,
	`deleted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`knock_back_direction`) REFERENCES `knock_back_direction`(`id`) ON UPDATE no action ON DELETE no action
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
	`chain` integer,
	`character_id` integer NOT NULL,
	`skill` text DEFAULT '{"0":{"skillDescription":"","sp":0,"cd":0,"chain":0},"1":{"skillDescription":"","sp":0,"cd":0,"chain":0},"2":{"skillDescription":"","sp":0,"cd":0,"chain":0},"3":{"skillDescription":"","sp":0,"cd":0,"chain":0},"4":{"skillDescription":"","sp":0,"cd":0,"chain":0},"5":{"skillDescription":"","sp":0,"cd":0,"chain":0}}' NOT NULL,
	`skill_range` text DEFAULT '' NOT NULL,
	`skill_potential` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `knock_back_direction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`knock_back_direction` text DEFAULT 'top' NOT NULL,
	`property` text DEFAULT 'fire' NOT NULL,
	`image` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
