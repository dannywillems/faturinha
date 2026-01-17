import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { useDb } from '../contexts/TestModeContext';

export function Clients(): ReactElement {
  const { t } = useTranslation();
  const db = useDb();

  const clients = useLiveQuery(
    () => db.clients.orderBy('name').toArray(),
    [db]
  );

  if (!clients) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>{t('clients.title')}</h1>
        <Link to="/clients/new" className="btn btn-primary">
          {t('clients.create')}
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <p>{t('clients.empty')}</p>
          <p className="text-muted">{t('clients.emptyDescription')}</p>
        </div>
      ) : (
        <div className="clients-list">
          <table>
            <thead>
              <tr>
                <th>{t('clients.fields.name')}</th>
                <th>{t('clients.fields.email')}</th>
                <th>{t('clients.fields.phone')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.email ?? '-'}</td>
                  <td>{client.phone ?? '-'}</td>
                  <td>
                    <Link to={`/clients/${client.id}`} className="btn btn-sm">
                      {t('common.edit')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
