// Translation key type - all translation IDs
export type TranslationKey = keyof typeof import('../translations/en').translations;

// Translation object structure
export type Translations = {
  [key: string]: string;
};

// Supported languages
export type Language = 'mn' | 'en';
