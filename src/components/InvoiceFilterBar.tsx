import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  Client,
  InvoiceStatus,
  QuoteStatus,
  DocumentType,
} from '../types';
import type {
  InvoiceFilters,
  DateRangeField,
} from '../hooks/useInvoiceFilters';

const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
];

const QUOTE_STATUSES: QuoteStatus[] = [
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
];

interface InvoiceFilterBarProps {
  filters: InvoiceFilters;
  activeFilterCount: number;
  clients: Client[];
  onDocumentTypeChange: (type: 'all' | DocumentType) => void;
  onStatusToggle: (status: InvoiceStatus | QuoteStatus) => void;
  onClientChange: (clientId: number | null) => void;
  onDateRangeFieldChange: (field: DateRangeField) => void;
  onDateFromChange: (date: string | null) => void;
  onDateToChange: (date: string | null) => void;
  onClearFilters: () => void;
}

export function InvoiceFilterBar({
  filters,
  activeFilterCount,
  clients,
  onDocumentTypeChange,
  onStatusToggle,
  onClientChange,
  onDateRangeFieldChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: InvoiceFilterBarProps): ReactElement {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const getAvailableStatuses = (): Array<InvoiceStatus | QuoteStatus> => {
    if (filters.documentType === 'invoice') {
      return INVOICE_STATUSES;
    }
    if (filters.documentType === 'quote') {
      return QUOTE_STATUSES;
    }
    const uniqueStatuses = new Set([...INVOICE_STATUSES, ...QUOTE_STATUSES]);
    return Array.from(uniqueStatuses);
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <div className="filter-bar">
      {/* Header with toggle and clear button */}
      <div className="filter-header">
        <button
          type="button"
          className="filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>{t('filters.show')}</span>
          {activeFilterCount > 0 && (
            <span className="active-filters-badge">{activeFilterCount}</span>
          )}
          <svg
            className={`filter-chevron ${isExpanded ? 'expanded' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-clear-filters"
            onClick={onClearFilters}
          >
            {t('filters.clear')}
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className={`filter-panel ${isExpanded ? 'expanded' : ''}`}>
        {/* Row 1: Document Type and Status */}
        <div className="filter-row">
          <div className="filter-group filter-group-type">
            <div className="document-type-toggle filter-doc-toggle">
              <label className="toggle-label">
                <input
                  type="radio"
                  name="documentType"
                  value="all"
                  checked={filters.documentType === 'all'}
                  onChange={() => onDocumentTypeChange('all')}
                />
                <span className="toggle-option">{t('documents.all')}</span>
              </label>
              <label className="toggle-label">
                <input
                  type="radio"
                  name="documentType"
                  value="invoice"
                  checked={filters.documentType === 'invoice'}
                  onChange={() => onDocumentTypeChange('invoice')}
                />
                <span className="toggle-option">{t('documents.invoice')}</span>
              </label>
              <label className="toggle-label">
                <input
                  type="radio"
                  name="documentType"
                  value="quote"
                  checked={filters.documentType === 'quote'}
                  onChange={() => onDocumentTypeChange('quote')}
                />
                <span className="toggle-option">{t('documents.quote')}</span>
              </label>
            </div>
          </div>

          <div className="filter-group filter-group-status">
            <div className="status-checkboxes">
              {availableStatuses.map((status) => (
                <label key={status} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() => onStatusToggle(status)}
                  />
                  <span className={`status-chip status-${status}`}>
                    {t(`invoices.status.${status}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Client and Date Range */}
        <div className="filter-row filter-row-controls">
          <div className="filter-group">
            <label className="filter-label">{t('filters.client.label')}</label>
            <select
              value={filters.clientId ?? ''}
              onChange={(e) =>
                onClientChange(e.target.value ? Number(e.target.value) : null)
              }
              className="filter-select"
            >
              <option value="">{t('filters.client.all')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group filter-group-date">
            <label className="filter-label">
              {t('filters.dateRange.label')}
            </label>
            <div className="date-range-inputs">
              <select
                value={filters.dateRange.field}
                onChange={(e) =>
                  onDateRangeFieldChange(e.target.value as DateRangeField)
                }
                className="filter-select"
              >
                <option value="issueDate">
                  {t('invoices.fields.issueDate')}
                </option>
                <option value="dueDate">{t('invoices.fields.dueDate')}</option>
              </select>
              <input
                type="date"
                value={filters.dateRange.from ?? ''}
                onChange={(e) => onDateFromChange(e.target.value || null)}
                className="filter-input"
              />
              <input
                type="date"
                value={filters.dateRange.to ?? ''}
                onChange={(e) => onDateToChange(e.target.value || null)}
                className="filter-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
