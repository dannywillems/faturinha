import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { Invoice, Client, Settings, Address } from '../types';

interface InvoicePreviewProps {
  invoice: Invoice;
  client: Client;
  settings: Settings | null;
  /** When true, renders at fixed A4 dimensions for PDF/print output */
  forPrint?: boolean;
  /** Custom ID for the element (used for PDF generation) */
  id?: string;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function formatAddress(address: Address | undefined): string[] {
  if (!address) return [];
  const lines: string[] = [];
  if (address.street) lines.push(address.street);
  const cityLine = [address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');
  if (cityLine) lines.push(cityLine);
  if (address.country) lines.push(address.country);
  return lines;
}

export function InvoicePreview({
  invoice,
  client,
  settings,
  forPrint = false,
  id = 'invoice-preview',
}: InvoicePreviewProps): ReactElement {
  const { t } = useTranslation();

  const businessAddressLines = formatAddress(settings?.businessAddress);
  const clientAddressLines = formatAddress(client.address);
  const isQuote = invoice.documentType === 'quote';
  const className = forPrint ? 'invoice-preview invoice-preview-print' : 'invoice-preview';

  const calculateItemTotal = (
    quantity: number,
    unitPrice: number,
    taxRate?: number
  ): number => {
    const subtotal = quantity * unitPrice;
    const tax = subtotal * ((taxRate ?? 0) / 100);
    return subtotal + tax;
  };

  // Get status translation based on document type
  const getStatusTranslation = (): string => {
    if (isQuote) {
      return t(`quotes.status.${invoice.status}`);
    }
    return t(`invoices.status.${invoice.status}`);
  };

  return (
    <div className={className} id={id}>
      {/* Header */}
      <div className="invoice-preview-header">
        <div className="business-info">
          {settings?.businessLogo && (
            <img
              src={settings.businessLogo}
              alt="Business Logo"
              className="business-logo"
            />
          )}
          <div className="business-details">
            {settings?.businessName && (
              <h2 className="business-name">{settings.businessName}</h2>
            )}
            {businessAddressLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {settings?.businessEmail && <p>{settings.businessEmail}</p>}
            {settings?.businessPhone && <p>{settings.businessPhone}</p>}
            {settings?.businessVatNumber && (
              <p>
                {t('settings.business.vatNumber')}: {settings.businessVatNumber}
              </p>
            )}
          </div>
        </div>
        <div className="invoice-title">
          <h1>{isQuote ? t('documents.quote') : t('documents.invoice')}</h1>
          <p className="invoice-number">{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Invoice/Quote Details */}
      <div className="invoice-preview-details">
        <div className="bill-to">
          <h3>{t('invoices.fields.client')}</h3>
          <p className="client-name">{client.name}</p>
          {clientAddressLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          {client.email && <p>{client.email}</p>}
          {client.phone && <p>{client.phone}</p>}
          {client.vatNumber && (
            <p>
              {t('clients.fields.vatNumber')}: {client.vatNumber}
            </p>
          )}
        </div>
        <div className="invoice-meta">
          <div className="meta-row">
            <span className="meta-label">{t('invoices.fields.issueDate')}:</span>
            <span className="meta-value">{formatDate(invoice.issueDate)}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">
              {isQuote ? t('quotes.fields.validUntil') : t('invoices.fields.dueDate')}:
            </span>
            <span className="meta-value">
              {formatDate(isQuote && invoice.validUntil ? invoice.validUntil : invoice.dueDate)}
            </span>
          </div>
          <div className="meta-row status-row">
            <span className="meta-label">Status:</span>
            <span className={`status-badge status-${invoice.status}`}>
              {getStatusTranslation()}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="invoice-preview-items">
        <thead>
          <tr>
            <th className="col-description">{t('invoices.fields.description')}</th>
            <th className="col-quantity">{t('invoices.fields.quantity')}</th>
            <th className="col-price">{t('invoices.fields.unitPrice')}</th>
            <th className="col-tax">{t('invoices.fields.taxRate')}</th>
            <th className="col-total">{t('invoices.fields.total')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td className="col-description">{item.description}</td>
              <td className="col-quantity">{item.quantity}</td>
              <td className="col-price">
                {formatCurrency(item.unitPrice, invoice.currency)}
              </td>
              <td className="col-tax">{item.taxRate ?? 0}%</td>
              <td className="col-total">
                {formatCurrency(
                  calculateItemTotal(item.quantity, item.unitPrice, item.taxRate),
                  invoice.currency
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="invoice-preview-totals">
        <div className="totals-row">
          <span className="totals-label">{t('invoices.fields.subtotal')}:</span>
          <span className="totals-value">
            {formatCurrency(invoice.subtotal, invoice.currency)}
          </span>
        </div>
        <div className="totals-row">
          <span className="totals-label">{t('invoices.fields.tax')}:</span>
          <span className="totals-value">
            {formatCurrency(invoice.taxTotal, invoice.currency)}
          </span>
        </div>
        <div className="totals-row totals-final">
          <span className="totals-label">{t('invoices.fields.total')}:</span>
          <span className="totals-value">
            {formatCurrency(invoice.total, invoice.currency)}
          </span>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="invoice-preview-notes">
          <h3>{t('invoices.fields.notes')}</h3>
          <p>{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="invoice-preview-footer">
        <p>
          {isQuote ? t('quotes.fields.validUntil') : t('invoices.fields.dueDate')}:{' '}
          {formatDate(isQuote && invoice.validUntil ? invoice.validUntil : invoice.dueDate)}
        </p>
      </div>
    </div>
  );
}
