import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

const orderSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientPhone: z.string().min(1, "Phone is required"),
  clientAddress: z.string().min(1, "Address is required"),
  clientNip: z.string().optional(),
  cleaningTypeId: z.coerce.number().min(1, "Cleaning type is required"),
  squareMeters: z.string().optional(),
  scheduledStartTime: z.string().min(1, "Start time is required"),
  assignedCleanerIds: z.array(z.number()).min(1, "At least one cleaner is required").max(3, "Maximum 3 cleaners"),
  extraServiceIds: z.array(z.number()).default([]),
  paymentMethod: z.enum(['cash', 'revolut', 'paypal', 'blik', 'faktura', 'crypto']),
  hasVat: z.boolean().default(false),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  onSuccess?: () => void;
}

export default function OrderForm({ onSuccess }: OrderFormProps) {
  const [selectedCleaners, setSelectedCleaners] = useState<number[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      assignedCleanerIds: [],
      extraServiceIds: [],
      hasVat: false,
    }
  });
  
  const { data: cleaningTypes = [] } = trpc.cleaningTypes.list.useQuery();
  const { data: extraServices = [] } = trpc.extraServices.list.useQuery();
  const { data: cleaners = [] } = trpc.cleaners.list.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();
  
  const paymentMethod = watch('paymentMethod');
  const hasVat = watch('hasVat');
  
  const onSubmit = async (data: OrderFormData) => {
    try {
      const startTime = new Date(data.scheduledStartTime);
      // Calculate end time based on cleaning type duration + extra services
      const selectedType = cleaningTypes.find(t => t.id === data.cleaningTypeId);
      const selectedExtras = extraServices.filter(s => data.extraServiceIds.includes(s.id));
      const totalMinutes = (selectedType?.baseDurationMinutes || 60) + 
        selectedExtras.reduce((sum, s) => sum + s.additionalMinutes, 0);
      const endTime = new Date(startTime.getTime() + totalMinutes * 60000);
      
      await createOrderMutation.mutateAsync({
        ...data,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        assignedCleanerIds: selectedCleaners,
        extraServiceIds: selectedServices,
      });
      
      toast.success('Order created successfully');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Client Information</h3>
          
          <div>
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              {...register('clientName')}
              placeholder="John Doe"
              className="mt-1"
            />
            {errors.clientName && <p className="text-red-500 text-sm mt-1">{errors.clientName.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="clientPhone">Phone *</Label>
            <Input
              id="clientPhone"
              {...register('clientPhone')}
              placeholder="+48123456789"
              className="mt-1"
            />
            {errors.clientPhone && <p className="text-red-500 text-sm mt-1">{errors.clientPhone.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="clientAddress">Address *</Label>
            <Input
              id="clientAddress"
              {...register('clientAddress')}
              placeholder="123 Main St, City"
              className="mt-1"
            />
            {errors.clientAddress && <p className="text-red-500 text-sm mt-1">{errors.clientAddress.message}</p>}
          </div>
        </div>

        {/* Cleaning Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Cleaning Details</h3>
          
          <div>
            <Label htmlFor="cleaningTypeId">Cleaning Type *</Label>
            <select
              id="cleaningTypeId"
              {...register('cleaningTypeId')}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a type</option>
              {cleaningTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {errors.cleaningTypeId && <p className="text-red-500 text-sm mt-1">{errors.cleaningTypeId.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="scheduledStartTime">Start Time *</Label>
            <Input
              id="scheduledStartTime"
              type="datetime-local"
              {...register('scheduledStartTime')}
              className="mt-1"
            />
            {errors.scheduledStartTime && <p className="text-red-500 text-sm mt-1">{errors.scheduledStartTime.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="squareMeters">Square Meters</Label>
            <Input
              id="squareMeters"
              type="number"
              step="0.01"
              {...register('squareMeters')}
              placeholder="100"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Cleaners Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Assign Cleaners (1-3) *</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cleaners.map(cleaner => (
            <div key={cleaner.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cleaner-${cleaner.id}`}
                checked={selectedCleaners.includes(cleaner.id)}
                onCheckedChange={(checked) => {
                  if (checked && selectedCleaners.length < 3) {
                    setSelectedCleaners([...selectedCleaners, cleaner.id]);
                  } else if (!checked) {
                    setSelectedCleaners(selectedCleaners.filter(id => id !== cleaner.id));
                  }
                }}
              />
              <Label htmlFor={`cleaner-${cleaner.id}`} className="cursor-pointer">
                {cleaner.name}
              </Label>
            </div>
          ))}
        </div>
        {selectedCleaners.length === 0 && <p className="text-red-500 text-sm">At least one cleaner is required</p>}
      </div>

      {/* Extra Services */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Extra Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {extraServices.map(service => (
            <div key={service.id} className="flex items-center space-x-2">
              <Checkbox
                id={`service-${service.id}`}
                checked={selectedServices.includes(service.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedServices([...selectedServices, service.id]);
                  } else {
                    setSelectedServices(selectedServices.filter(id => id !== service.id));
                  }
                }}
              />
              <Label htmlFor={`service-${service.id}`} className="cursor-pointer">
                {service.name} (+${parseFloat(service.price.toString()).toFixed(2)})
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Payment Details</h3>
          
          <div>
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <select
              id="paymentMethod"
              {...register('paymentMethod')}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="cash">Cash</option>
              <option value="revolut">Revolut</option>
              <option value="paypal">PayPal</option>
              <option value="blik">BLIK</option>
              <option value="faktura">Faktura</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          
          {paymentMethod === 'faktura' && (
            <div>
              <Label htmlFor="clientNip">NIP (Tax ID)</Label>
              <Input
                id="clientNip"
                {...register('clientNip')}
                placeholder="1234567890"
                className="mt-1"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasVat"
              {...register('hasVat')}
            />
            <Label htmlFor="hasVat" className="cursor-pointer">
              Include VAT (23%)
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Additional Info</h3>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Any special instructions..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || createOrderMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting || createOrderMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Order'
          )}
        </Button>
      </div>
    </form>
  );
}
