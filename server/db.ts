import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  orders,
  cleaningTypes,
  extraServices,
  orderItems,
  cleanerPayouts,
  calendarEvents,
  notifications,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCleaningTypeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(cleaningTypes).where(eq(cleaningTypes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCleaningTypes() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cleaningTypes);
}

export async function getAllExtraServices() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(extraServices);
}

export async function getExtraServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(extraServices).where(eq(extraServices.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByCleanerId(cleanerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all orders and filter by cleaner ID in assignedCleanerIds
  const allOrders = await db.select().from(orders);
  return allOrders.filter(order => {
    const cleanerIds = Array.isArray(order.assignedCleanerIds) ? order.assignedCleanerIds : [];
    return cleanerIds.includes(cleanerId);
  });
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(orders);
}

export async function getOrdersByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(orders).where(
    and(
      gte(orders.scheduledStartTime, startDate),
      lte(orders.scheduledStartTime, endDate)
    )
  );
}

export async function checkScheduleConflict(
  cleanerId: number,
  startTime: Date,
  endTime: Date,
  excludeOrderId?: number
) {
  const db = await getDb();
  if (!db) return false;
  
  const allOrders = await db.select().from(orders);
  
  for (const order of allOrders) {
    // Skip excluded order
    if (excludeOrderId && order.id === excludeOrderId) continue;
    
    // Skip completed/paid orders
    if (order.status === 'completed' || order.status === 'paid') continue;
    
    // Check if cleaner is assigned
    const cleanerIds = Array.isArray(order.assignedCleanerIds) ? order.assignedCleanerIds : [];
    if (!cleanerIds.includes(cleanerId)) continue;
    
    // Check for time overlap
    const orderStart = new Date(order.scheduledStartTime);
    const orderEnd = new Date(order.scheduledEndTime || orderStart);
    
    if (startTime < orderEnd && endTime > orderStart) {
      return true; // Conflict found
    }
  }
  
  return false;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getCleanerPayouts(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cleanerPayouts).where(eq(cleanerPayouts.orderId, orderId));
}

export async function getCleanerPayoutsByCleanerId(cleanerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cleanerPayouts).where(eq(cleanerPayouts.cleanerId, cleanerId));
}

export async function getFinancialReportByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { orders: [], summary: {} };
  
  const paidOrders = await db.select().from(orders).where(
    and(
      eq(orders.isPaid, true),
      gte(orders.paidAt, startDate),
      lte(orders.paidAt, endDate)
    )
  );
  
  return {
    orders: paidOrders,
    summary: {
      totalBrutto: paidOrders.reduce((sum, o) => sum + (parseFloat(o.totalBrutto.toString()) || 0), 0),
      totalVat: paidOrders.reduce((sum, o) => sum + (parseFloat((o.vatAmount || 0).toString()) || 0), 0),
      byPaymentMethod: paidOrders.reduce((acc, o) => {
        const method = o.paymentMethod;
        acc[method] = (acc[method] || 0) + parseFloat(o.totalBrutto.toString());
        return acc;
      }, {} as Record<string, number>),
    }
  };
}

export async function getCleanerPayoutReport(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const payouts = await db.select().from(cleanerPayouts).where(
    and(
      eq(cleanerPayouts.isPaid, true),
      gte(cleanerPayouts.paidAt, startDate),
      lte(cleanerPayouts.paidAt, endDate)
    )
  );
  
  return payouts;
}

export async function getCalendarEventByOrderAndCleaner(orderId: number, cleanerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(calendarEvents).where(
    and(
      eq(calendarEvents.orderId, orderId),
      eq(calendarEvents.cleanerId, cleanerId)
    )
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getNotificationsByAdminId(adminId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(notifications).where(eq(notifications.adminId, adminId));
}

export async function getAllCleaners() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users).where(eq(users.role, 'cleaner'));
}
