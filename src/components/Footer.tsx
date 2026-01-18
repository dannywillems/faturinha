import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WhatsNew } from './WhatsNew';

export function Footer(): ReactElement {
  const { t } = useTranslation();
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="app-footer">
        <div className="footer-left">
          <span className="copyright">
            &copy; {currentYear} Faturinha
          </span>
        </div>
        <div className="footer-right">
          <span className="version-info">
            v{__APP_VERSION__}
            <span className="commit-hash" title={t('footer.commitHash')}>
              ({__GIT_COMMIT__})
            </span>
          </span>
          <button
            type="button"
            className="whats-new-link"
            onClick={() => setShowWhatsNew(true)}
          >
            {t('footer.whatsNew')}
          </button>
        </div>
      </footer>
      {showWhatsNew && <WhatsNew onClose={() => setShowWhatsNew(false)} />}
    </>
  );
}
