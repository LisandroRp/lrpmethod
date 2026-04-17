import { LandingContent } from "@/features/landing/i18n/types";

type AvatarProps = {
    content: LandingContent;
    iconClassName?: string;
    containerClassName?:string;
};

export function Avatar({ containerClassName, iconClassName, content }: AvatarProps) {
  return (
              <div
                className={`user-menu-trigger h-8 w-8 ${containerClassName}`}
              >
                <svg viewBox="0 0 24 24" className={`h-5 w-full ${iconClassName}`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M4 20.1C4.7 16.7 7.7 14.5 12 14.5C16.3 14.5 19.3 16.7 20 20.1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
  );
}
