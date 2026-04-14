import Image from "next/image";

import { SectionContainer } from "@/features/landing/components/SectionContainer";
import { LandingContent } from "@/features/landing/i18n/types";

type FooterSectionProps = {
  content: LandingContent;
};

export function FooterSection({ content }: FooterSectionProps) {
  return (
    <footer className="bg-surface border-subtle border-t py-8">
      <SectionContainer>
        <Image src="/brand/lrp-mark.png" alt="LRP Method mark" width={34} height={34} className="h-8 w-8 object-contain" />
        <div className="mt-4 flex flex-col items-start gap-2 text-xs sm:text-sm">
          <a href={content.contact.instagramHref} target="_blank" rel="noopener noreferrer" className="header-link inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
            <span>@lrpmethod</span>
          </a>
          <a href={content.contact.emailHref} className="header-link inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4.5 7L12 13L19.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>contacto@lrpmethod.com</span>
          </a>
        </div>
        <p className="text-muted mt-3 text-xs leading-relaxed">{content.footer.disclaimer}</p>
        <p className="text-faint mt-3 text-xs">
          © {new Date().getFullYear()} {content.brand.name}. {content.footer.rights}
        </p>
      </SectionContainer>
    </footer>
  );
}
