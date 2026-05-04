CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`cleanerId` int NOT NULL,
	`googleCalendarEventId` varchar(255),
	`googleCalendarId` varchar(255),
	`syncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cleaner_payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`cleanerId` int NOT NULL,
	`payoutAmount` decimal(10,2) NOT NULL,
	`payoutPercentage` decimal(5,2) NOT NULL,
	`isPaid` boolean DEFAULT false,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cleaner_payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cleaning_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`basePrice` decimal(10,2) NOT NULL,
	`isPricePerSquareMeter` boolean DEFAULT false,
	`payoutPercentage` decimal(5,2) NOT NULL,
	`baseDurationMinutes` int NOT NULL DEFAULT 60,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cleaning_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `extra_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`additionalMinutes` int NOT NULL DEFAULT 15,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `extra_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`orderId` int NOT NULL,
	`cleanerId` int NOT NULL,
	`type` enum('order_completed','payment_confirmed','schedule_conflict') NOT NULL,
	`message` text,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`extraServiceId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`additionalMinutes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientPhone` varchar(20) NOT NULL,
	`clientAddress` text NOT NULL,
	`clientNip` varchar(20),
	`cleaningTypeId` int NOT NULL,
	`squareMeters` decimal(8,2),
	`scheduledStartTime` datetime NOT NULL,
	`scheduledEndTime` datetime,
	`assignedCleanerIds` json NOT NULL,
	`basePriceNetto` decimal(10,2) NOT NULL,
	`extraServicesTotal` decimal(10,2) DEFAULT '0',
	`totalNetto` decimal(10,2) NOT NULL,
	`hasVat` boolean DEFAULT false,
	`vatAmount` decimal(10,2) DEFAULT '0',
	`totalBrutto` decimal(10,2) NOT NULL,
	`paymentMethod` enum('cash','revolut','paypal','blik','faktura','crypto') NOT NULL,
	`isPaid` boolean DEFAULT false,
	`paidAt` timestamp,
	`status` enum('new','in_progress','completed','paid') NOT NULL DEFAULT 'new',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','cleaner') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `defaultPayoutPercentage` decimal(5,2) DEFAULT '30';--> statement-breakpoint
ALTER TABLE `users` ADD `availableHours` json;