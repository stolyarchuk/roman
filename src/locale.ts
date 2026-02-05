import { LocaleKey } from "./content";

const RU_LOCALE: LocaleKey = "ru";
const EN_LOCALE: LocaleKey = "en";

const isLocale = (value: string | undefined): value is LocaleKey => {
  return value === RU_LOCALE || value === EN_LOCALE;
};

const getBrowserLocale = (): LocaleKey => {
  const language =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    EN_LOCALE;
  return /^ru\b/i.test(language) ? RU_LOCALE : EN_LOCALE;
};

const normalizeLocalePath = (locale: LocaleKey): string => `/${locale}/`;

export {
  EN_LOCALE,
  RU_LOCALE,
  getBrowserLocale,
  isLocale,
  normalizeLocalePath,
};
