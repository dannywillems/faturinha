import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '../contexts/TestModeContext';

export function Dashboard(): ReactElement {
  const { t } = useTranslation();
  const db = useDb();

  const invoices = useLiveQuery(() => db.invoices.toArray(), [db]);
  const clients = useLiveQuery(() => db.clients.toArray(), [db]);

  const stats = {
    total: invoices?.length ?? 0,
    pending: invoices?.filter((i) => i.status === 'sent').length ?? 0,
    paid: invoices?.filter((i) => i.status === 'paid').length ?? 0,
    overdue: invoices?.filter((i) => i.status === 'overdue').length ?? 0,
  };

  return (
    <div className="dashboard">
      <h1>{t('dashboard.title')}</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{t('dashboard.totalInvoices')}</h3>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>{t('dashboard.pendingPayments')}</h3>
          <p className="stat-value">{stats.pending}</p>
        </div>
        <div className="stat-card">
          <h3>{t('dashboard.paidThisMonth')}</h3>
          <p className="stat-value">{stats.paid}</p>
        </div>
        <div className="stat-card">
          <h3>{t('dashboard.overdueInvoices')}</h3>
          <p className="stat-value">{stats.overdue}</p>
        </div>
      </div>

      <div className="quick-stats">
        <p>
          {clients?.length ?? 0} {t('clients.title').toLowerCase()}
        </p>
      </div>
    </div>
  );
}
