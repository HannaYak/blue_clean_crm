import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  json,
  datetime
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role-based access control for admin and cleaner roles.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "cleaner"]).default("user").notNull(),
  // For cleaners: default hourly rate percentage (can be overridden per cleaning type)
  defaultPayoutPercentage: decimal("defaultPayoutPercentage", { precision: 5, scale: 2 }).default("30"),
  // For cleaners: available hours (JSON array of time slots)
  availableHours: json("availableHours"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Cleaning types (e.g., "Maintenance", "Post-renovation", "Deep cleaning")
 * Each has a base price and cleaner payout percentage
 */
export const cleaningTypes = mysqlTable("cleaning_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Base price per m² or fixed price
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  // Whether basePrice is per m² (true) or fixed (false)
  isPricePerSquareMeter: boolean("isPricePerSquareMeter").default(false),
  // Percentage of netto price that goes to cleaner
  payoutPercentage: decimal("payoutPercentage", { precision: 5, scale: 2 }).notNull(),
  // Base duration in minutes
  baseDurationMinutes: int("baseDurationMinutes").notNull().default(60),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CleaningType = typeof cleaningTypes.$inferSelect;
export type InsertCleaningType = typeof cleaningTypes.$inferInsert;

/**
 * Extra services (e.g., "Oven", "Fridge", "Windows")
 * Each has a price and additional time
 */
export const extraServices = mysqlTable("extra_services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  // Additional time in minutes
  additionalMinutes: int("additionalMinutes").notNull().default(15),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExtraService = typeof extraServices.$inferSelect;
export type InsertExtraService = typeof extraServices.$inferInsert;

/**
 * Orders (cleaning jobs)
 * Contains client info, assigned cleaners, services, and payment status
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  // Client information
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 20 }).notNull(),
  clientAddress: text("clientAddress").notNull(),
  clientNip: varchar("clientNip", { length: 20 }), // Optional, used for invoicing
  
  // Cleaning details
  cleaningTypeId: int("cleaningTypeId").notNull(),
  squareMeters: decimal("squareMeters", { precision: 8, scale: 2 }), // For per-m² pricing
  
  // Scheduling
  scheduledStartTime: datetime("scheduledStartTime").notNull(),
  scheduledEndTime: datetime("scheduledEndTime"), // Calculated based on services
  
  // Assigned cleaners (JSON array of user IDs)
  assignedCleanerIds: json("assignedCleanerIds").notNull(), // Array<number>
  
  // Pricing
  basePriceNetto: decimal("basePriceNetto", { precision: 10, scale: 2 }).notNull(),
  extraServicesTotal: decimal("extraServicesTotal", { precision: 10, scale: 2 }).default("0"),
  totalNetto: decimal("totalNetto", { precision: 10, scale: 2 }).notNull(),
  hasVat: boolean("hasVat").default(false),
  vatAmount: decimal("vatAmount", { precision: 10, scale: 2 }).default("0"),
  totalBrutto: decimal("totalBrutto", { precision: 10, scale: 2 }).notNull(),
  
  // Payment
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "revolut", "paypal", "blik", "faktura", "crypto"]).notNull(),
  isPaid: boolean("isPaid").default(false),
  paidAt: timestamp("paidAt"),
  
  // Status
  status: mysqlEnum("status", ["new", "in_progress", "completed", "paid"]).default("new").notNull(),
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items (extra services added to an order)
 * Links orders to extra services
 */
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  extraServiceId: int("extraServiceId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  additionalMinutes: int("additionalMinutes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Cleaner payouts per order
 * Tracks how much each cleaner earned from each order
 */
export const cleanerPayouts = mysqlTable("cleaner_payouts", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  cleanerId: int("cleanerId").notNull(),
  // Payout formula: (totalNetto * payoutPercentage) / numberOfCleaners
  payoutAmount: decimal("payoutAmount", { precision: 10, scale: 2 }).notNull(),
  payoutPercentage: decimal("payoutPercentage", { precision: 5, scale: 2 }).notNull(),
  isPaid: boolean("isPaid").default(false),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CleanerPayout = typeof cleanerPayouts.$inferSelect;
export type InsertCleanerPayout = typeof cleanerPayouts.$inferInsert;

/**
 * Google Calendar integration
 * Tracks calendar events created for each cleaner
 */
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  cleanerId: int("cleanerId").notNull(),
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }),
  googleCalendarId: varchar("googleCalendarId", { length: 255 }),
  syncedAt: timestamp("syncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Notifications for admins
 * Tracks when cleaners complete orders
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  orderId: int("orderId").notNull(),
  cleanerId: int("cleanerId").notNull(),
  type: mysqlEnum("type", ["order_completed", "payment_confirmed", "schedule_conflict"]).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
