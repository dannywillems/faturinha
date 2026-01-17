import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '../contexts/TestModeContext';
import { generateInvoiceNumber } from '../db';
import { InvoicePreview } from '../components/InvoicePreview';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

export function InvoiceView(): ReactElement {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const db = useDb();

  const invoice = useLiveQuery(
    () => (id ? db.invoices.get(Number(id)) : undefined),
    [id, db]
  );

  const client = useLiveQuery(
    () => (invoice?.clientId ? db.clients.get(invoice.clientId) : undefined),
    [invoice?.clientId, db]
  );

  const settings = useLiveQuery(() => db.settings.toArray(), [db]);

  const currentSettings = settings?.[0] ?? null;

  const handleDownloadPDF = (): void => {
    if (!invoice || !client) return;

    try {
      downloadInvoicePDF(invoice, client, currentSettings);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('common.error'));
    }
  };

  const handlePrint = (): void => {
    window.print();
  };

  const handleMarkAsPaid = async (): Promise<void> => {
    if (!id || !invoice) return;
    await db.invoices.update(Number(id), {
      status: 'paid',
      paidDate: new Date(),
      updatedAt: new Date(),
    });
  };

  const handleMarkAsSent = async (): Promise<void> => {
    if (!id || !invoice) return;
    await db.invoices.update(Number(id), {
      status: 'sent',
      updatedAt: new Date(),
    });
  };

  const handleDelete = async (): Promise<void> => {
    if (!id || !window.confirm(t('common.confirmDelete'))) return;
    await db.invoices.delete(Number(id));
    navigate('/invoices');
  };

  // Quote-specific handlers
  const handleMarkAsAccepted = async (): Promise<void> => {
    if (!id || !invoice) return;
    await db.invoices.update(Number(id), {
      status: 'accepted',
      updatedAt: new Date(),
    });
  };

  const handleMarkAsDeclined = async (): Promise<void> => {
    if (!id || !invoice) return;
    await db.invoices.update(Number(id), {
      status: 'declined',
      updatedAt: new Date(),
    });
  };

  const handleConvertToInvoice = async (): Promise<void> => {
    if (!id || !invoice) return;

    const now = new Date();
    const year = now.getFullYear();

    // Generate new invoice number
    const { ledgerId, invoiceNumber } = await generateInvoiceNumber(
      db,
      invoice.currency,
      year
    );

    // Create new invoice from quote
    const newInvoiceId = await db.invoices.add({
      documentType: 'invoice',
      invoiceNumber,
      ledgerId,
      clientId: invoice.clientId,
      items: invoice.items,
      currency: invoice.currency,
      status: 'draft',
      issueDate: now,
      dueDate: new Date(
        now.getTime() + (currentSettings?.defaultPaymentTermsDays ?? 30) * 24 * 60 * 60 * 1000
      ),
      notes: invoice.notes,
      subtotal: invoice.subtotal,
      taxTotal: invoice.taxTotal,
      total: invoice.total,
      convertedFromQuoteId: Number(id),
      createdAt: now,
      updatedAt: now,
    });

    // Update quote with reference to created invoice
    await db.invoices.update(Number(id), {
      convertedToInvoiceId: newInvoiceId,
      updatedAt: now,
    });

    // Navigate to the new invoice
    navigate(`/invoices/${newInvoiceId}/view`);
  };

  if (!invoice || !client) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  const isQuote = invoice.documentType === 'quote';

  return (
    <div className="invoice-view-page">
      <div className="page-header">
        <div className="header-left">
          <Link to="/invoices" className="back-link">
            &larr; {isQuote ? t('quotes.title') : t('invoices.title')}
          </Link>
          <h1>{invoice.invoiceNumber}</h1>
        </div>
        <div className="header-actions">
          <Link
            to={`/invoices/${id}/edit`}
            className="btn btn-secondary"
          >
            {t('common.edit')}
          </Link>
          <Link
            to={`/invoices/new?duplicate=${id}`}
            className="btn btn-secondary"
          >
            {isQuote ? t('quotes.duplicate') : t('invoices.duplicate')}
          </Link>

          {/* Invoice-specific actions */}
          {!isQuote && invoice.status === 'draft' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleMarkAsSent}
            >
              {t('invoices.send')}
            </button>
          )}
          {!isQuote && (invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleMarkAsPaid}
            >
              {t('invoices.markPaid')}
            </button>
          )}

          {/* Quote-specific actions */}
          {isQuote && invoice.status === 'draft' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleMarkAsSent}
            >
              {t('quotes.send')}
            </button>
          )}
          {isQuote && invoice.status === 'sent' && (
            <>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleMarkAsAccepted}
              >
                {t('quotes.markAccepted')}
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={handleMarkAsDeclined}
              >
                {t('quotes.markDeclined')}
              </button>
            </>
          )}
          {isQuote && invoice.status === 'accepted' && !invoice.convertedToInvoiceId && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConvertToInvoice}
            >
              {t('quotes.convertToInvoice')}
            </button>
          )}
          {isQuote && invoice.convertedToInvoiceId && (
            <Link
              to={`/invoices/${invoice.convertedToInvoiceId}/view`}
              className="btn btn-secondary"
            >
              View Invoice
            </Link>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
          >
            Print
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadPDF}
          >
            {t('share.download')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
          >
            {t('common.delete')}
          </button>
        </div>
      </div>

      {/* Visible preview - responsive for viewing */}
      <div className="invoice-preview-container">
        <InvoicePreview
          invoice={invoice}
          client={client}
          settings={currentSettings}
        />
      </div>

      {/* Hidden print-ready preview - fixed A4 dimensions for PDF generation */}
      <div className="invoice-print-container" aria-hidden="true">
        <InvoicePreview
          invoice={invoice}
          client={client}
          settings={currentSettings}
          forPrint={true}
          id="invoice-preview-print"
        />
      </div>
    </div>
  );
}
