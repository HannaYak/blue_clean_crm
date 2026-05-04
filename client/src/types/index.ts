export interface Order {
  id: number;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientNip?: string;
  cleaningTypeId: number;
  squareMeters?: number;
  scheduledStartTime: Date | string;
  scheduledEndTime?: Date | string;
  assignedCleanerIds: number[];
  basePriceNetto: number | string;
  extraServicesTotal: number | string;
  totalNetto: number | string;
  hasVat: boolean;
  vatAmount: number | string;
  totalBrutto: number | string;
  paymentMethod: 'cash' | 'revolut' | 'paypal' | 'blik' | 'faktura' | 'crypto';
  isPaid: boolean;
  paidAt?: Date | string;
  status: 'new' | 'in_progress' | 'completed' | 'paid';
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CleaningType {
  id: number;
  name: string;
  description?: string;
  basePrice: number | string;
  isPricePerSquareMeter: boolean;
  payoutPercentage: number | string;
  baseDurationMinutes: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ExtraService {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  additionalMinutes: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface User {
  id: number;
  openId: string;
  name?: string;
  email?: string;
  phone?: string;
  loginMethod?: string;
  role: 'user' | 'admin' | 'cleaner';
  defaultPayoutPercentage?: number | string;
  availableHours?: any;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}
