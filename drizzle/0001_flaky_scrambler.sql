CREATE TABLE `simulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`concentrator` varchar(255) NOT NULL,
	`pvCell` varchar(255) NOT NULL,
	`battery` varchar(255) NOT NULL,
	`concentratorArea` int NOT NULL DEFAULT 3,
	`pvArea` int NOT NULL DEFAULT 1,
	`batteryCapacity` int NOT NULL DEFAULT 8000,
	`baseLoad` int NOT NULL DEFAULT 100,
	`durationHours` int NOT NULL DEFAULT 48,
	`yearsOperation` int NOT NULL DEFAULT 0,
	`avgPowerGenerated` int NOT NULL,
	`maxPowerGenerated` int NOT NULL,
	`avgPowerConsumed` int NOT NULL,
	`minBatterySoc` int NOT NULL,
	`maxBatterySoc` int NOT NULL,
	`finalBatterySoc` int NOT NULL,
	`energyGenerated` int NOT NULL,
	`energyConsumed` int NOT NULL,
	`energyBalance` int NOT NULL,
	`systemViable` int NOT NULL DEFAULT 0,
	`resultsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `simulations` ADD CONSTRAINT `simulations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;