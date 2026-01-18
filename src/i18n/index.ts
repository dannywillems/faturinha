import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fr from './fr.json';
import it from './it.json';
import nl from './nl.json';
import de from './de.json';
import ptBR from './pt-BR.json';
import ptPT from './pt-PT.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  it: { translation: it },
  nl: { translation: nl },
  de: { translation: de },
  'pt-BR': { translation: ptBR },
  'pt-PT': { translation: ptPT },
};

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Francais' },
  { code: 'pt-BR', name: 'Portugues (Brasil)' },
  { code: 'pt-PT', name: 'Portugues (Portugal)' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'de', name: 'Deutsch' },
];

/**
 * Detects the user's browser language and returns the best matching supported language.
 * Falls back to 'en' if no match is found.
 */
function detectBrowserLanguage(): string {
  // navigator.language is the standard property, userLanguage is legacy IE
  const browserLang =
    navigator.language ||
    (navigator as { userLanguage?: string }).userLanguage ||
    'en';
  const supportedCodes = AVAILABLE_LANGUAGES.map((lang) => lang.code);

  // First, try exact match
  if (supportedCodes.includes(browserLang)) {
    return browserLang;
  }

  // Try to match the base language (e.g., 'pt' from 'pt-BR')
  const baseLang = browserLang.split('-')[0];

  // Check for language variants (e.g., if browser is 'pt', prefer 'pt-BR' or 'pt-PT')
  const variantMatch = supportedCodes.find((code) =>
    code.startsWith(baseLang + '-')
  );
  if (variantMatch) {
    return variantMatch;
  }

  // Check if base language is supported
  if (supportedCodes.includes(baseLang)) {
    return baseLang;
  }

  // Default to English
  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectBrowserLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
