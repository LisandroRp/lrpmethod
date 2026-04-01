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
        <p className="text-muted mt-3 text-xs leading-relaxed">{content.footer.disclaimer}</p>
        <p className="text-faint mt-3 text-xs">
          © {new Date().getFullYear()} {content.brand.name}. {content.footer.rights}
        </p>
      </SectionContainer>
    </footer>
  );
}
