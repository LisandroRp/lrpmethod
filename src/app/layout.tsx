import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "@/app/AppProviders";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const localeTag = locale === "es" ? "es_AR" : "en_US";
  const ogImage = "/brand/lrp-method-og-wide.png";

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
          url: "/brand/lrp-method-og-square.png",
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
  const content = getLandingContent(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: content.brand.name,
    url: siteUrl,
    logo: `${siteUrl}/brand/lrp-method-og-square.png`,
    email: "contacto@lrpmethod.com",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contacto@lrpmethod.com"
      }
    ],
    sameAs: ["https://www.instagram.com/lrpmethod/"]
  };

  return (
    <html lang={locale}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />
        <AppProviders content={content}>{children}</AppProviders>
      </body>
    </html>
  );
}
