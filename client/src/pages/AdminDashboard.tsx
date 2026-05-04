import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Users, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import OrderCalendar from "@/components/OrderCalendar";
import OrderForm from "@/components/OrderForm";
import FinancialReport from "@/components/FinancialReport";
import OrderDetail from "@/components/OrderDetail";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("calendar");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  
  const { data: orders = [], refetch: refetchOrders } = trpc.orders.list.useQuery();
  const { data: cleaners = [] } = trpc.cleaners.list.useQuery();
  const confirmPaymentMutation = trpc.orders.confirmPayment.useMutation();
  const selectedOrderData = selectedOrder ? orders.find(o => o.id === selectedOrder) : null;

  const handleConfirmPayment = async (orderId: number) => {
    try {
      await confirmPaymentMutation.mutateAsync({ orderId });
      toast.success('Payment confirmed');
      refetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm payment');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Access denied</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blue Clean CRM</h1>
              <p className="text-gray-600">Admin Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-sky-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Cleaners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-sky-600">{cleaners.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {orders.filter(o => !o.isPaid).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow">
          <TabsList className="w-full justify-start border-b bg-gray-50 p-0 rounded-none">
            <TabsTrigger value="calendar" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
              <Users className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
              <DollarSign className="w-4 h-4" />
              Financial Reports
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Order Calendar</h2>
              <Button
                onClick={() => setShowOrderForm(!showOrderForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {showOrderForm ? 'Hide Form' : 'Create Order'}
              </Button>
            </div>
            
            {showOrderForm && (
              <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <OrderForm onSuccess={() => setShowOrderForm(false)} />
              </div>
            )}
            
            <OrderCalendar orders={orders} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">All Orders</h2>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders yet</p>
              ) : (
                orders.map(order => (
                  <Card
                    key={order.id}
                    className="hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{order.clientName}</CardTitle>
                          <CardDescription>{order.clientAddress}</CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'paid' ? 'bg-green-100 text-green-800' :
                          order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="font-semibold text-gray-900">${parseFloat(order.totalBrutto.toString()).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Payment</p>
                          <p className="font-semibold text-gray-900 capitalize">{order.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cleaners</p>
                          <p className="font-semibold text-gray-900">
                            {Array.isArray(order.assignedCleanerIds) ? order.assignedCleanerIds.length : 0}
                          </p>
                        </div>
                        {!order.isPaid && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmPayment(order.id)}
                            disabled={confirmPaymentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Financial Reports</h2>
            <FinancialReport />
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Detail Modal */}
      {selectedOrderData && (
        <OrderDetail
          order={selectedOrderData}
          onClose={() => setSelectedOrder(null)}
          onConfirmPayment={handleConfirmPayment}
          isConfirming={confirmPaymentMutation.isPending}
        />
      )}
    </div>
  );
}
