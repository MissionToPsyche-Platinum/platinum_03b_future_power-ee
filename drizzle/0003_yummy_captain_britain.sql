CREATE TABLE `costBenefitScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`avgPower` int NOT NULL,
	`peakPower` int NOT NULL,
	`missionDuration` int NOT NULL,
	`concentrator` varchar(255) NOT NULL,
	`pvCell` varchar(255) NOT NULL,
	`battery` varchar(255) NOT NULL,
	`resultsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `costBenefitScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sizingScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`avgPower` int NOT NULL,
	`peakPower` int NOT NULL,
	`energyMargin` int NOT NULL,
	`minSOC` int NOT NULL,
	`eclipseDuration` int NOT NULL,
	`missionDuration` int NOT NULL,
	`maxMass` int NOT NULL,
	`maxCost` int NOT NULL,
	`concentrator` varchar(255) NOT NULL,
	`pvCell` varchar(255) NOT NULL,
	`battery` varchar(255) NOT NULL,
	`resultsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sizingScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `costBenefitScenarios` ADD CONSTRAINT `costBenefitScenarios_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sizingScenarios` ADD CONSTRAINT `sizingScenarios_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;