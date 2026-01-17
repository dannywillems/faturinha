import Dexie, { type EntityTable } from 'dexie';
import type {
  Client,
  Invoice,
  InvoiceLedger,
  Settings,
  CurrencyCode,
  DocumentType,
} from '../types';

// Database type exported for use in context
export type AppDatabase = Dexie & {
  clients: EntityTable<Client, 'id'>;
  invoices: EntityTable<Invoice, 'id'>;
  ledgers: EntityTable<InvoiceLedger, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

// Create a database instance with the given name
export function createDatabase(name: string): AppDatabase {
  const database = new Dexie(name) as AppDatabase;

  database.version(1).stores({
    clients: '++id, name, email, createdAt',
    invoices: '++id, invoiceNumber, clientId, status, issueDate, dueDate',
    settings: '++id',
  });

  // Version 2: Add ledgers table for multi-currency/year invoice numbering
  database.version(2).stores({
    clients: '++id, name, email, createdAt',
    invoices: '++id, invoiceNumber, ledgerId, clientId, status, issueDate, dueDate',
    ledgers: '++id, [currency+year], currency, year',
    settings: '++id',
  });

  // Version 3: Add quote support with documentType field
  database.version(3).stores({
    clients: '++id, name, email, createdAt',
    invoices:
      '++id, documentType, invoiceNumber, ledgerId, clientId, status, issueDate, dueDate',
    ledgers: '++id, [documentType+currency+year], documentType, currency, year',
    settings: '++id',
  }).upgrade((trans) => {
    // Migrate existing invoices to have documentType: 'invoice'
    return trans.table('invoices').toCollection().modify((invoice) => {
      if (!invoice.documentType) {
        invoice.documentType = 'invoice';
      }
    });
  });

  return database;
}

// Default database instance (for backward compatibility during migration)
const db = createDatabase('FaturinhaDB');

// Get or create ledger for a given document type, currency and year
export async function getOrCreateLedger(
  database: AppDatabase,
  documentType: DocumentType,
  currency: CurrencyCode,
  year: number
): Promise<InvoiceLedger> {
  let ledger = await database.ledgers
    .where({ documentType, currency, year })
    .first();

  if (!ledger) {
    const typePrefix = documentType === 'quote' ? 'QUO' : 'INV';
    const prefix = `${typePrefix}-${currency}-${year}-`;
    const id = await database.ledgers.add({
      documentType,
      currency,
      year,
      prefix,
      nextValue: 1,
      createdAt: new Date(),
    });
    ledger = await database.ledgers.get(id);
  }

  return ledger!;
}

// Generate next document number for a ledger (invoice or quote)
export async function generateDocumentNumber(
  database: AppDatabase,
  documentType: DocumentType,
  currency: CurrencyCode,
  year: number
): Promise<{ ledgerId: number; documentNumber: string }> {
  const ledger = await getOrCreateLedger(database, documentType, currency, year);
  const documentNumber = `${ledger.prefix}${String(ledger.nextValue).padStart(4, '0')}`;

  await database.ledgers.update(ledger.id!, {
    nextValue: ledger.nextValue + 1,
  });

  return {
    ledgerId: ledger.id!,
    documentNumber,
  };
}

// Generate next invoice number (convenience wrapper)
export async function generateInvoiceNumber(
  database: AppDatabase,
  currency: CurrencyCode,
  year: number
): Promise<{ ledgerId: number; invoiceNumber: string }> {
  const result = await generateDocumentNumber(database, 'invoice', currency, year);
  return {
    ledgerId: result.ledgerId,
    invoiceNumber: result.documentNumber,
  };
}

// Generate next quote number
export async function generateQuoteNumber(
  database: AppDatabase,
  currency: CurrencyCode,
  year: number
): Promise<{ ledgerId: number; quoteNumber: string }> {
  const result = await generateDocumentNumber(database, 'quote', currency, year);
  return {
    ledgerId: result.ledgerId,
    quoteNumber: result.documentNumber,
  };
}

export { db };
