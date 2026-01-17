import type { ChangeEvent, ReactElement } from 'react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '../contexts/TestModeContext';
import type { Settings as SettingsType, CurrencyCode, Client, Invoice } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const MAX_LOGO_SIZE_KB = 500;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export function Settings(): ReactElement {
  const { t } = useTranslation();
  const db = useDb();

  const existingSettings = useLiveQuery(() => db.settings.toArray(), [db]);
  const [saved, setSaved] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Get current settings from DB or defaults
  const currentSettings = existingSettings?.[0];
  const settingsId = currentSettings?.id;

  const updateField = useCallback(
    async <K extends keyof Omit<SettingsType, 'id'>>(
      field: K,
      value: SettingsType[K]
    ) => {
      if (settingsId) {
        await db.settings.update(settingsId, { [field]: value });
      } else {
        await db.settings.add({
          ...DEFAULT_SETTINGS,
          [field]: value,
        } as SettingsType);
      }
    },
    [db.settings, settingsId]
  );

  const getValue = <K extends keyof Omit<SettingsType, 'id'>>(
    field: K
  ): SettingsType[K] => {
    return currentSettings?.[field] ?? DEFAULT_SETTINGS[field];
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    const data = {
      clients: await db.clients.toArray(),
      invoices: await db.invoices.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faturinha-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e): Promise<void> => {
      try {
        const data = JSON.parse(e.target?.result as string) as {
          clients?: unknown[];
          invoices?: unknown[];
          settings?: unknown[];
        };

        if (data.clients) {
          await db.clients.clear();
          await db.clients.bulkAdd(data.clients as Client[]);
        }
        if (data.invoices) {
          await db.invoices.clear();
          await db.invoices.bulkAdd(data.invoices as Invoice[]);
        }
        if (data.settings && data.settings.length > 0) {
          await db.settings.clear();
          await db.settings.bulkAdd(data.settings as SettingsType[]);
        }

        alert(t('common.success'));
      } catch {
        alert(t('common.error'));
      }
    };
    reader.readAsText(file);
  };

  const handleLogoUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = event.target.files?.[0];
      if (!file) return;

      setLogoError(null);

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setLogoError('Invalid file type. Please upload PNG, JPEG, or SVG.');
        return;
      }

      // Validate file size
      if (file.size > MAX_LOGO_SIZE_KB * 1024) {
        setLogoError(`File too large. Maximum size is ${MAX_LOGO_SIZE_KB}KB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e): Promise<void> => {
        const base64 = e.target?.result as string;
        await updateField('businessLogo', base64);
      };
      reader.readAsDataURL(file);
    },
    [updateField]
  );

  const handleRemoveLogo = useCallback(async (): Promise<void> => {
    await updateField('businessLogo', undefined);
  }, [updateField]);

  if (existingSettings === undefined) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <div className="settings-page">
      <h1>{t('settings.title')}</h1>

      <section className="settings-section">
        <h2>{t('settings.business.title')}</h2>
        <div className="form-group">
          <label>{t('settings.business.name')}</label>
          <input
            type="text"
            value={getValue('businessName') ?? ''}
            onChange={(e) => updateField('businessName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>{t('settings.business.email')}</label>
          <input
            type="email"
            value={getValue('businessEmail') ?? ''}
            onChange={(e) => updateField('businessEmail', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>{t('settings.business.phone')}</label>
          <input
            type="tel"
            value={getValue('businessPhone') ?? ''}
            onChange={(e) => updateField('businessPhone', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>{t('settings.business.vatNumber')}</label>
          <input
            type="text"
            value={getValue('businessVatNumber') ?? ''}
            onChange={(e) => updateField('businessVatNumber', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>{t('settings.business.logo')}</label>
          {getValue('businessLogo') ? (
            <div className="logo-preview">
              <img
                src={getValue('businessLogo')}
                alt="Business logo"
                className="logo-image"
              />
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={handleRemoveLogo}
              >
                {t('common.delete')}
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleLogoUpload}
            />
          )}
          {logoError && <p className="text-error">{logoError}</p>}
          <p className="text-muted">Max {MAX_LOGO_SIZE_KB}KB. PNG, JPEG, or SVG.</p>
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.invoice.title')}</h2>
        <div className="form-group">
          <label>{t('settings.invoice.defaultCurrency')}</label>
          <select
            value={getValue('defaultCurrency')}
            onChange={(e) =>
              updateField('defaultCurrency', e.target.value as CurrencyCode)
            }
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="BRL">BRL - Brazilian Real</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CHF">CHF - Swiss Franc</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('settings.invoice.defaultTaxRate')} (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={getValue('defaultTaxRate')}
            onChange={(e) =>
              updateField('defaultTaxRate', Number(e.target.value))
            }
          />
        </div>
        <div className="form-group">
          <label>{t('settings.invoice.invoicePrefix')}</label>
          <input
            type="text"
            value={getValue('invoiceNumberPrefix')}
            onChange={(e) =>
              updateField('invoiceNumberPrefix', e.target.value)
            }
          />
        </div>
        <div className="form-group">
          <label>{t('settings.invoice.nextInvoiceNumber')}</label>
          <input
            type="number"
            min="1"
            value={getValue('invoiceNumberNextValue')}
            onChange={(e) =>
              updateField('invoiceNumberNextValue', Number(e.target.value))
            }
          />
        </div>
        <div className="form-group">
          <label>{t('settings.invoice.paymentTerms')}</label>
          <input
            type="number"
            min="0"
            value={getValue('defaultPaymentTermsDays')}
            onChange={(e) =>
              updateField('defaultPaymentTermsDays', Number(e.target.value))
            }
          />
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.data.title')}</h2>
        <div className="form-group">
          <p className="text-muted">{t('settings.data.exportDescription')}</p>
          <button onClick={handleExport} className="btn">
            {t('settings.data.export')}
          </button>
        </div>
        <div className="form-group">
          <p className="text-muted">{t('settings.data.importDescription')}</p>
          <input type="file" accept=".json" onChange={handleImport} />
        </div>
      </section>

      <div className="form-actions">
        <button onClick={handleSave} className="btn btn-primary">
          {t('common.save')}
        </button>
        {saved && <span className="save-success">{t('common.success')}</span>}
      </div>
    </div>
  );
}
