import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { zh } from './zh';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            zh: { translation: zh },
        },
        lng: 'zh', // Force Chinese
        fallbackLng: 'zh',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
