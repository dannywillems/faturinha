import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import type { Invoice, Client } from '../types';

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function Invoices() {
  const { t } = useTranslation();

  const invoices = useLiveQuery(() =>
    db.invoices.orderBy('createdAt').reverse().toArray()
  );
  const clients = useLiveQuery(() => db.clients.toArray());

  const clientMap = new Map<number, Client>();
  clients?.forEach((client) => {
    if (client.id) clientMap.set(client.id, client);
  });

  const getClientName = (clientId: number): string => {
    return clientMap.get(clientId)?.name ?? 'Unknown';
  };

  const getStatusClass = (status: Invoice['status']): string => {
    const classes: Record<Invoice['status'], string> = {
      draft: 'status-draft',
      sent: 'status-sent',
      paid: 'status-paid',
      overdue: 'status-overdue',
      cancelled: 'status-cancelled',
    };
    return classes[status];
  };

  if (!invoices || !clients) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <div className="invoices-page">
      <div className="page-header">
        <h1>{t('invoices.title')}</h1>
        <Link to="/invoices/new" className="btn btn-primary">
          {t('invoices.create')}
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <p>{t('invoices.empty')}</p>
          <p className="text-muted">{t('invoices.emptyDescription')}</p>
        </div>
      ) : (
        <div className="invoices-list">
          <table>
            <thead>
              <tr>
                <th>{t('invoices.fields.invoiceNumber')}</th>
                <th>{t('invoices.fields.client')}</th>
                <th>{t('invoices.fields.issueDate')}</th>
                <th>{t('invoices.fields.dueDate')}</th>
                <th>{t('invoices.fields.total')}</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{getClientName(invoice.clientId)}</td>
                  <td>{formatDate(invoice.issueDate)}</td>
                  <td>{formatDate(invoice.dueDate)}</td>
                  <td>{formatCurrency(invoice.total, invoice.currency)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(invoice.status)}`}>
                      {t(`invoices.status.${invoice.status}`)}
                    </span>
                  </td>
                  <td>
                    <Link to={`/invoices/${invoice.id}`} className="btn btn-sm">
                      {t('common.edit')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
