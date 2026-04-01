import type { Metadata } from "next";
import "./globals.css";

import { getLandingContent } from "@/features/landing/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const localeTag = locale === "es" ? "es_AR" : "en_US";
  const ogImage = "/brand/lrp-method-logo.png";

  return {
    metadataBase: new URL(siteUrl),
    applicationName: content.brand.name,
    title: content.seo.title,
    description: content.seo.description,
    keywords: [
      "online fitness coaching",
      "personal training",
      "nutrition guidance",
      "coaching online",
      "LRP Method"
    ],
    authors: [{ name: content.brand.name }],
    creator: content.brand.name,
    publisher: content.brand.name,
    category: "fitness",
    alternates: {
      canonical: "/"
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName: content.brand.name,
      title: content.seo.title,
      description: content.seo.description,
      locale: localeTag,
      images: [
        {
          url: ogImage,
          alt: `${content.brand.name} logo`
        },
        {
          url: "/brand/lrp-mark.png",
          alt: `${content.brand.name} mark`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: content.seo.title,
      description: content.seo.description,
      images: [ogImage]
    }
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
