import type { ChangeEvent, ReactElement } from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb, useCompany } from '../contexts/TestModeContext';
import type {
  Settings as SettingsType,
  CurrencyCode,
  Client,
  Invoice,
  DarkMode,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { THEME_PRESETS } from '../utils/themePresets';
import { AVAILABLE_LANGUAGES, detectBrowserLanguage } from '../i18n';

const MAX_LOGO_SIZE_KB = 500;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export function Settings(): ReactElement {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const {
    companies,
    activeCompany,
    createCompany,
    updateCompany,
    deleteCompany,
  } = useCompany();

  const existingSettings = useLiveQuery(() => db.settings.toArray(), [db]);
  const [saved, setSaved] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState<string>('');

  // Get current settings from DB or defaults
  const currentSettings = existingSettings?.[0];
  const settingsId = currentSettings?.id;

  // Memoize browser language detection to avoid recalculating on every render
  const browserLanguage = useMemo(() => detectBrowserLanguage(), []);

  // Sync language with saved locale
  useEffect(() => {
    // Only override i18n language if there's an explicitly saved locale in the database
    // This allows browser language detection to work when no locale has been saved yet
    if (currentSettings?.locale && i18n.language !== currentSettings.locale) {
      i18n.changeLanguage(currentSettings.locale);
    }
  }, [currentSettings?.locale, i18n]);

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
      company: activeCompany
        ? {
            id: activeCompany.id,
            name: activeCompany.name,
          }
        : null,
      clients: await db.clients.toArray(),
      invoices: await db.invoices.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const companySlug = activeCompany
      ? activeCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : 'default';
    a.href = url;
    a.download = `faturinha-${companySlug}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
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

  const handleCreateCompany = async (): Promise<void> => {
    if (!newCompanyName.trim()) return;
    await createCompany(newCompanyName.trim());
    setNewCompanyName('');
  };

  const handleStartEditCompany = (id: string, name: string): void => {
    setEditingCompanyId(id);
    setEditingCompanyName(name);
  };

  const handleSaveCompanyName = (): void => {
    if (editingCompanyId && editingCompanyName.trim()) {
      updateCompany(editingCompanyId, editingCompanyName.trim());
    }
    setEditingCompanyId(null);
    setEditingCompanyName('');
  };

  const handleCancelEditCompany = (): void => {
    setEditingCompanyId(null);
    setEditingCompanyName('');
  };

  const handleDeleteCompany = async (id: string): Promise<void> => {
    if (companies.length <= 1) {
      alert(t('settings.companies.cannotDeleteLast'));
      return;
    }
    if (window.confirm(t('settings.companies.deleteConfirm'))) {
      await deleteCompany(id);
    }
  };

  if (existingSettings === undefined) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <div className="settings-page">
      <h1>{t('settings.title')}</h1>

      <section className="settings-section">
        <h2>{t('settings.companies.title')}</h2>
        <p className="text-muted">{t('settings.companies.description')}</p>

        <div className="company-list">
          {companies.map((company) => (
            <div
              key={company.id}
              className={`company-item ${activeCompany?.id === company.id ? 'active' : ''}`}
            >
              {editingCompanyId === company.id ? (
                <div className="company-edit">
                  <input
                    type="text"
                    value={editingCompanyName}
                    onChange={(e) => setEditingCompanyName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveCompanyName();
                      if (e.key === 'Escape') handleCancelEditCompany();
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveCompanyName}
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={handleCancelEditCompany}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <>
                  <span className="company-name">
                    {company.name}
                    {activeCompany?.id === company.id && (
                      <span className="active-badge">
                        {t('settings.companies.active')}
                      </span>
                    )}
                  </span>
                  <div className="company-actions">
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() =>
                        handleStartEditCompany(company.id, company.name)
                      }
                    >
                      {t('common.edit')}
                    </button>
                    {companies.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="form-group company-create">
          <label>{t('settings.companies.createNew')}</label>
          <div className="company-create-form">
            <input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder={t('settings.companies.namePlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCompany();
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateCompany}
              disabled={!newCompanyName.trim()}
            >
              {t('settings.companies.create')}
            </button>
          </div>
        </div>
      </section>

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
          <label>{t('settings.business.address')}</label>
          <div className="address-fields">
            <input
              type="text"
              id="businessAddress.street"
              placeholder={t('clients.fields.street')}
              value={getValue('businessAddress')?.street ?? ''}
              onChange={(e) => {
                const currentAddress = getValue('businessAddress') ?? {};
                updateField('businessAddress', {
                  ...currentAddress,
                  street: e.target.value,
                });
              }}
            />
            <div className="address-row">
              <input
                type="text"
                id="businessAddress.city"
                placeholder={t('clients.fields.city')}
                value={getValue('businessAddress')?.city ?? ''}
                onChange={(e) => {
                  const currentAddress = getValue('businessAddress') ?? {};
                  updateField('businessAddress', {
                    ...currentAddress,
                    city: e.target.value,
                  });
                }}
              />
              <input
                type="text"
                id="businessAddress.state"
                placeholder={t('clients.fields.state')}
                value={getValue('businessAddress')?.state ?? ''}
                onChange={(e) => {
                  const currentAddress = getValue('businessAddress') ?? {};
                  updateField('businessAddress', {
                    ...currentAddress,
                    state: e.target.value,
                  });
                }}
              />
            </div>
            <div className="address-row">
              <input
                type="text"
                id="businessAddress.postalCode"
                placeholder={t('clients.fields.postalCode')}
                value={getValue('businessAddress')?.postalCode ?? ''}
                onChange={(e) => {
                  const currentAddress = getValue('businessAddress') ?? {};
                  updateField('businessAddress', {
                    ...currentAddress,
                    postalCode: e.target.value,
                  });
                }}
              />
              <input
                type="text"
                id="businessAddress.country"
                placeholder={t('clients.fields.country')}
                value={getValue('businessAddress')?.country ?? ''}
                onChange={(e) => {
                  const currentAddress = getValue('businessAddress') ?? {};
                  updateField('businessAddress', {
                    ...currentAddress,
                    country: e.target.value,
                  });
                }}
              />
            </div>
          </div>
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
          <p className="text-muted">
            Max {MAX_LOGO_SIZE_KB}KB. PNG, JPEG, or SVG.
          </p>
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.theme.title')}</h2>
        <div className="form-group">
          <label>{t('settings.theme.primaryColor')}</label>
          <div className="theme-color-picker">
            <div className="color-presets">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`color-swatch ${getValue('themeColor') === preset.color ? 'active' : ''}`}
                  style={{ backgroundColor: preset.color }}
                  onClick={() => updateField('themeColor', preset.color)}
                  title={preset.name}
                  aria-label={preset.name}
                />
              ))}
            </div>
            <div className="custom-color-section">
              <label>{t('settings.theme.customColor')}</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={getValue('themeColor') ?? DEFAULT_SETTINGS.themeColor}
                  onChange={(e) => updateField('themeColor', e.target.value)}
                />
                <input
                  type="text"
                  value={getValue('themeColor') ?? DEFAULT_SETTINGS.themeColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                      updateField('themeColor', value);
                    }
                  }}
                  placeholder="#2563eb"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>{t('settings.theme.darkMode')}</label>
          <div className="dark-mode-toggle">
            <label className="toggle-label">
              <input
                type="radio"
                name="darkMode"
                value="light"
                checked={getValue('darkMode') === 'light'}
                onChange={() => updateField('darkMode', 'light' as DarkMode)}
              />
              <span className="toggle-option">{t('settings.theme.light')}</span>
            </label>
            <label className="toggle-label">
              <input
                type="radio"
                name="darkMode"
                value="dark"
                checked={getValue('darkMode') === 'dark'}
                onChange={() => updateField('darkMode', 'dark' as DarkMode)}
              />
              <span className="toggle-option">{t('settings.theme.dark')}</span>
            </label>
            <label className="toggle-label">
              <input
                type="radio"
                name="darkMode"
                value="system"
                checked={
                  getValue('darkMode') === 'system' ||
                  getValue('darkMode') === undefined
                }
                onChange={() => updateField('darkMode', 'system' as DarkMode)}
              />
              <span className="toggle-option">
                {t('settings.theme.system')}
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.language.title')}</h2>
        <div className="form-group">
          <label>{t('settings.language.select')}</label>
          <select
            value={currentSettings?.locale ?? browserLanguage}
            onChange={(e) => {
              const newLocale = e.target.value;
              updateField('locale', newLocale);
              i18n.changeLanguage(newLocale);
            }}
          >
            {AVAILABLE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
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
            onChange={(e) => updateField('invoiceNumberPrefix', e.target.value)}
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

      <section className="settings-section">
        <h2>{t('settings.support.title')}</h2>
        <p className="text-muted">{t('settings.support.description')}</p>
        <div className="support-links">
          <a
            href="https://github.com/dannywillems/faturinha/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="support-link"
          >
            <span className="support-icon">🐛</span>
            <div className="support-link-content">
              <span className="support-link-title">
                {t('settings.support.reportBug')}
              </span>
              <span className="support-link-description">
                {t('settings.support.reportBugDescription')}
              </span>
            </div>
          </a>
          <a
            href="https://github.com/dannywillems/faturinha/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="support-link"
          >
            <span className="support-icon">💬</span>
            <div className="support-link-content">
              <span className="support-link-title">
                {t('settings.support.discussions')}
              </span>
              <span className="support-link-description">
                {t('settings.support.discussionsDescription')}
              </span>
            </div>
          </a>
          <a
            href="https://leakix.github.io/sponsor/"
            target="_blank"
            rel="noopener noreferrer"
            className="support-link sponsor-link"
          >
            <span className="support-icon">❤️</span>
            <div className="support-link-content">
              <span className="support-link-title">
                {t('settings.support.sponsor')}
              </span>
              <span className="support-link-description">
                {t('settings.support.sponsorDescription')}
              </span>
            </div>
          </a>
        </div>
        <div className="support-credits">
          <p>
            {t('settings.support.madeBy')}{' '}
            <a
              href="https://leakix.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              LeakIX
            </a>
          </p>
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
