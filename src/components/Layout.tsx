import type { ReactElement } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTestMode, useDb, useCompany } from '../contexts/TestModeContext';
import { DEFAULT_SETTINGS } from '../types';
import type { DarkMode } from '../types';
import { generateHoverColor, generateLightColor } from '../utils/themePresets';
import { Footer } from './Footer';

export function Layout(): ReactElement {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { isTestMode, enterTestMode, exitTestMode, resetTestData } =
    useTestMode();
  const { companies, activeCompany, switchCompany } = useCompany();

  const settings = useLiveQuery(() => db.settings.toArray(), [db]);
  const themeColor =
    settings?.[0]?.themeColor ?? DEFAULT_SETTINGS.themeColor ?? '#2563eb';
  const savedLocale = settings?.[0]?.locale ?? DEFAULT_SETTINGS.locale;
  const darkMode: DarkMode =
    settings?.[0]?.darkMode ?? DEFAULT_SETTINGS.darkMode ?? 'system';

  // Track system preference for dark mode
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent): void => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine the effective theme
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (darkMode === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return darkMode;
  }, [darkMode, systemPrefersDark]);

  // Apply dark mode
  useEffect(() => {
    const theme = getEffectiveTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, [getEffectiveTheme]);

  // Apply theme color
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', themeColor);
    root.style.setProperty(
      '--color-primary-hover',
      generateHoverColor(themeColor)
    );
    root.style.setProperty(
      '--color-primary-light',
      generateLightColor(themeColor)
    );
  }, [themeColor]);

  // Apply saved language
  useEffect(() => {
    if (savedLocale && i18n.language !== savedLocale) {
      i18n.changeLanguage(savedLocale);
    }
  }, [savedLocale, i18n]);

  const handleEnterTestMode = async (): Promise<void> => {
    await enterTestMode();
  };

  const handleExitTestMode = (): void => {
    exitTestMode();
  };

  const handleResetTestData = async (): Promise<void> => {
    if (window.confirm(t('testMode.resetConfirm'))) {
      await resetTestData();
    }
  };

  const handleCompanyChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    switchCompany(e.target.value);
  };

  return (
    <div className={`app-layout ${isTestMode ? 'test-mode' : ''}`}>
      {isTestMode && (
        <div className="test-mode-banner">
          <span>{t('testMode.banner')}</span>
          <div className="test-mode-actions">
            <button
              type="button"
              className="btn btn-sm btn-reset"
              onClick={handleResetTestData}
            >
              {t('testMode.reset')}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-exit"
              onClick={handleExitTestMode}
            >
              {t('testMode.exit')}
            </button>
          </div>
        </div>
      )}
      <nav className="sidebar">
        <div className="logo">
          <h1>{t('app.name')}</h1>
          {isTestMode && <span className="test-badge">TEST</span>}
        </div>
        {companies.length > 0 && (
          <div className="company-switcher">
            <select
              value={activeCompany?.id ?? ''}
              onChange={handleCompanyChange}
              className="company-select"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <ul className="nav-links">
          <li>
            <NavLink to="/" end>
              {t('nav.dashboard')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/invoices">{t('nav.invoices')}</NavLink>
          </li>
          <li>
            <NavLink to="/clients">{t('nav.clients')}</NavLink>
          </li>
          <li>
            <NavLink to="/settings">{t('nav.settings')}</NavLink>
          </li>
        </ul>
        {!isTestMode && (
          <div className="sidebar-footer">
            <button
              type="button"
              className="btn btn-sm btn-test-mode"
              onClick={handleEnterTestMode}
            >
              {t('testMode.enter')}
            </button>
          </div>
        )}
      </nav>
      <div className="main-wrapper">
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
