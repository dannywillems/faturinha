import type { ReactElement } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTestMode } from '../contexts/TestModeContext';

export function Layout(): ReactElement {
  const { t } = useTranslation();
  const { isTestMode, enterTestMode, exitTestMode, resetTestData } =
    useTestMode();

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
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
