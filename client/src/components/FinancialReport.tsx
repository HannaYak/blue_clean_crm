import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function FinancialReport() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { data: reportData, isLoading } = trpc.financialReports.getByDateRange.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });
  
  const { data: cleanerPayouts = [] } = trpc.financialReports.getCleanerPayouts.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }
  
  const orders = reportData?.orders || [];
  const summary = reportData?.summary || {};
  
  // Group payouts by cleaner
  const payoutsByCleaner = cleanerPayouts.reduce((acc, payout) => {
    if (!acc[payout.cleanerId]) {
      acc[payout.cleanerId] = [];
    }
    acc[payout.cleanerId].push(payout);
    return acc;
  }, {} as Record<number, any[]>);
  
  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${(summary.totalBrutto || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total VAT (23%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              ${(summary.totalVat || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Orders Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Revenue by Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(summary.byPaymentMethod || {}).map(([method, amount]) => (
              <div key={method} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium text-gray-900 capitalize">{method}</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${(amount as number).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cleaner Payouts */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Cleaner Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(payoutsByCleaner).map(([cleanerId, payouts]) => {
              const totalPayout = payouts.reduce((sum, p) => sum + parseFloat(p.payoutAmount.toString()), 0);
              return (
                <div key={cleanerId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-900">Cleaner #{cleanerId}</h4>
                    <span className="text-lg font-bold text-blue-600">
                      ${totalPayout.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {payouts.map((payout, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-600">
                        <span>Order #{payout.orderId}</span>
                        <span>${parseFloat(payout.payoutAmount.toString()).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Paid Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Method</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Netto</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">VAT</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Brutto</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">#{order.id}</td>
                    <td className="py-3 px-4">{order.clientName}</td>
                    <td className="py-3 px-4 capitalize">{order.paymentMethod}</td>
                    <td className="py-3 px-4 text-right">
                      ${parseFloat(order.totalNetto.toString()).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      ${parseFloat((order.vatAmount || 0).toString()).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ${parseFloat(order.totalBrutto.toString()).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
