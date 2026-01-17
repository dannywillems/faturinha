// Currency codes following ISO 4217
export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'BRL'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'CNY'
  | 'INR'
  | 'MXN'
  | 'KRW'
  | 'SGD'
  | 'HKD'
  | 'NOK'
  | 'SEK'
  | 'DKK'
  | 'NZD'
  | 'ZAR'
  | 'RUB'
  | 'PLN'
  | 'THB'
  | 'IDR'
  | 'MYR'
  | 'PHP'
  | 'CZK'
  | 'ILS'
  | 'CLP'
  | 'AED'
  | 'COP'
  | 'SAR'
  | 'TWD'
  | 'ARS'
  | 'EGP'
  | 'VND'
  | 'TRY'
  | 'NGN'
  | 'PKR'
  | 'BDT';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Client {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  vatNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number; // Percentage (e.g., 21 for 21%)
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  ledgerId: number; // Reference to InvoiceLedger
  clientId: number;
  items: InvoiceItem[];
  currency: CurrencyCode;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  // Calculated fields stored for efficiency
  subtotal: number;
  taxTotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice ledger for separate numbering sequences per currency/year
// Required for Belgian tax compliance and similar regulations
export interface InvoiceLedger {
  id?: number;
  currency: CurrencyCode;
  year: number;
  prefix: string; // e.g., "EUR-2024-" or "USD-2024-"
  nextValue: number;
  createdAt: Date;
}

export interface Settings {
  id?: number;
  // Business info
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: Address;
  businessVatNumber?: string;
  businessLogo?: string; // Base64 encoded
  // Invoice settings
  defaultCurrency: CurrencyCode;
  defaultTaxRate: number;
  invoiceNumberPrefix: string;
  invoiceNumberNextValue: number;
  defaultPaymentTermsDays: number;
  defaultNotes?: string;
  // Locale
  locale: string;
}

// Default settings
export const DEFAULT_SETTINGS: Omit<Settings, 'id'> = {
  defaultCurrency: 'EUR',
  defaultTaxRate: 0,
  invoiceNumberPrefix: 'INV-',
  invoiceNumberNextValue: 1,
  defaultPaymentTermsDays: 30,
  locale: 'en',
};
