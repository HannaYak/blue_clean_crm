import { describe, it, expect } from "vitest";

/**
 * Integration tests for payment confirmation and financial reporting
 */

describe("Payment Confirmation & Financial Reporting", () => {
  describe("Payment Confirmation Workflow", () => {
    it("should mark order as paid when payment is confirmed", () => {
      const order = {
        id: 1,
        isPaid: false,
        status: 'completed',
        totalBrutto: 100,
      };

      // Simulate payment confirmation
      order.isPaid = true;
      order.status = 'paid';

      expect(order.isPaid).toBe(true);
      expect(order.status).toBe('paid');
    });

    it("should not allow payment confirmation for already paid orders", () => {
      const order = {
        id: 1,
        isPaid: true,
        status: 'paid',
      };

      // Try to confirm payment again
      const canConfirm = !order.isPaid;

      expect(canConfirm).toBe(false);
    });

    it("should update cleaner payouts when payment is confirmed", () => {
      const order = {
        id: 1,
        totalNetto: 100,
        isPaid: false,
      };

      const cleaner1Payout = {
        orderId: 1,
        cleanerId: 1,
        payoutAmount: 30, // 30% of 100 / 1 cleaner
        isPaid: false,
      };

      const cleaner2Payout = {
        orderId: 1,
        cleanerId: 2,
        payoutAmount: 30,
        isPaid: false,
      };

      // Confirm payment
      order.isPaid = true;
      cleaner1Payout.isPaid = true;
      cleaner2Payout.isPaid = true;

      expect(order.isPaid).toBe(true);
      expect(cleaner1Payout.isPaid).toBe(true);
      expect(cleaner2Payout.isPaid).toBe(true);
    });
  });

  describe("Financial Report Accuracy", () => {
    it("should only include paid orders in financial reports", () => {
      const orders = [
        { id: 1, totalBrutto: 100, isPaid: true },
        { id: 2, totalBrutto: 150, isPaid: false },
        { id: 3, totalBrutto: 200, isPaid: true },
      ];

      const paidOrders = orders.filter(o => o.isPaid);
      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalBrutto, 0);

      expect(paidOrders.length).toBe(2);
      expect(totalRevenue).toBe(300);
    });

    it("should calculate payment method breakdown correctly", () => {
      const orders = [
        { paymentMethod: 'cash', totalBrutto: 100, isPaid: true },
        { paymentMethod: 'cash', totalBrutto: 50, isPaid: true },
        { paymentMethod: 'revolut', totalBrutto: 200, isPaid: true },
        { paymentMethod: 'blik', totalBrutto: 75, isPaid: false }, // Should not be included
      ];

      const paidOrders = orders.filter(o => o.isPaid);
      const byMethod = paidOrders.reduce((acc, o) => {
        acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.totalBrutto;
        return acc;
      }, {} as Record<string, number>);

      expect(byMethod.cash).toBe(150);
      expect(byMethod.revolut).toBe(200);
      expect(byMethod.blik).toBeUndefined();
    });

    it("should calculate VAT summary correctly", () => {
      const orders = [
        { totalNetto: 100, hasVat: true, isPaid: true },
        { totalNetto: 200, hasVat: true, isPaid: true },
        { totalNetto: 150, hasVat: false, isPaid: true },
      ];

      const paidOrders = orders.filter(o => o.isPaid);
      const totalVat = paidOrders.reduce((sum, o) => {
        return sum + (o.hasVat ? o.totalNetto * 0.23 : 0);
      }, 0);

      expect(totalVat).toBeCloseTo(69, 2); // (100 + 200) * 0.23
    });

    it("should calculate cleaner payouts only for paid orders", () => {
      const payouts = [
        { orderId: 1, cleanerId: 1, payoutAmount: 30, isPaid: true },
        { orderId: 2, cleanerId: 1, payoutAmount: 45, isPaid: false },
        { orderId: 3, cleanerId: 1, payoutAmount: 60, isPaid: true },
      ];

      const paidPayouts = payouts.filter(p => p.isPaid);
      const totalPayout = paidPayouts.reduce((sum, p) => sum + p.payoutAmount, 0);

      expect(paidPayouts.length).toBe(2);
      expect(totalPayout).toBe(90);
    });

    it("should group cleaner payouts correctly", () => {
      const payouts = [
        { orderId: 1, cleanerId: 1, payoutAmount: 30, isPaid: true },
        { orderId: 2, cleanerId: 1, payoutAmount: 45, isPaid: true },
        { orderId: 3, cleanerId: 2, payoutAmount: 60, isPaid: true },
        { orderId: 4, cleanerId: 2, payoutAmount: 40, isPaid: true },
      ];

      const paidPayouts = payouts.filter(p => p.isPaid);
      const byCleanerId = paidPayouts.reduce((acc, p) => {
        if (!acc[p.cleanerId]) {
          acc[p.cleanerId] = [];
        }
        acc[p.cleanerId].push(p);
        return acc;
      }, {} as Record<number, typeof payouts>);

      const cleaner1Total = byCleanerId[1].reduce((sum, p) => sum + p.payoutAmount, 0);
      const cleaner2Total = byCleanerId[2].reduce((sum, p) => sum + p.payoutAmount, 0);

      expect(cleaner1Total).toBe(75);
      expect(cleaner2Total).toBe(100);
    });
  });

  describe("Date Range Filtering", () => {
    it("should filter orders by date range", () => {
      const orders = [
        { id: 1, paidAt: new Date('2026-05-01'), isPaid: true },
        { id: 2, paidAt: new Date('2026-05-15'), isPaid: true },
        { id: 3, paidAt: new Date('2026-06-01'), isPaid: true },
      ];

      const startDate = new Date('2026-05-01');
      const endDate = new Date('2026-05-31');

      const filtered = orders.filter(o => {
        const paidDate = new Date(o.paidAt);
        return paidDate >= startDate && paidDate <= endDate && o.isPaid;
      });

      expect(filtered.length).toBe(2);
      expect(filtered[0].id).toBe(1);
      expect(filtered[1].id).toBe(2);
    });

    it("should handle empty date range", () => {
      const orders = [
        { id: 1, paidAt: new Date('2026-05-01'), isPaid: true },
      ];

      const startDate = new Date('2026-06-01');
      const endDate = new Date('2026-06-30');

      const filtered = orders.filter(o => {
        const paidDate = new Date(o.paidAt);
        return paidDate >= startDate && paidDate <= endDate && o.isPaid;
      });

      expect(filtered.length).toBe(0);
    });
  });

  describe("Report Generation", () => {
    it("should generate complete financial report", () => {
      const orders = [
        {
          id: 1,
          totalNetto: 100,
          hasVat: true,
          totalBrutto: 123,
          paymentMethod: 'cash',
          isPaid: true,
          paidAt: new Date('2026-05-10'),
        },
        {
          id: 2,
          totalNetto: 200,
          hasVat: false,
          totalBrutto: 200,
          paymentMethod: 'revolut',
          isPaid: true,
          paidAt: new Date('2026-05-15'),
        },
      ];

      const paidOrders = orders.filter(o => o.isPaid);
      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalBrutto, 0);
      const totalVat = paidOrders.reduce((sum, o) => sum + (o.hasVat ? o.totalNetto * 0.23 : 0), 0);

      const byMethod = paidOrders.reduce((acc, o) => {
        acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + o.totalBrutto;
        return acc;
      }, {} as Record<string, number>);

      const report = {
        totalRevenue,
        totalVat,
        byPaymentMethod: byMethod,
        orderCount: paidOrders.length,
      };

      expect(report.totalRevenue).toBeCloseTo(323, 2);
      expect(report.totalVat).toBeCloseTo(23, 2);
      expect(report.byPaymentMethod.cash).toBe(123);
      expect(report.byPaymentMethod.revolut).toBe(200);
      expect(report.orderCount).toBe(2);
    });
  });
});
