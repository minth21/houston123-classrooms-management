// lib/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector"; // 1. Import LanguageDetector

// Lấy tài nguyên từ các file JSON
import translationEN from '@/../public/locales/en/translation.json';
import translationVI from '@/../public/locales/vi/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  vi: {
    translation: translationVI,
  },
};

i18n
  .use(LanguageDetector) // 2. Thêm LanguageDetector vào
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "vi", // Ngôn ngữ dự phòng

    // 3. Thêm cấu hình detection để lưu lựa chọn
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
