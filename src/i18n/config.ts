import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import ca from './locales/ca.json';

i18n
  .use(LanguageDetector) // Detecta el idioma del navegador
  .use(initReactI18next) // Pasa i18n a react-i18next
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      ca: { translation: ca }
    },
    fallbackLng: 'es', // Idioma por defecto
    debug: false,
    interpolation: {
      escapeValue: false // React ya escapa por defecto
    },
    detection: {
      order: ['localStorage', 'navigator'], // Prioriza localStorage, luego navegador
      caches: ['localStorage'] // Guarda la preferencia en localStorage
    }
  });

export default i18n;
