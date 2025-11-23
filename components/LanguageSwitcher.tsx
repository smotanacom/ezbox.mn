'use client';

import { useTranslation } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage(language === 'mn' ? 'en' : 'mn')}
        className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
        aria-label={t('language.switch')}
      >
        {language === 'mn' ? t('language.english') : t('language.mongolian')}
      </button>
    </div>
  );
}
