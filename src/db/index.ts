import Dexie, { type EntityTable } from 'dexie';
import type { Client, Invoice, Settings } from '../types';

const db = new Dexie('FaturinhaDB') as Dexie & {
  clients: EntityTable<Client, 'id'>;
  invoices: EntityTable<Invoice, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

db.version(1).stores({
  clients: '++id, name, email, createdAt',
  invoices: '++id, invoiceNumber, clientId, status, issueDate, dueDate',
  settings: '++id',
});

export { db };
