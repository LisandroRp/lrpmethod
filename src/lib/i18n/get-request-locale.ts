import { headers } from "next/headers";

import { AppLocale } from "@/features/landing/i18n/types";

const FALLBACK_LOCALE: AppLocale = "en";

function parseAcceptLanguage(acceptLanguage: string | null): AppLocale {
  if (!acceptLanguage) {
    return FALLBACK_LOCALE;
  }

  const languages = acceptLanguage
    .split(",")
    .map((item) => item.trim().toLowerCase().split(";")[0])
    .filter(Boolean);

  for (const lang of languages) {
    if (lang.startsWith("es")) {
      return "es";
    }

    if (lang.startsWith("en")) {
      return "en";
    }
  }

  return FALLBACK_LOCALE;
}

export async function getRequestLocale(): Promise<AppLocale> {
  const requestHeaders = await headers();
  const acceptLanguage = requestHeaders.get("accept-language");
  return parseAcceptLanguage(acceptLanguage);
}
