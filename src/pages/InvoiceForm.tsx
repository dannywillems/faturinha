import type { ReactElement } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '../contexts/TestModeContext';
import { generateInvoiceNumber, generateQuoteNumber } from '../db';
import type { Invoice, InvoiceItem, CurrencyCode, DocumentType } from '../types';

const CURRENCIES: CurrencyCode[] = [
  'USD', 'EUR', 'GBP', 'BRL', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR',
];

// Currency symbols for input prefix display
const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BRL: 'R$',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  MXN: 'MX$',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  NOK: 'kr',
  SEK: 'kr',
  DKK: 'kr',
  NZD: 'NZ$',
  ZAR: 'R',
  RUB: '₽',
  PLN: 'zł',
  THB: '฿',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
  CZK: 'Kč',
  ILS: '₪',
  CLP: 'CLP$',
  AED: 'د.إ',
  COP: 'COP$',
  SAR: '﷼',
  TWD: 'NT$',
  ARS: 'AR$',
  EGP: 'E£',
  VND: '₫',
  TRY: '₺',
  NGN: '₦',
  PKR: '₨',
  BDT: '৳',
};

// Trash icon SVG component
function TrashIcon(): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

// Plus icon SVG component
function PlusIcon(): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function generateItemId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyItem(): InvoiceItem {
  return {
    id: generateItemId(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 0,
  };
}

export function InvoiceForm(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const db = useDb();
  const duplicateFromId = searchParams.get('duplicate');
  const isEditing = Boolean(id) && !duplicateFromId;

  const clients = useLiveQuery(
    () => db.clients.orderBy('name').toArray(),
    [db]
  );
  const settings = useLiveQuery(() => db.settings.toArray(), [db]);

  const [formData, setFormData] = useState<{
    documentType: DocumentType;
    clientId: number | null;
    currency: CurrencyCode;
    issueDate: string;
    dueDate: string;
    validUntil: string;
    items: InvoiceItem[];
    notes: string;
  }>({
    documentType: 'invoice',
    clientId: null,
    currency: 'EUR',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    validUntil: '',
    items: [createEmptyItem()],
    notes: '',
  });

  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null);
  const newItemRef = useRef<HTMLInputElement>(null);
  const shouldFocusNewItem = useRef(false);

  // Auto-focus on new item description field
  useEffect(() => {
    if (shouldFocusNewItem.current && newItemRef.current) {
      newItemRef.current.focus();
      shouldFocusNewItem.current = false;
    }
  }, [formData.items.length]);

  // Initialize form defaults from settings - intentional setState in effect for initialization
  useEffect(() => {
    if (settings && settings[0]) {
      const currentSettings = settings[0];

      setFormData((prev) => ({
        ...prev,
        currency: prev.currency || currentSettings.defaultCurrency,
        notes: prev.notes || currentSettings.defaultNotes || '',
      }));

      // Set default due date based on payment terms
      if (!formData.dueDate && currentSettings.defaultPaymentTermsDays) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + currentSettings.defaultPaymentTermsDays);

        setFormData((prev) => ({
          ...prev,
          dueDate: dueDate.toISOString().split('T')[0],
        }));
      }

      // Set default validity period for quotes
      if (!formData.validUntil && currentSettings.defaultQuoteValidityDays) {
        const validUntil = new Date();
        validUntil.setDate(
          validUntil.getDate() + currentSettings.defaultQuoteValidityDays
        );

        setFormData((prev) => ({
          ...prev,
          validUntil: validUntil.toISOString().split('T')[0],
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Load existing invoice/quote for editing or duplication
  useEffect(() => {
    const invoiceId = id || duplicateFromId;
    if (invoiceId) {
      db.invoices.get(Number(invoiceId)).then((invoice) => {
        if (invoice) {
          setExistingInvoice(invoice);
          const issueDateStr = duplicateFromId
            ? new Date().toISOString().split('T')[0]
            : new Date(invoice.issueDate).toISOString().split('T')[0];

          const dueDateStr = duplicateFromId
            ? (() => {
                const d = new Date();
                d.setDate(d.getDate() + (settings?.[0]?.defaultPaymentTermsDays ?? 30));
                return d.toISOString().split('T')[0];
              })()
            : new Date(invoice.dueDate).toISOString().split('T')[0];

          const validUntilStr = duplicateFromId
            ? (() => {
                const d = new Date();
                d.setDate(d.getDate() + (settings?.[0]?.defaultQuoteValidityDays ?? 30));
                return d.toISOString().split('T')[0];
              })()
            : invoice.validUntil
              ? new Date(invoice.validUntil).toISOString().split('T')[0]
              : '';

          setFormData({
            documentType: invoice.documentType || 'invoice',
            clientId: invoice.clientId,
            currency: invoice.currency,
            issueDate: issueDateStr,
            dueDate: dueDateStr,
            validUntil: validUntilStr,
            items: invoice.items.map((item) => ({
              ...item,
              id: duplicateFromId ? generateItemId() : item.id,
            })),
            notes: invoice.notes || '',
          });
        }
      });
    }
  }, [id, duplicateFromId, settings, db]);

  const calculateItemTotal = (item: InvoiceItem): number => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = subtotal * ((item.taxRate || 0) / 100);
    return subtotal + tax;
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxTotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * ((item.taxRate || 0) / 100),
      0
    );
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      alert('Please select a client');
      return;
    }

    const now = new Date();
    const issueDate = new Date(formData.issueDate);
    const year = issueDate.getFullYear();
    const isQuote = formData.documentType === 'quote';

    const totals = calculateTotals();

    if (isEditing && id && existingInvoice) {
      // Update existing invoice/quote (keep same document number)
      // For quotes, use validUntil as dueDate since dueDate is required
      const dueDateValue = isQuote ? formData.validUntil : formData.dueDate;

      await db.invoices.update(Number(id), {
        clientId: formData.clientId,
        currency: formData.currency,
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(dueDateValue),
        validUntil: isQuote && formData.validUntil
          ? new Date(formData.validUntil)
          : undefined,
        items: formData.items,
        notes: formData.notes || undefined,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        updatedAt: now,
      });
    } else {
      // Create new invoice/quote (or duplicate)
      let ledgerId: number;
      let documentNumber: string;

      if (isQuote) {
        const result = await generateQuoteNumber(db, formData.currency, year);
        ledgerId = result.ledgerId;
        documentNumber = result.quoteNumber;
      } else {
        const result = await generateInvoiceNumber(db, formData.currency, year);
        ledgerId = result.ledgerId;
        documentNumber = result.invoiceNumber;
      }

      // For quotes, use validUntil as dueDate since dueDate is required
      const dueDateValue = isQuote ? formData.validUntil : formData.dueDate;

      const invoiceData: Omit<Invoice, 'id'> = {
        documentType: formData.documentType,
        invoiceNumber: documentNumber,
        ledgerId,
        clientId: formData.clientId,
        items: formData.items,
        currency: formData.currency,
        status: 'draft',
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(dueDateValue),
        validUntil: isQuote && formData.validUntil
          ? new Date(formData.validUntil)
          : undefined,
        notes: formData.notes || undefined,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        createdAt: now,
        updatedAt: now,
      };

      await db.invoices.add(invoiceData as Invoice);
    }

    navigate('/invoices');
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
    shouldFocusNewItem.current = true;
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleDelete = async () => {
    if (id && window.confirm(t('common.confirmDelete'))) {
      await db.invoices.delete(Number(id));
      navigate('/invoices');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
    }).format(amount);
  };

  const totals = calculateTotals();

  const isQuote = formData.documentType === 'quote';

  const getPageTitle = (): string => {
    if (isEditing) {
      return isQuote ? t('quotes.edit') : t('invoices.edit');
    }
    if (duplicateFromId) {
      return isQuote ? t('quotes.duplicate') : t('invoices.duplicate');
    }
    return isQuote ? t('quotes.create') : t('invoices.create');
  };

  return (
    <div className="invoice-form-page">
      <div className="page-header">
        <h1>{getPageTitle()}</h1>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {/* Document type toggle - only show when creating new */}
        {!isEditing && (
          <div className="form-section">
            <div className="document-type-toggle">
              <label className="toggle-label">
                <input
                  type="radio"
                  name="documentType"
                  value="invoice"
                  checked={formData.documentType === 'invoice'}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, documentType: 'invoice' }))
                  }
                />
                <span className="toggle-option">{t('documents.invoice')}</span>
              </label>
              <label className="toggle-label">
                <input
                  type="radio"
                  name="documentType"
                  value="quote"
                  checked={formData.documentType === 'quote'}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, documentType: 'quote' }))
                  }
                />
                <span className="toggle-option">{t('documents.quote')}</span>
              </label>
            </div>
          </div>
        )}

        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientId">{t('invoices.fields.client')} *</label>
              <select
                id="clientId"
                value={formData.clientId ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientId: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                required
              >
                <option value="">-- Select Client --</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="currency">{t('invoices.fields.currency')} *</label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    currency: e.target.value as CurrencyCode,
                  }))
                }
                required
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="issueDate">{t('invoices.fields.issueDate')} *</label>
              <input
                type="date"
                id="issueDate"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, issueDate: e.target.value }))
                }
                required
              />
            </div>

            {isQuote ? (
              <div className="form-group">
                <label htmlFor="validUntil">{t('quotes.fields.validUntil')} *</label>
                <input
                  type="date"
                  id="validUntil"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, validUntil: e.target.value }))
                  }
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="dueDate">{t('invoices.fields.dueDate')} *</label>
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                  required
                />
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>{t('invoices.fields.items')}</h3>

          <div className="invoice-items">
            <table className="items-table">
              <thead>
                <tr>
                  <th>{t('invoices.fields.description')}</th>
                  <th>{t('invoices.fields.quantity')}</th>
                  <th>{t('invoices.fields.unitPrice')}</th>
                  <th>{t('invoices.fields.taxRate')}</th>
                  <th>{t('invoices.fields.total')}</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => {
                  const isLastItem = index === formData.items.length - 1;
                  return (
                    <tr key={item.id}>
                      <td data-label={t('invoices.fields.description')}>
                        <input
                          ref={isLastItem ? newItemRef : undefined}
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(index, 'description', e.target.value)
                          }
                          placeholder={t('invoices.fields.description')}
                          required
                          aria-label={`${t('invoices.fields.description')} ${index + 1}`}
                        />
                      </td>
                      <td data-label={t('invoices.fields.quantity')}>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', Number(e.target.value))
                          }
                          min="1"
                          step="1"
                          required
                          aria-label={`${t('invoices.fields.quantity')} ${index + 1}`}
                        />
                      </td>
                      <td data-label={t('invoices.fields.unitPrice')}>
                        <div className="input-with-addon has-prefix">
                          <span className="input-addon input-addon-prefix">
                            {CURRENCY_SYMBOLS[formData.currency]}
                          </span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(index, 'unitPrice', Number(e.target.value))
                            }
                            min="0"
                            step="0.01"
                            required
                            aria-label={`${t('invoices.fields.unitPrice')} ${index + 1}`}
                          />
                        </div>
                      </td>
                      <td data-label={t('invoices.fields.taxRate')}>
                        <div className="input-with-addon has-suffix">
                          <input
                            type="number"
                            value={item.taxRate || 0}
                            onChange={(e) =>
                              handleItemChange(index, 'taxRate', Number(e.target.value))
                            }
                            min="0"
                            max="100"
                            step="0.1"
                            aria-label={`${t('invoices.fields.taxRate')} ${index + 1}`}
                          />
                          <span className="input-addon input-addon-suffix">%</span>
                        </div>
                      </td>
                      <td data-label={t('invoices.fields.total')} className="item-total">
                        {formatCurrency(calculateItemTotal(item))}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-delete-item"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          aria-label={`${t('invoices.removeItem')} ${index + 1}`}
                          title={t('invoices.removeItem')}
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button
              type="button"
              className="btn btn-secondary btn-add-item"
              onClick={addItem}
            >
              <PlusIcon />
              {t('invoices.addItem')}
            </button>
          </div>

          <div className="invoice-totals">
            <div className="total-row">
              <span>{t('invoices.fields.subtotal')}:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="total-row">
              <span>{t('invoices.fields.tax')}:</span>
              <span>{formatCurrency(totals.taxTotal)}</span>
            </div>
            <div className="total-row total-final">
              <span>{t('invoices.fields.total')}:</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="notes">{t('invoices.fields.notes')}</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={4}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/invoices')}
          >
            {t('common.cancel')}
          </button>
          {isEditing && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              {t('common.delete')}
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
