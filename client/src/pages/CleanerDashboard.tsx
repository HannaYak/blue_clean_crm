import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, Clock, CheckCircle, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CleanerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  
  const { data: orders = [], refetch } = trpc.orders.getCleanerOrders.useQuery();
  const completeOrderMutation = trpc.orders.completeOrder.useMutation();
  
  const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'in_progress');
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'paid');

  if (!user || user.role !== 'cleaner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Access denied</p>
        </div>
      </div>
    );
  }

  const handleCompleteOrder = async (orderId: number) => {
    try {
      await completeOrderMutation.mutateAsync({ orderId });
      toast.success('Order marked as completed');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete order');
    }
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Mobile Header */}
      <header className="bg-gradient-to-r from-blue-600 to-sky-500 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Tasks</h1>
              <p className="text-blue-100 text-sm">Blue Clean</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-white hover:bg-blue-700"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* User Info Card */}
        <Card className="bg-white border-blue-200 mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600 text-sm">{user.phone}</p>
              <p className="text-blue-600 font-medium mt-2">
                {activeOrders.length} active {activeOrders.length === 1 ? 'task' : 'tasks'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow">
          <TabsList className="w-full justify-start border-b bg-gray-50 p-0 rounded-none">
            <TabsTrigger value="active" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Orders */}
          <TabsContent value="active" className="p-4 space-y-4">
            {activeOrders.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">No active tasks</p>
              </div>
            ) : (
              activeOrders.map(order => (
                <Card key={order.id} className="border-blue-200 hover:shadow-lg transition">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.clientName}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{order.clientPhone}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Address */}
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.clientAddress}</p>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(order.clientAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline mt-1 inline-block"
                        >
                          Open in Maps
                        </a>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex gap-3">
                      <Clock className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(order.scheduledStartTime)} at {formatTime(order.scheduledStartTime)}
                        </p>
                        {order.scheduledEndTime && (
                          <p className="text-sm text-gray-600">
                            Until {formatTime(order.scheduledEndTime)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Services Checklist */}
                    {order.extraServicesTotal && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900 mb-2">Extra Services</p>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p>✓ Included in this order</p>
                        </div>
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900">Estimated Payout</p>
                      <p className="text-lg font-bold text-green-600">
                        ${(parseFloat(order.totalNetto.toString()) * 0.3 / (Array.isArray(order.assignedCleanerIds) ? order.assignedCleanerIds.length : 1)).toFixed(2)}
                      </p>
                    </div>

                    {/* Complete Button */}
                    <Button
                      onClick={() => handleCompleteOrder(order.id)}
                      disabled={completeOrderMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {completeOrderMutation.isPending ? 'Marking...' : 'Mark as Completed'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Completed Orders */}
          <TabsContent value="completed" className="p-4 space-y-4">
            {completedOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No completed tasks yet</p>
              </div>
            ) : (
              completedOrders.map(order => (
                <Card key={order.id} className="border-gray-200 opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-gray-700">{order.clientName}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{order.clientPhone}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{order.clientAddress}</p>
                    </div>
                    <div className="flex gap-3">
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        {formatDate(order.scheduledStartTime)} at {formatTime(order.scheduledStartTime)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
