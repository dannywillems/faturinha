import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import it from './it.json';
import nl from './nl.json';
import de from './de.json';
import ptBR from './pt-BR.json';
import ptPT from './pt-PT.json';

const resources = {
  en: { translation: en },
  it: { translation: it },
  nl: { translation: nl },
  de: { translation: de },
  'pt-BR': { translation: ptBR },
  'pt-PT': { translation: ptPT },
};

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pt-BR', name: 'Portugues (Brasil)' },
  { code: 'pt-PT', name: 'Portugues (Portugal)' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'de', name: 'Deutsch' },
];

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
