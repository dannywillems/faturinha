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

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export type DocumentType = 'invoice' | 'quote';

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
  documentType: DocumentType;
  invoiceNumber: string; // Also used for quote numbers (e.g., QUO-2024-0001)
  ledgerId: number; // Reference to InvoiceLedger
  clientId: number;
  items: InvoiceItem[];
  currency: CurrencyCode;
  status: InvoiceStatus | QuoteStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  // Quote-specific fields
  validUntil?: Date; // For quotes: expiration date
  convertedFromQuoteId?: number; // For invoices: reference to original quote
  convertedToInvoiceId?: number; // For quotes: reference to created invoice
  notes?: string;
  // Calculated fields stored for efficiency
  subtotal: number;
  taxTotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice/Quote ledger for separate numbering sequences per currency/year/type
// Required for Belgian tax compliance and similar regulations
export interface InvoiceLedger {
  id?: number;
  documentType: DocumentType;
  currency: CurrencyCode;
  year: number;
  prefix: string; // e.g., "INV-EUR-2024-" or "QUO-USD-2024-"
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
  // Quote settings
  quoteNumberPrefix: string;
  quoteNumberNextValue: number;
  defaultQuoteValidityDays: number;
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
  quoteNumberPrefix: 'QUO-',
  quoteNumberNextValue: 1,
  defaultQuoteValidityDays: 30,
  locale: 'en',
};
