import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Order } from "../types";

interface OrderCalendarProps {
  orders: Order[];
}

export default function OrderCalendar({ orders }: OrderCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);
  
  const getOrdersForDate = (day: number) => {
    return orders.filter(order => {
      const orderDate = new Date(order.scheduledStartTime);
      return (
        orderDate.getDate() === day &&
        orderDate.getMonth() === currentDate.getMonth() &&
        orderDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };
  
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };
  
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{monthName}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty days */}
          {emptyDays.map(i => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          
          {/* Days with orders */}
          {days.map(day => {
            const dayOrders = getOrdersForDate(day);
            return (
              <div
                key={day}
                className="aspect-square border border-gray-200 rounded-lg p-2 hover:bg-blue-50 transition"
              >
                <p className="text-sm font-semibold text-gray-900 mb-1">{day}</p>
                <div className="space-y-1">
                  {dayOrders.slice(0, 2).map(order => (
                    <div
                      key={order.id}
                      className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate"
                      title={order.clientName}
                    >
                      {order.clientName}
                    </div>
                  ))}
                  {dayOrders.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayOrders.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
