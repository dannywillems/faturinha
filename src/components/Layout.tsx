import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Layout() {
  const { t } = useTranslation();

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="logo">
          <h1>{t('app.name')}</h1>
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
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
