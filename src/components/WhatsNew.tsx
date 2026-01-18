import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Release {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

interface ReleasesData {
  releases: Release[];
}

interface WhatsNewProps {
  onClose: () => void;
}

export function WhatsNew({ onClose }: WhatsNewProps): ReactElement {
  const { t } = useTranslation();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async (): Promise<void> => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}releases.json`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch releases');
        }
        const data: ReleasesData = await response.json();
        setReleases(data.releases);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal whats-new-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{t('whatsNew.title')}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          {loading && <p className="loading">{t('common.loading')}</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <div className="releases-list">
              {releases.map((release) => (
                <div key={release.version} className="release-item">
                  <div className="release-header">
                    <h3 className="release-title">
                      {release.title}
                      <span className="release-version">
                        v{release.version}
                      </span>
                    </h3>
                    <span className="release-date">
                      {formatDate(release.date)}
                    </span>
                  </div>
                  <ul className="release-changes">
                    {release.changes.map((change, index) => (
                      <li key={index}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
