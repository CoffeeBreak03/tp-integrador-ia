import { ref } from 'vue';
import { translations } from '@/i18n';

export type Language = 'es' | 'en';

const savedLang = localStorage.getItem('lang') as Language;
const lang = ref<Language>(savedLang === 'en' ? 'en' : 'es');

export function useI18n() {
  const setLang = (newLang: Language) => {
    lang.value = newLang;
    localStorage.setItem('lang', newLang);
  };

  const t = (key: keyof typeof translations['es'], params?: Record<string, string | number>): string => {
    const dictionary = translations[lang.value] || translations['es'];
    let text = dictionary[key] || translations['es'][key] || key;
    
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      }
    }
    
    return text;
  };

  return {
    lang,
    setLang,
    t
  };
}
