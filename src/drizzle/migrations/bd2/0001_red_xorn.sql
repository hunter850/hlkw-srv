PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_costume` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_costume` text NOT NULL,
	`costume_name` text NOT NULL,
	`costume_avatar` text,
	`sp` integer,
	`cd` integer,
	`chain` integer,
	`character_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_costume`("id", "id_costume", "costume_name", "costume_avatar", "sp", "cd", "chain", "character_id", "created_at", "updated_at") SELECT "id", "id_costume", "costume_name", "costume_avatar", "sp", "cd", "chain", "character_id", "created_at", "updated_at" FROM `costume`;--> statement-breakpoint
DROP TABLE `costume`;--> statement-breakpoint
ALTER TABLE `__new_costume` RENAME TO `costume`;--> statement-breakpoint
PRAGMA foreign_keys=ON;