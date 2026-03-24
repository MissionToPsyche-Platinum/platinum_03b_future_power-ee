ALTER TABLE `costBenefitScenarios` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `costBenefitScenarios` ADD `createdBy` varchar(255);--> statement-breakpoint
ALTER TABLE `costBenefitScenarios` ADD `lastModifiedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `costBenefitScenarios` ADD `lastModifiedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `sizingScenarios` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `sizingScenarios` ADD `createdBy` varchar(255);--> statement-breakpoint
ALTER TABLE `sizingScenarios` ADD `lastModifiedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `sizingScenarios` ADD `lastModifiedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;