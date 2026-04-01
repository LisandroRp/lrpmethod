import type { Metadata } from "next";
import "./globals.css";

import { getLandingContent } from "@/features/landing/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);

  return {
    title: content.seo.title,
    description: content.seo.description
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
