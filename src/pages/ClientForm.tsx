import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useDb } from '../contexts/TestModeContext';
import type { Client } from '../types';

export function ClientForm(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<
    Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
  >({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    vatNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      db.clients.get(Number(id)).then((client) => {
        if (client) {
          setFormData({
            name: client.name,
            email: client.email ?? '',
            phone: client.phone ?? '',
            address: client.address ?? {
              street: '',
              city: '',
              state: '',
              postalCode: '',
              country: '',
            },
            vatNumber: client.vatNumber ?? '',
            notes: client.notes ?? '',
          });
        }
      });
    }
  }, [id, db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const clientData: Omit<Client, 'id'> = {
      ...formData,
      createdAt: now,
      updatedAt: now,
    };

    if (isEditing && id) {
      const existingClient = await db.clients.get(Number(id));
      await db.clients.update(Number(id), {
        ...clientData,
        createdAt: existingClient?.createdAt ?? now,
      });
    } else {
      await db.clients.add(clientData as Client);
    }

    navigate('/clients');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.replace('address.', '');
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDelete = async () => {
    if (id && window.confirm(t('common.confirmDelete'))) {
      await db.clients.delete(Number(id));
      navigate('/clients');
    }
  };

  return (
    <div className="client-form-page">
      <div className="page-header">
        <h1>{isEditing ? t('clients.edit') : t('clients.create')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="name">{t('clients.fields.name')} *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">{t('clients.fields.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t('clients.fields.phone')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vatNumber">{t('clients.fields.vatNumber')}</label>
            <input
              type="text"
              id="vatNumber"
              name="vatNumber"
              value={formData.vatNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>{t('clients.fields.address')}</h3>

          <div className="form-group">
            <label htmlFor="address.street">{t('clients.fields.street')}</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address?.street}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.city">{t('clients.fields.city')}</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address?.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address.state">{t('clients.fields.state')}</label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address?.state}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.postalCode">
                {t('clients.fields.postalCode')}
              </label>
              <input
                type="text"
                id="address.postalCode"
                name="address.postalCode"
                value={formData.address?.postalCode}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address.country">
                {t('clients.fields.country')}
              </label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address?.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="notes">{t('clients.fields.notes')}</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/clients')}
          >
            {t('common.cancel')}
          </button>
          {isEditing && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
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
