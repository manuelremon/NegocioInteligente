CREATE TABLE `cash_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `register_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`icon` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`sale_id` integer,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`tax_id` text,
	`credit_limit` real DEFAULT 0 NOT NULL,
	`current_balance` real DEFAULT 0 NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`barcode` text,
	`price_modifier` real DEFAULT 0 NOT NULL,
	`stock` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer,
	`name` text NOT NULL,
	`barcode` text,
	`sku` text,
	`base_price` real DEFAULT 0 NOT NULL,
	`cost_price` real DEFAULT 0 NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`track_inventory` integer DEFAULT true NOT NULL,
	`stock` real DEFAULT 0 NOT NULL,
	`min_stock` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `register_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opened_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`closed_at` text,
	`opening_float` real DEFAULT 0 NOT NULL,
	`closing_float` real,
	`expected_float` real,
	`cash_sales` real DEFAULT 0 NOT NULL,
	`card_sales` real DEFAULT 0 NOT NULL,
	`other_sales` real DEFAULT 0 NOT NULL,
	`refunds` real DEFAULT 0 NOT NULL,
	`cash_in` real DEFAULT 0 NOT NULL,
	`cash_out` real DEFAULT 0 NOT NULL,
	`notes` text,
	`status` text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`variant_id` integer,
	`product_name` text NOT NULL,
	`variant_name` text,
	`quantity` real NOT NULL,
	`unit_price` real NOT NULL,
	`discount_percent` real DEFAULT 0 NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`tax_rate` real DEFAULT 0 NOT NULL,
	`line_total` real NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`customer_id` integer,
	`receipt_number` text NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_total` real DEFAULT 0 NOT NULL,
	`discount_total` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`amount_tendered` real DEFAULT 0 NOT NULL,
	`change` real DEFAULT 0 NOT NULL,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now','localtime')) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `register_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
