import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateInvoiceNumber } from '../db';
import type { Invoice, InvoiceItem, CurrencyCode } from '../types';

const CURRENCIES: CurrencyCode[] = [
  'USD', 'EUR', 'GBP', 'BRL', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR',
];

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

export function InvoiceForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const duplicateFromId = searchParams.get('duplicate');
  const isEditing = Boolean(id) && !duplicateFromId;

  const clients = useLiveQuery(() => db.clients.orderBy('name').toArray());
  const settings = useLiveQuery(() => db.settings.toArray());

  const [formData, setFormData] = useState<{
    clientId: number | null;
    currency: CurrencyCode;
    issueDate: string;
    dueDate: string;
    items: InvoiceItem[];
    notes: string;
  }>({
    clientId: null,
    currency: 'EUR',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [createEmptyItem()],
    notes: '',
  });

  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null);

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
    }
  }, [settings]);

  // Load existing invoice for editing or duplication
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

          setFormData({
            clientId: invoice.clientId,
            currency: invoice.currency,
            issueDate: issueDateStr,
            dueDate: dueDateStr,
            items: invoice.items.map((item) => ({
              ...item,
              id: duplicateFromId ? generateItemId() : item.id,
            })),
            notes: invoice.notes || '',
          });
        }
      });
    }
  }, [id, duplicateFromId, settings]);

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

    const totals = calculateTotals();

    if (isEditing && id && existingInvoice) {
      // Update existing invoice (keep same invoice number)
      await db.invoices.update(Number(id), {
        clientId: formData.clientId,
        currency: formData.currency,
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(formData.dueDate),
        items: formData.items,
        notes: formData.notes || undefined,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        updatedAt: now,
      });
    } else {
      // Create new invoice (or duplicate)
      const { ledgerId, invoiceNumber } = await generateInvoiceNumber(
        formData.currency,
        year
      );

      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber,
        ledgerId,
        clientId: formData.clientId,
        items: formData.items,
        currency: formData.currency,
        status: 'draft',
        issueDate: new Date(formData.issueDate),
        dueDate: new Date(formData.dueDate),
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

  return (
    <div className="invoice-form-page">
      <div className="page-header">
        <h1>
          {isEditing
            ? t('invoices.edit')
            : duplicateFromId
              ? t('invoices.duplicate')
              : t('invoices.create')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="form">
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, 'description', e.target.value)
                        }
                        placeholder={t('invoices.fields.description')}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', Number(e.target.value))
                        }
                        min="1"
                        step="1"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', Number(e.target.value))
                        }
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.taxRate || 0}
                        onChange={(e) =>
                          handleItemChange(index, 'taxRate', Number(e.target.value))
                        }
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </td>
                    <td className="item-total">{formatCurrency(calculateItemTotal(item))}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        aria-label={t('invoices.removeItem')}
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button type="button" className="btn btn-secondary" onClick={addItem}>
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
