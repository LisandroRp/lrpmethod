import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { getLandingContent } from "@/features/landing/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export default async function ResetPasswordPage() {
  const locale = await getRequestLocale();
  const content = getLandingContent(locale);

  return (
    <div className="bg-canvas text-primary min-h-screen">
      <LandingHeader content={content} showSectionLinks={false} />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-3xl justify-center">
          <Suspense fallback={<div className="text-muted text-sm">...</div>}>
            <ResetPasswordForm authContent={content.auth} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
