import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { useDb } from '../contexts/TestModeContext';
import { useInvoiceFilters } from '../hooks/useInvoiceFilters';
import type { SortField } from '../hooks/useInvoiceFilters';
import { InvoiceFilterBar } from '../components/InvoiceFilterBar';
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

export function Invoices(): ReactElement {
  const { t } = useTranslation();
  const db = useDb();

  const {
    filters,
    sorting,
    activeFilterCount,
    setDocumentType,
    toggleStatus,
    setClientId,
    setDateRangeField,
    setDateFrom,
    setDateTo,
    setSortField,
    toggleSortDirection,
    clearFilters,
  } = useInvoiceFilters();

  // Query invoices, optionally filtering by documentType at DB level
  const invoices = useLiveQuery(() => {
    if (filters.documentType === 'all') {
      return db.invoices.orderBy('issueDate').reverse().toArray();
    }
    return db.invoices
      .where('documentType')
      .equals(filters.documentType)
      .reverse()
      .sortBy('issueDate');
  }, [db, filters.documentType]);

  const clients = useLiveQuery(() => db.clients.toArray(), [db]);

  const clientMap = useMemo(() => {
    const map = new Map<number, Client>();
    clients?.forEach((client) => {
      if (client.id) map.set(client.id, client);
    });
    return map;
  }, [clients]);

  const getClientName = (clientId: number): string => {
    return clientMap.get(clientId)?.name ?? 'Unknown';
  };

  // Apply in-memory filters and sorting
  const filteredAndSortedInvoices = useMemo(() => {
    if (!invoices) return [];

    let result = [...invoices];

    // Filter by status
    if (filters.statuses.length > 0) {
      result = result.filter((inv) => filters.statuses.includes(inv.status));
    }

    // Filter by client
    if (filters.clientId !== null) {
      result = result.filter((inv) => inv.clientId === filters.clientId);
    }

    // Filter by date range
    const { field: dateField, from: dateFrom, to: dateTo } = filters.dateRange;
    if (dateFrom || dateTo) {
      result = result.filter((inv) => {
        const dateValue = new Date(inv[dateField]).getTime();
        if (dateFrom) {
          const fromTime = new Date(dateFrom).getTime();
          if (dateValue < fromTime) return false;
        }
        if (dateTo) {
          const toTime = new Date(dateTo).getTime();
          // Include the entire day by adding 24 hours
          if (dateValue > toTime + 24 * 60 * 60 * 1000) return false;
        }
        return true;
      });
    }

    // Filter by amount range
    const { min: amountMin, max: amountMax } = filters.amountRange;
    if (amountMin !== null || amountMax !== null) {
      result = result.filter((inv) => {
        if (amountMin !== null && inv.total < amountMin) return false;
        if (amountMax !== null && inv.total > amountMax) return false;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sorting.field) {
        case 'issueDate':
          comparison =
            new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          break;
        case 'dueDate':
          comparison =
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'clientName': {
          const nameA = clientMap.get(a.clientId)?.name ?? 'Unknown';
          const nameB = clientMap.get(b.clientId)?.name ?? 'Unknown';
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'invoiceNumber':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
      }

      return sorting.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [invoices, filters, sorting, clientMap]);

  const getStatusClass = (status: Invoice['status']): string => {
    const classes: Record<Invoice['status'], string> = {
      draft: 'status-draft',
      sent: 'status-sent',
      paid: 'status-paid',
      overdue: 'status-overdue',
      cancelled: 'status-cancelled',
      accepted: 'status-accepted',
      declined: 'status-declined',
      expired: 'status-expired',
    };
    return classes[status];
  };

  const handleHeaderClick = (field: SortField): void => {
    if (sorting.field === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
    }
  };

  const renderSortIndicator = (field: SortField): ReactElement | null => {
    if (sorting.field !== field) return null;
    return (
      <span className="sort-indicator">
        {sorting.direction === 'asc' ? ' \u2191' : ' \u2193'}
      </span>
    );
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

      <InvoiceFilterBar
        filters={filters}
        activeFilterCount={activeFilterCount}
        clients={clients}
        onDocumentTypeChange={setDocumentType}
        onStatusToggle={toggleStatus}
        onClientChange={setClientId}
        onDateRangeFieldChange={setDateRangeField}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClearFilters={clearFilters}
      />

      {filteredAndSortedInvoices.length === 0 ? (
        <div className="empty-state">
          {invoices.length === 0 ? (
            <>
              <p>{t('invoices.empty')}</p>
              <p className="text-muted">{t('invoices.emptyDescription')}</p>
            </>
          ) : (
            <>
              <p>{t('filters.noResults')}</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearFilters}
              >
                {t('filters.clear')}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="invoices-list">
          <table>
            <thead>
              <tr>
                <th
                  className="sortable-header"
                  onClick={() => handleHeaderClick('invoiceNumber')}
                >
                  {t('invoices.fields.invoiceNumber')}
                  {renderSortIndicator('invoiceNumber')}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleHeaderClick('clientName')}
                >
                  {t('invoices.fields.client')}
                  {renderSortIndicator('clientName')}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleHeaderClick('issueDate')}
                >
                  {t('invoices.fields.issueDate')}
                  {renderSortIndicator('issueDate')}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleHeaderClick('dueDate')}
                >
                  {t('invoices.fields.dueDate')}
                  {renderSortIndicator('dueDate')}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleHeaderClick('total')}
                >
                  {t('invoices.fields.total')}
                  {renderSortIndicator('total')}
                </th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link to={`/invoices/${invoice.id}/view`}>
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td>{getClientName(invoice.clientId)}</td>
                  <td>{formatDate(invoice.issueDate)}</td>
                  <td>{formatDate(invoice.dueDate)}</td>
                  <td>{formatCurrency(invoice.total, invoice.currency)}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(invoice.status)}`}
                    >
                      {t(`invoices.status.${invoice.status}`)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link
                      to={`/invoices/${invoice.id}/view`}
                      className="btn btn-sm"
                    >
                      View
                    </Link>
                    <Link
                      to={`/invoices/${invoice.id}/edit`}
                      className="btn btn-sm"
                    >
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
