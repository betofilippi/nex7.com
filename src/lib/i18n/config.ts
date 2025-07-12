import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['en', 'es', 'pt', 'fr', 'de', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  ar: 'العربية',
};

export const rtlLocales: Locale[] = ['ar'];

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation({
  locales,
});

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}