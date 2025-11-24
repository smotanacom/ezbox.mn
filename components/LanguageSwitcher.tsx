'use client';

import { useTranslation } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <button
      onClick={() => setLanguage(language === 'mn' ? 'en' : 'mn')}
      className="text-2xl hover:scale-110 transition-transform"
      aria-label={t('language.switch')}
      title={language === 'mn' ? t('language.english') : t('language.mongolian')}
    >
      {language === 'mn' ? '🇬🇧' : '🇲🇳'}
    </button>
  );
}
