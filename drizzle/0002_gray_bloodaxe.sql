CREATE TABLE `savedConfigurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`concentrator` varchar(255),
	`pvCell` varchar(255) NOT NULL,
	`battery` varchar(255) NOT NULL,
	`concentratorArea` int NOT NULL DEFAULT 3,
	`pvArea` int NOT NULL DEFAULT 1,
	`batteryCapacity` int NOT NULL DEFAULT 8000,
	`baseLoad` int NOT NULL DEFAULT 100,
	`durationHours` int NOT NULL DEFAULT 48,
	`yearsOperation` int NOT NULL DEFAULT 0,
	`lastSimulationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedConfigurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `savedConfigurations` ADD CONSTRAINT `savedConfigurations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedConfigurations` ADD CONSTRAINT `savedConfigurations_lastSimulationId_simulations_id_fk` FOREIGN KEY (`lastSimulationId`) REFERENCES `simulations`(`id`) ON DELETE no action ON UPDATE no action;