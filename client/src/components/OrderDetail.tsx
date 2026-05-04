import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, DollarSign, Users, Clock } from "lucide-react";
import type { Order } from "../types";

interface OrderDetailProps {
  order: Order;
  onClose: () => void;
  onConfirmPayment?: (orderId: number) => void;
  isConfirming?: boolean;
}

export default function OrderDetail({ order, onClose, onConfirmPayment, isConfirming }: OrderDetailProps) {
  const formatCurrency = (value: number | string) => {
    return `$${parseFloat(value.toString()).toFixed(2)}`;
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Order #{order.id}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{order.clientName}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Client Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{order.clientPhone}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{order.clientAddress}</p>
                </div>
              </div>
            </div>
            {order.clientNip && (
              <div>
                <p className="text-sm text-gray-600">NIP (Tax ID)</p>
                <p className="font-medium text-gray-900">{order.clientNip}</p>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="font-medium text-gray-900">{formatDateTime(order.scheduledStartTime)}</p>
                  {order.scheduledEndTime && (
                    <p className="text-sm text-gray-600 mt-1">
                      Until {new Date(order.scheduledEndTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                  order.status === 'paid' ? 'bg-green-100 text-green-800' :
                  order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Cleaners */}
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Assigned Cleaners</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                {Array.isArray(order.assignedCleanerIds) ? order.assignedCleanerIds.length : 0} cleaner(s) assigned
              </p>
              <p className="text-xs text-gray-600 mt-1">IDs: {Array.isArray(order.assignedCleanerIds) ? order.assignedCleanerIds.join(', ') : 'N/A'}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Pricing</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Base Price</span>
                <span className="font-medium">{formatCurrency(order.basePriceNetto)}</span>
              </div>
              {parseFloat(order.extraServicesTotal.toString()) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Extra Services</span>
                  <span className="font-medium">{formatCurrency(order.extraServicesTotal)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-gray-700">Total Netto</span>
                <span className="font-medium">{formatCurrency(order.totalNetto)}</span>
              </div>
              {order.hasVat && (
                <div className="flex justify-between">
                  <span className="text-gray-700">VAT (23%)</span>
                  <span className="font-medium text-orange-600">{formatCurrency(order.vatAmount || 0)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between bg-white -mx-4 -mb-4 px-4 py-2 rounded-b">
                <span className="font-semibold text-gray-900">Total Brutto</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(order.totalBrutto)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Method</p>
                <p className="font-medium text-gray-900 capitalize">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                  {order.isPaid ? 'Paid' : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{order.notes}</p>
            </div>
          )}

          {/* Action Button */}
          {!order.isPaid && onConfirmPayment && (
            <Button
              onClick={() => onConfirmPayment(order.id)}
              disabled={isConfirming}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isConfirming ? 'Confirming Payment...' : 'Confirm Payment'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
