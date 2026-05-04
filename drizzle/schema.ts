import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  timestamp, 
  decimal, 
  boolean, 
  jsonb, 
  integer,
  pgEnum 
} from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extended with role-based access control for admin and cleaner roles.
 */
// 1. Создаем списки выбора (как в меню)
export const roleEnum = pgEnum("role", ["user", "admin", "cleaner"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "revolut", "paypal", "blik", "faktura", "crypto"]);
export const statusEnum = pgEnum("status", ["new", "in_progress", "completed", "paid"]);
export const notificationTypeEnum = pgEnum("type", ["order_completed", "payment_confirmed", "schedule_conflict"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(), // Исправлено: используем созданный roleEnum[cite: 1]
  // For cleaners: default hourly rate percentage (can be overridden per cleaning type)
  defaultPayoutPercentage: decimal("defaultPayoutPercentage", { precision: 5, scale: 2 }).default("30"),
  // For cleaners: available hours (JSON array of time slots)
  availableHours: jsonb("availableHours"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // Исправлено: удален onUpdateNow[cite: 1]
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Cleaning types (e.g., "Maintenance", "Post-renovation", "Deep cleaning")
 * Each has a base price and cleaner payout percentage
 */


export const cleaningTypes = pgTable("cleaning_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Base price per m² or fixed price
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  // Whether basePrice is per m² (true) or fixed (false)
  isPricePerSquareMeter: boolean("isPricePerSquareMeter").default(false),
  // Percentage of netto price that goes to cleaner
  payoutPercentage: decimal("payoutPercentage", { precision: 5, scale: 2 }).notNull(),
  // Base duration in minutes
  baseDurationMinutes: integer("baseDurationMinutes").notNull().default(60),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // Исправлено: удален onUpdateNow[cite: 1]
});

export type CleaningType = typeof cleaningTypes.$inferSelect;
export type InsertCleaningType = typeof cleaningTypes.$inferInsert;

/**
 * Extra services (e.g., "Oven", "Fridge", "Windows")
 * Each has a price and additional time
 */
export const extraServices = pgTable("extra_services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  // Additional time in minutes
  additionalMinutes: integer("additionalMinutes").notNull().default(15),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // Исправлено: удален onUpdateNow[cite: 1]
});

export type ExtraService = typeof extraServices.$inferSelect;
export type InsertExtraService = typeof extraServices.$inferInsert;

/**
 * Orders (cleaning jobs)
 * Contains client info, assigned cleaners, services, and payment status
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  // Client information
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 20 }).notNull(),
  clientAddress: text("clientAddress").notNull(),
  clientNip: varchar("clientNip", { length: 20 }), // Optional, used for invoicing
  
  // Cleaning details
  cleaningTypeId: integer("cleaningTypeId").notNull(),
  squareMeters: decimal("squareMeters", { precision: 8, scale: 2 }), // For per-m² pricing
  
  // Scheduling
  scheduledStartTime: timestamp("scheduledStartTime").notNull(),
  scheduledEndTime: timestamp("scheduledEndTime"), // Calculated based on services
  
  // Assigned cleaners (JSON array of user IDs)
  assignedCleanerIds: jsonb("assignedCleanerIds").notNull(), // Array<number>
  
  // Pricing
  basePriceNetto: decimal("basePriceNetto", { precision: 10, scale: 2 }).notNull(),
  extraServicesTotal: decimal("extraServicesTotal", { precision: 10, scale: 2 }).default("0"),
  totalNetto: decimal("totalNetto", { precision: 10, scale: 2 }).notNull(),
  hasVat: boolean("hasVat").default(false),
  vatAmount: decimal("vatAmount", { precision: 10, scale: 2 }).default("0"),
  totalBrutto: decimal("totalBrutto", { precision: 10, scale: 2 }).notNull(),
  
  // Payment
  paymentMethod: paymentMethodEnum("paymentMethod").notNull(), // Исправлено: используем созданный enum[cite: 1]
  isPaid: boolean("isPaid").default(false),
  paidAt: timestamp("paidAt"),
  
  // Status
  status: statusEnum("status").default("new").notNull(), // Исправлено: используем созданный enum[cite: 1]
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // Исправлено: удален onUpdateNow[cite: 1]
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items (extra services added to an order)
 * Links orders to extra services
 */
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  extraServiceId: integer("extraServiceId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  additionalMinutes: integer("additionalMinutes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Cleaner payouts per order
 * Tracks how much each cleaner earned from each order
 */
export const cleanerPayouts = pgTable("cleaner_payouts", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  cleanerId: integer("cleanerId").notNull(),
  // Payout formula: (totalNetto * payoutPercentage) / numberOfCleaners
  payoutAmount: decimal("payoutAmount", { precision: 10, scale: 2 }).notNull(),
  payoutPercentage: decimal("payoutPercentage", { precision: 5, scale: 2 }).notNull(),
  isPaid: boolean("isPaid").default(false),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // Исправлено: удален onUpdateNow[cite: 1]
});

export type CleanerPayout = typeof cleanerPayouts.$inferSelect;
export type InsertCleanerPayout = typeof cleanerPayouts.$inferInsert;

/**
 * Google Calendar integration
 * Tracks calendar events created for each cleaner
 */
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull(),
  cleanerId: integer("cleanerId").notNull(),
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }),
  googleCalendarId: varchar("googleCalendarId", { length: 255 }),
  syncedAt: timestamp("syncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // Исправлено: удален onUpdateNow[cite: 1]
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Notifications for admins
 * Tracks when cleaners complete orders
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  adminId: integer("adminId").notNull(),
  orderId: integer("orderId").notNull(),
  cleanerId: integer("cleanerId").notNull(),
  type: notificationTypeEnum("type").notNull(), // Исправлено: используем созданный enum[cite: 1]
  message: text("message"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
