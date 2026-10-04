import { TbUser } from "react-icons/tb";

import { LandingContent } from "@/features/landing/i18n/types";

type AvatarProps = {
  content: LandingContent;
  iconClassName?: string;
  containerClassName?: string;
  avatarUrl?: string | null;
};

export function Avatar({ containerClassName, iconClassName, content, avatarUrl }: AvatarProps) {
  const imageStyle = avatarUrl
    ? {
        backgroundImage: `url("${avatarUrl}")`
      }
    : undefined;

  return (
    <div
      className={`user-menu-trigger h-8 w-8 overflow-hidden bg-cover bg-center ${containerClassName ?? ""}`}
      role={avatarUrl ? "img" : undefined}
      aria-label={avatarUrl ? content.auth.accountLabel : undefined}
      style={imageStyle}
    >
      {avatarUrl ? null : <TbUser className={`h-5 w-full ${iconClassName ?? ""}`} aria-hidden="true" />}
    </div>
  );
}
