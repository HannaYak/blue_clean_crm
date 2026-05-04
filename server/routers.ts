import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import * as db from "./db";
import { orders, orderItems, cleanerPayouts, calendarEvents, notifications, cleaningTypes as cleaningTypesTable } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";


// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Cleaner-only procedure
const cleanerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'cleaner') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Cleaner access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Cleaning types management
  cleaningTypes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCleaningTypes();
    }),
    
    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getCleaningTypeById(input.id);
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        basePrice: z.string(),
        isPricePerSquareMeter: z.boolean().default(false),
        payoutPercentage: z.string(),
        baseDurationMinutes: z.number().default(60),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        // Placeholder: create cleaning type would be implemented here
        return { success: true };
      }),
  }),

  // Extra services management
  extraServices: router({
    list: publicProcedure.query(async () => {
      return await db.getAllExtraServices();
    }),
    
    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getExtraServiceById(input.id);
    }),
  }),

  // Orders management
  orders: router({
    list: adminProcedure.query(async () => {
      return await db.getAllOrders();
    }),
    
    listByDateRange: adminProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getOrdersByDateRange(input.startDate, input.endDate);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.id);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Cleaners can only see their own orders
        if (ctx.user.role === 'cleaner') {
          const cleanerIds = Array.isArray(order.assignedCleanerIds) ? order.assignedCleanerIds : [];
          if (!cleanerIds.includes(ctx.user.id)) {
            throw new TRPCError({ code: 'FORBIDDEN' });
          }
        }
        
        return order;
      }),
    
    getCleanerOrders: cleanerProcedure.query(async ({ ctx }) => {
      return await db.getOrdersByCleanerId(ctx.user.id);
    }),
    
    create: adminProcedure
      .input(z.object({
        clientName: z.string().min(1),
        clientPhone: z.string().min(1),
        clientAddress: z.string().min(1),
        clientNip: z.string().optional(),
        cleaningTypeId: z.number(),
        squareMeters: z.string().optional(),
        scheduledStartTime: z.date(),
        scheduledEndTime: z.date(),
        assignedCleanerIds: z.array(z.number()).min(1).max(3),
        extraServiceIds: z.array(z.number()).default([]),
        paymentMethod: z.enum(['cash', 'revolut', 'paypal', 'blik', 'faktura', 'crypto']),
        hasVat: z.boolean().default(false),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        // Check for schedule conflicts
        for (const cleanerId of input.assignedCleanerIds) {
          const hasConflict = await db.checkScheduleConflict(
            cleanerId,
            input.scheduledStartTime,
            input.scheduledEndTime
          );
          if (hasConflict) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: `Cleaner ${cleanerId} has a scheduling conflict`,
            });
          }
        }
        
        // Get cleaning type for pricing
        const cleaningType = await db.getCleaningTypeById(input.cleaningTypeId);
        if (!cleaningType) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cleaning type not found' });
        
        // Calculate base price
        let basePriceNetto = parseFloat(cleaningType.basePrice.toString());
        if (cleaningType.isPricePerSquareMeter && input.squareMeters) {
          basePriceNetto = parseFloat(cleaningType.basePrice.toString()) * parseFloat(input.squareMeters);
        }
        
        // Get and sum extra services
        let extraServicesTotal = 0;
        let totalAdditionalMinutes = 0;
        
        for (const serviceId of input.extraServiceIds) {
          const service = await db.getExtraServiceById(serviceId);
          if (service) {
            extraServicesTotal += parseFloat(service.price.toString());
            totalAdditionalMinutes += service.additionalMinutes;
          }
        }
        
        // Calculate totals
        const totalNetto = basePriceNetto + extraServicesTotal;
        const vatAmount = input.hasVat ? totalNetto * 0.23 : 0;
        const totalBrutto = totalNetto + vatAmount;
        
        // Calculate scheduled end time based on duration
        const baseDuration = cleaningType.baseDurationMinutes + totalAdditionalMinutes;
        const scheduledEndTime = new Date(input.scheduledStartTime.getTime() + baseDuration * 60000);
        
        // Create order
        const insertResult = await database.insert(orders).values([{
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientAddress: input.clientAddress,
          clientNip: input.clientNip,
          cleaningTypeId: input.cleaningTypeId,
          squareMeters: input.squareMeters ? parseFloat(input.squareMeters) : undefined,
          scheduledStartTime: input.scheduledStartTime,
          scheduledEndTime: scheduledEndTime,
          assignedCleanerIds: input.assignedCleanerIds,
          basePriceNetto: basePriceNetto,
          extraServicesTotal: extraServicesTotal,
          totalNetto: totalNetto,
          hasVat: input.hasVat,
          vatAmount: vatAmount,
          totalBrutto: totalBrutto,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          status: 'new',
        } as any]);
        
        const orderId = (insertResult as any).insertId;
        
        // Create order items
        for (const serviceId of input.extraServiceIds) {
          const service = await db.getExtraServiceById(serviceId);
          if (service) {
            await database.insert(orderItems).values([{
              orderId: orderId,
              extraServiceId: serviceId,
              price: parseFloat(service.price.toString()),
              additionalMinutes: service.additionalMinutes,
            } as any]);
          }
        }
        
        // Create cleaner payouts
        const payoutPercentage = parseFloat(cleaningType.payoutPercentage.toString());
        const numberOfCleaners = input.assignedCleanerIds.length;
        
        for (const cleanerId of input.assignedCleanerIds) {
          const payoutAmount = (totalNetto * payoutPercentage / 100) / numberOfCleaners;
          
          await database.insert(cleanerPayouts).values([{
            orderId: orderId,
            cleanerId: cleanerId,
            payoutAmount: payoutAmount,
            payoutPercentage: payoutPercentage,
            isPaid: false,
          } as any]);
        }
        
        return { id: orderId, success: true };
      }),
    
    confirmPayment: adminProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Update order as paid
        await database.update(orders)
          .set({
            isPaid: true,
            paidAt: new Date(),
            status: 'paid',
          })
          .where(eq(orders.id, input.orderId));
        
        // Create notification
        const adminId = ctx.user.id;
        const cleanerIds = Array.isArray(order.assignedCleanerIds) ? order.assignedCleanerIds : [];
        
        for (const cleanerId of cleanerIds) {
          await database.insert(notifications).values({
            adminId: adminId,
            orderId: input.orderId,
            cleanerId: cleanerId,
            type: 'payment_confirmed',
            message: `Payment confirmed for order #${input.orderId}`,
          });
        }
        
        return { success: true };
      }),
    
    completeOrder: cleanerProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        const order = await db.getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // Verify cleaner is assigned
        const cleanerIds = Array.isArray(order.assignedCleanerIds) ? order.assignedCleanerIds : [];
        if (!cleanerIds.includes(ctx.user.id)) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        // Update order status
        await database.update(orders)
          .set({ status: 'completed' })
          .where(eq(orders.id, input.orderId));
        
        // Notify admin
        const admins = await db.getAllCleaners(); // Get all admins
        
        return { success: true };
      }),
  }),

  // Financial reporting
  financialReports: router({
    getByDateRange: adminProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getFinancialReportByDateRange(input.startDate, input.endDate);
      }),
    
    getCleanerPayouts: adminProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getCleanerPayoutReport(input.startDate, input.endDate);
      }),
  }),

  // Notifications
  notifications: router({
    list: adminProcedure.query(async ({ ctx }) => {
      return await db.getNotificationsByAdminId(ctx.user.id);
    }),
  }),

  // Cleaners management
  cleaners: router({
    list: adminProcedure.query(async () => {
      return await db.getAllCleaners();
    }),
  }),
});

export type AppRouter = typeof appRouter;
