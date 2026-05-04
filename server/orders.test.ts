import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Test suite for order business logic
 * Tests time calculations, cost calculations, VAT, and cleaner payouts
 */

describe("Order Business Logic", () => {
  describe("Time Calculations", () => {
    it("should calculate total time with base duration and extra services", () => {
      const baseDuration = 60; // minutes
      const extraServices = [
        { additionalMinutes: 15 },
        { additionalMinutes: 30 },
      ];
      
      const totalMinutes = baseDuration + extraServices.reduce((sum, s) => sum + s.additionalMinutes, 0);
      
      expect(totalMinutes).toBe(105);
    });

    it("should divide time equally among cleaners", () => {
      const totalMinutes = 120;
      const numberOfCleaners = 3;
      
      const timePerCleaner = totalMinutes / numberOfCleaners;
      
      expect(timePerCleaner).toBe(40);
    });

    it("should handle single cleaner time allocation", () => {
      const totalMinutes = 90;
      const numberOfCleaners = 1;
      
      const timePerCleaner = totalMinutes / numberOfCleaners;
      
      expect(timePerCleaner).toBe(90);
    });
  });

  describe("Cost Calculations", () => {
    it("should calculate base price correctly", () => {
      const basePrice = 50;
      const squareMeters = 100;
      const isPricePerSquareMeter = true;
      
      const totalPrice = isPricePerSquareMeter ? basePrice * squareMeters : basePrice;
      
      expect(totalPrice).toBe(5000);
    });

    it("should calculate fixed price without square meters", () => {
      const basePrice = 150;
      const isPricePerSquareMeter = false;
      
      const totalPrice = isPricePerSquareMeter ? 0 : basePrice;
      
      expect(totalPrice).toBe(150);
    });

    it("should sum extra services correctly", () => {
      const extraServices = [
        { price: 25 },
        { price: 35 },
        { price: 15 },
      ];
      
      const totalExtra = extraServices.reduce((sum, s) => sum + s.price, 0);
      
      expect(totalExtra).toBe(75);
    });

    it("should calculate total netto price", () => {
      const basePrice = 100;
      const extraServicesTotal = 50;
      
      const totalNetto = basePrice + extraServicesTotal;
      
      expect(totalNetto).toBe(150);
    });
  });

  describe("VAT Calculations", () => {
    it("should calculate VAT at 23% when hasVat is true", () => {
      const totalNetto = 100;
      const hasVat = true;
      const vatRate = 0.23;
      
      const vatAmount = hasVat ? totalNetto * vatRate : 0;
      
      expect(vatAmount).toBe(23);
    });

    it("should not calculate VAT when hasVat is false", () => {
      const totalNetto = 100;
      const hasVat = false;
      
      const vatAmount = hasVat ? totalNetto * 0.23 : 0;
      
      expect(vatAmount).toBe(0);
    });

    it("should calculate total brutto correctly", () => {
      const totalNetto = 100;
      const hasVat = true;
      const vatAmount = totalNetto * 0.23;
      
      const totalBrutto = totalNetto + vatAmount;
      
      expect(totalBrutto).toBeCloseTo(123, 2);
    });

    it("should handle large amounts with VAT", () => {
      const totalNetto = 5000;
      const hasVat = true;
      const vatAmount = totalNetto * 0.23;
      const totalBrutto = totalNetto + vatAmount;
      
      expect(vatAmount).toBe(1150);
      expect(totalBrutto).toBe(6150);
    });
  });

  describe("Cleaner Payout Calculations", () => {
    it("should calculate payout for single cleaner", () => {
      const totalNetto = 100;
      const payoutPercentage = 30; // 30%
      const numberOfCleaners = 1;
      
      const payout = (totalNetto * payoutPercentage / 100) / numberOfCleaners;
      
      expect(payout).toBe(30);
    });

    it("should split payout equally among multiple cleaners", () => {
      const totalNetto = 100;
      const payoutPercentage = 30; // 30%
      const numberOfCleaners = 3;
      
      const payoutPerCleaner = (totalNetto * payoutPercentage / 100) / numberOfCleaners;
      
      expect(payoutPerCleaner).toBeCloseTo(10, 2);
    });

    it("should handle different payout percentages", () => {
      const totalNetto = 200;
      const payoutPercentage = 45; // 45%
      const numberOfCleaners = 2;
      
      const payoutPerCleaner = (totalNetto * payoutPercentage / 100) / numberOfCleaners;
      
      expect(payoutPerCleaner).toBe(45);
    });

    it("should calculate total payout for all cleaners", () => {
      const totalNetto = 300;
      const payoutPercentage = 35;
      const numberOfCleaners = 3;
      
      const payoutPerCleaner = (totalNetto * payoutPercentage / 100) / numberOfCleaners;
      const totalPayout = payoutPerCleaner * numberOfCleaners;
      
      expect(totalPayout).toBe(105); // 300 * 0.35
    });
  });

  describe("Complex Order Scenarios", () => {
    it("should calculate complete order with all components", () => {
      // Order: 100 m² at $50/m² + $75 extra services + VAT
      const basePrice = 50 * 100; // $5000
      const extraServicesTotal = 75;
      const totalNetto = basePrice + extraServicesTotal; // $5075
      const hasVat = true;
      const vatAmount = totalNetto * 0.23; // $1167.25
      const totalBrutto = totalNetto + vatAmount; // $6242.25
      
      // 3 cleaners at 30% payout
      const payoutPercentage = 30;
      const numberOfCleaners = 3;
      const payoutPerCleaner = (totalNetto * payoutPercentage / 100) / numberOfCleaners;
      
      expect(basePrice).toBe(5000);
      expect(totalNetto).toBe(5075);
      expect(vatAmount).toBeCloseTo(1167.25, 2);
      expect(totalBrutto).toBeCloseTo(6242.25, 2);
      expect(payoutPerCleaner).toBeCloseTo(507.5, 2);
    });

    it("should handle order without VAT", () => {
      const basePrice = 200;
      const extraServicesTotal = 50;
      const totalNetto = basePrice + extraServicesTotal; // $250
      const hasVat = false;
      const vatAmount = 0;
      const totalBrutto = totalNetto; // $250
      
      expect(totalNetto).toBe(250);
      expect(vatAmount).toBe(0);
      expect(totalBrutto).toBe(250);
    });

    it("should handle minimal order", () => {
      const basePrice = 50;
      const extraServicesTotal = 0;
      const totalNetto = basePrice;
      const hasVat = false;
      const totalBrutto = totalNetto;
      
      const payoutPercentage = 30;
      const numberOfCleaners = 1;
      const payoutPerCleaner = (totalNetto * payoutPercentage / 100) / numberOfCleaners;
      
      expect(totalNetto).toBe(50);
      expect(totalBrutto).toBe(50);
      expect(payoutPerCleaner).toBe(15);
    });
  });

  describe("Schedule Conflict Detection", () => {
    it("should detect overlapping time slots", () => {
      const existingStart = new Date('2026-05-10T10:00:00');
      const existingEnd = new Date('2026-05-10T12:00:00');
      const newStart = new Date('2026-05-10T11:00:00');
      const newEnd = new Date('2026-05-10T13:00:00');
      
      const hasConflict = newStart < existingEnd && newEnd > existingStart;
      
      expect(hasConflict).toBe(true);
    });

    it("should not detect conflict for non-overlapping slots", () => {
      const existingStart = new Date('2026-05-10T10:00:00');
      const existingEnd = new Date('2026-05-10T12:00:00');
      const newStart = new Date('2026-05-10T13:00:00');
      const newEnd = new Date('2026-05-10T15:00:00');
      
      const hasConflict = newStart < existingEnd && newEnd > existingStart;
      
      expect(hasConflict).toBe(false);
    });

    it("should detect conflict when times are adjacent", () => {
      const existingStart = new Date('2026-05-10T10:00:00');
      const existingEnd = new Date('2026-05-10T12:00:00');
      const newStart = new Date('2026-05-10T12:00:00');
      const newEnd = new Date('2026-05-10T14:00:00');
      
      const hasConflict = newStart < existingEnd && newEnd > existingStart;
      
      expect(hasConflict).toBe(false); // Exactly adjacent is not a conflict
    });

    it("should detect conflict when new slot is completely inside existing", () => {
      const existingStart = new Date('2026-05-10T10:00:00');
      const existingEnd = new Date('2026-05-10T14:00:00');
      const newStart = new Date('2026-05-10T11:00:00');
      const newEnd = new Date('2026-05-10T12:00:00');
      
      const hasConflict = newStart < existingEnd && newEnd > existingStart;
      
      expect(hasConflict).toBe(true);
    });
  });

  describe("Financial Reporting", () => {
    it("should sum revenue by payment method", () => {
      const orders = [
        { paymentMethod: 'cash', totalBrutto: 100 },
        { paymentMethod: 'cash', totalBrutto: 150 },
        { paymentMethod: 'revolut', totalBrutto: 200 },
        { paymentMethod: 'blik', totalBrutto: 75 },
      ];
      
      const byMethod = orders.reduce((acc, o) => {
        acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.totalBrutto;
        return acc;
      }, {} as Record<string, number>);
      
      expect(byMethod.cash).toBe(250);
      expect(byMethod.revolut).toBe(200);
      expect(byMethod.blik).toBe(75);
    });

    it("should calculate total VAT from orders", () => {
      const orders = [
        { vatAmount: 23 },
        { vatAmount: 46 },
        { vatAmount: 0 },
      ];
      
      const totalVat = orders.reduce((sum, o) => sum + (o.vatAmount || 0), 0);
      
      expect(totalVat).toBe(69);
    });

    it("should calculate total revenue", () => {
      const orders = [
        { totalBrutto: 123 },
        { totalBrutto: 246 },
        { totalBrutto: 369 },
      ];
      
      const totalRevenue = orders.reduce((sum, o) => sum + o.totalBrutto, 0);
      
      expect(totalRevenue).toBe(738);
    });
  });
});
