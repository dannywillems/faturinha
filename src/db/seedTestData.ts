import type { AppDatabase } from './index';
import type { Client, Invoice, Settings } from '../types';

// Sample clients for demo mode
const sampleClients: Omit<Client, 'id'>[] = [
  {
    name: 'Acme Corporation',
    email: 'billing@acme.example.com',
    phone: '+1 555-0100',
    address: {
      street: '123 Business Ave',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA',
    },
    vatNumber: 'US123456789',
    notes: 'Enterprise client - Net 30 payment terms',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    name: 'TechStart Solutions',
    email: 'accounts@techstart.example.com',
    phone: '+1 555-0200',
    address: {
      street: '456 Innovation Blvd',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'USA',
    },
    notes: 'Startup client - monthly retainer',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    name: 'Green Energy Ltd',
    email: 'finance@greenenergy.example.com',
    phone: '+44 20 7123 4567',
    address: {
      street: '10 Sustainability Lane',
      city: 'London',
      postalCode: 'EC1A 1BB',
      country: 'United Kingdom',
    },
    vatNumber: 'GB987654321',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    name: 'Nordic Design Studio',
    email: 'hello@nordicdesign.example.com',
    phone: '+46 8 123 456',
    address: {
      street: 'Designgatan 7',
      city: 'Stockholm',
      postalCode: '111 22',
      country: 'Sweden',
    },
    vatNumber: 'SE556677889901',
    notes: 'Design agency - creative projects',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    name: 'Local Coffee Shop',
    email: 'owner@localcoffee.example.com',
    phone: '+1 555-0300',
    address: {
      street: '789 Main Street',
      city: 'Portland',
      state: 'OR',
      postalCode: '97201',
      country: 'USA',
    },
    notes: 'Small business client',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
  },
];

// Sample business settings
const sampleSettings: Omit<Settings, 'id'> = {
  businessName: 'Demo Freelancer',
  businessEmail: 'demo@faturinha.example.com',
  businessPhone: '+1 555-DEMO',
  businessAddress: {
    street: '100 Demo Street',
    city: 'Demo City',
    state: 'DC',
    postalCode: '00000',
    country: 'Demoland',
  },
  businessVatNumber: 'DEMO123456',
  defaultCurrency: 'EUR',
  defaultTaxRate: 21,
  invoiceNumberPrefix: 'DEMO-',
  invoiceNumberNextValue: 1,
  defaultPaymentTermsDays: 30,
  defaultNotes: 'Thank you for your business! Payment is due within 30 days.',
  quoteNumberPrefix: 'QUO-',
  quoteNumberNextValue: 1,
  defaultQuoteValidityDays: 30,
  locale: 'en',
};

export async function seedTestData(db: AppDatabase): Promise<void> {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Add settings
  await db.settings.add(sampleSettings as Settings);

  // Add clients and store their IDs
  const clientIds: number[] = [];
  for (const client of sampleClients) {
    const id = (await db.clients.add(client as Client)) as number;
    clientIds.push(id);
  }

  // Create invoice ledgers
  const eurInvLedgerId = (await db.ledgers.add({
    documentType: 'invoice',
    currency: 'EUR',
    year: currentYear,
    prefix: `INV-EUR-${currentYear}-`,
    nextValue: 8,
    createdAt: now,
  })) as number;

  const usdInvLedgerId = (await db.ledgers.add({
    documentType: 'invoice',
    currency: 'USD',
    year: currentYear,
    prefix: `INV-USD-${currentYear}-`,
    nextValue: 4,
    createdAt: now,
  })) as number;

  const gbpInvLedgerId = (await db.ledgers.add({
    documentType: 'invoice',
    currency: 'GBP',
    year: currentYear,
    prefix: `INV-GBP-${currentYear}-`,
    nextValue: 2,
    createdAt: now,
  })) as number;

  // Create quote ledgers
  const eurQuoLedgerId = (await db.ledgers.add({
    documentType: 'quote',
    currency: 'EUR',
    year: currentYear,
    prefix: `QUO-EUR-${currentYear}-`,
    nextValue: 3,
    createdAt: now,
  })) as number;

  // Sample invoices with various statuses
  const sampleInvoices: Omit<Invoice, 'id'>[] = [
    // Paid invoices
    {
      documentType: 'invoice',
      invoiceNumber: `INV-EUR-${currentYear}-0001`,
      ledgerId: eurInvLedgerId,
      clientId: clientIds[0],
      items: [
        {
          id: 'item1',
          description: 'Website Development',
          quantity: 1,
          unitPrice: 5000,
          taxRate: 21,
        },
        {
          id: 'item2',
          description: 'Hosting Setup',
          quantity: 1,
          unitPrice: 200,
          taxRate: 21,
        },
      ],
      currency: 'EUR',
      status: 'paid',
      issueDate: new Date(currentYear, 0, 15),
      dueDate: new Date(currentYear, 1, 14),
      paidDate: new Date(currentYear, 1, 10),
      subtotal: 5200,
      taxTotal: 1092,
      total: 6292,
      createdAt: new Date(currentYear, 0, 15),
      updatedAt: new Date(currentYear, 1, 10),
    },
    {
      documentType: 'invoice',
      invoiceNumber: `INV-EUR-${currentYear}-0002`,
      ledgerId: eurInvLedgerId,
      clientId: clientIds[1],
      items: [
        {
          id: 'item1',
          description: 'Monthly Retainer - January',
          quantity: 1,
          unitPrice: 2000,
          taxRate: 21,
        },
      ],
      currency: 'EUR',
      status: 'paid',
      issueDate: new Date(currentYear, 0, 31),
      dueDate: new Date(currentYear, 1, 28),
      paidDate: new Date(currentYear, 2, 1),
      subtotal: 2000,
      taxTotal: 420,
      total: 2420,
      createdAt: new Date(currentYear, 0, 31),
      updatedAt: new Date(currentYear, 2, 1),
    },
    // Sent invoices
    {
      documentType: 'invoice',
      invoiceNumber: `INV-EUR-${currentYear}-0003`,
      ledgerId: eurInvLedgerId,
      clientId: clientIds[1],
      items: [
        {
          id: 'item1',
          description: 'Monthly Retainer - February',
          quantity: 1,
          unitPrice: 2000,
          taxRate: 21,
        },
      ],
      currency: 'EUR',
      status: 'sent',
      issueDate: new Date(currentYear, 1, 28),
      dueDate: new Date(currentYear, 2, 30),
      subtotal: 2000,
      taxTotal: 420,
      total: 2420,
      createdAt: new Date(currentYear, 1, 28),
      updatedAt: new Date(currentYear, 1, 28),
    },
    {
      documentType: 'invoice',
      invoiceNumber: `INV-USD-${currentYear}-0001`,
      ledgerId: usdInvLedgerId,
      clientId: clientIds[4],
      items: [
        {
          id: 'item1',
          description: 'Logo Design',
          quantity: 1,
          unitPrice: 800,
          taxRate: 0,
        },
        {
          id: 'item2',
          description: 'Brand Guidelines Document',
          quantity: 1,
          unitPrice: 400,
          taxRate: 0,
        },
      ],
      currency: 'USD',
      status: 'sent',
      issueDate: new Date(currentYear, 2, 1),
      dueDate: new Date(currentYear, 2, 31),
      subtotal: 1200,
      taxTotal: 0,
      total: 1200,
      createdAt: new Date(currentYear, 2, 1),
      updatedAt: new Date(currentYear, 2, 1),
    },
    // Overdue invoice
    {
      documentType: 'invoice',
      invoiceNumber: `INV-EUR-${currentYear}-0004`,
      ledgerId: eurInvLedgerId,
      clientId: clientIds[0],
      items: [
        {
          id: 'item1',
          description: 'Maintenance Package Q1',
          quantity: 1,
          unitPrice: 1500,
          taxRate: 21,
        },
      ],
      currency: 'EUR',
      status: 'overdue',
      issueDate: new Date(currentYear, 0, 1),
      dueDate: new Date(currentYear, 0, 31),
      subtotal: 1500,
      taxTotal: 315,
      total: 1815,
      notes: 'Payment reminder sent on Feb 5',
      createdAt: new Date(currentYear, 0, 1),
      updatedAt: new Date(currentYear, 1, 5),
    },
    // GBP invoice
    {
      documentType: 'invoice',
      invoiceNumber: `INV-GBP-${currentYear}-0001`,
      ledgerId: gbpInvLedgerId,
      clientId: clientIds[2],
      items: [
        {
          id: 'item1',
          description: 'Consulting Services',
          quantity: 8,
          unitPrice: 150,
          taxRate: 20,
        },
      ],
      currency: 'GBP',
      status: 'paid',
      issueDate: new Date(currentYear, 1, 15),
      dueDate: new Date(currentYear, 2, 15),
      paidDate: new Date(currentYear, 2, 10),
      subtotal: 1200,
      taxTotal: 240,
      total: 1440,
      createdAt: new Date(currentYear, 1, 15),
      updatedAt: new Date(currentYear, 2, 10),
    },
    // Draft invoice
    {
      documentType: 'invoice',
      invoiceNumber: `INV-USD-${currentYear}-0002`,
      ledgerId: usdInvLedgerId,
      clientId: clientIds[4],
      items: [
        {
          id: 'item1',
          description: 'Social Media Graphics Package',
          quantity: 10,
          unitPrice: 50,
          taxRate: 0,
        },
      ],
      currency: 'USD',
      status: 'draft',
      issueDate: now,
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      subtotal: 500,
      taxTotal: 0,
      total: 500,
      createdAt: now,
      updatedAt: now,
    },
    // QUOTES
    // Accepted quote (converted to invoice)
    {
      documentType: 'quote',
      invoiceNumber: `QUO-EUR-${currentYear}-0001`,
      ledgerId: eurQuoLedgerId,
      clientId: clientIds[0],
      items: [
        {
          id: 'item1',
          description: 'Website Development',
          quantity: 1,
          unitPrice: 5000,
          taxRate: 21,
        },
        {
          id: 'item2',
          description: 'Hosting Setup',
          quantity: 1,
          unitPrice: 200,
          taxRate: 21,
        },
      ],
      currency: 'EUR',
      status: 'accepted',
      issueDate: new Date(currentYear, 0, 10),
      dueDate: new Date(currentYear, 0, 10), // Not used for quotes
      validUntil: new Date(currentYear, 1, 10),
      subtotal: 5200,
      taxTotal: 1092,
      total: 6292,
      notes: 'Website project proposal',
      createdAt: new Date(currentYear, 0, 10),
      updatedAt: new Date(currentYear, 0, 14),
    },
    // Sent quote (pending response)
    {
      documentType: 'quote',
      invoiceNumber: `QUO-EUR-${currentYear}-0002`,
      ledgerId: eurQuoLedgerId,
      clientId: clientIds[3],
      items: [
        {
          id: 'item1',
          description: 'UI/UX Design Project',
          quantity: 1,
          unitPrice: 3500,
          taxRate: 25,
        },
        {
          id: 'item2',
          description: 'Prototype Development',
          quantity: 1,
          unitPrice: 1500,
          taxRate: 25,
        },
      ],
      currency: 'EUR',
      status: 'sent',
      issueDate: now,
      dueDate: now, // Not used for quotes
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 5000,
      taxTotal: 1250,
      total: 6250,
      notes: 'Design project proposal - awaiting client feedback',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Add all invoices
  for (const invoice of sampleInvoices) {
    await db.invoices.add(invoice as Invoice);
  }
}
