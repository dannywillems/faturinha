import Dexie, { type EntityTable } from 'dexie';
import type { Client, Invoice, InvoiceLedger, Settings, CurrencyCode } from '../types';

const db = new Dexie('FaturinhaDB') as Dexie & {
  clients: EntityTable<Client, 'id'>;
  invoices: EntityTable<Invoice, 'id'>;
  ledgers: EntityTable<InvoiceLedger, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

db.version(1).stores({
  clients: '++id, name, email, createdAt',
  invoices: '++id, invoiceNumber, clientId, status, issueDate, dueDate',
  settings: '++id',
});

// Version 2: Add ledgers table for multi-currency/year invoice numbering
db.version(2).stores({
  clients: '++id, name, email, createdAt',
  invoices: '++id, invoiceNumber, ledgerId, clientId, status, issueDate, dueDate',
  ledgers: '++id, [currency+year], currency, year',
  settings: '++id',
});

// Get or create ledger for a given currency and year
export async function getOrCreateLedger(
  currency: CurrencyCode,
  year: number
): Promise<InvoiceLedger> {
  let ledger = await db.ledgers
    .where({ currency, year })
    .first();

  if (!ledger) {
    const prefix = `${currency}-${year}-`;
    const id = await db.ledgers.add({
      currency,
      year,
      prefix,
      nextValue: 1,
      createdAt: new Date(),
    });
    ledger = await db.ledgers.get(id);
  }

  return ledger!;
}

// Generate next invoice number for a ledger
export async function generateInvoiceNumber(
  currency: CurrencyCode,
  year: number
): Promise<{ ledgerId: number; invoiceNumber: string }> {
  const ledger = await getOrCreateLedger(currency, year);
  const invoiceNumber = `${ledger.prefix}${String(ledger.nextValue).padStart(4, '0')}`;

  await db.ledgers.update(ledger.id!, {
    nextValue: ledger.nextValue + 1,
  });

  return {
    ledgerId: ledger.id!,
    invoiceNumber,
  };
}

export { db };
