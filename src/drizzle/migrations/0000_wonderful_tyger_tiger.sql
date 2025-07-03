CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`age` integer NOT NULL,
	`email` text(255) NOT NULL,
	`userRole` text DEFAULT 'BASIC' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `emailIndex` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniqueNameAndAge` ON `user` (`name`,`age`);--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` text PRIMARY KEY NOT NULL,
	`emailUpdates` integer DEFAULT false NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `userSetting` (
	`id` text PRIMARY KEY NOT NULL,
	`setting` text DEFAULT '{"theme":"system"}' NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text(255) NOT NULL,
	`averageRating` real DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`authorId` text NOT NULL,
	FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `postCategory` (
	`postId` text NOT NULL,
	`categoryId` text NOT NULL,
	PRIMARY KEY(`postId`, `categoryId`),
	FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE cascade ON DELETE cascade
);
