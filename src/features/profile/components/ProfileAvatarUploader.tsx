"use client";

import { ChangeEvent, useRef, useState } from "react";
import { TbCheck, TbPencil, TbX } from "react-icons/tb";

import { useAccount } from "@/features/contexts/AccountContext";
import { Avatar } from "@/features/landing/components/Avatar";
import { LandingContent } from "@/features/landing/i18n/types";

type ProfileAvatarUploaderProps = {
  content: LandingContent;
  initialAvatarUrl: string | null;
  uploadLabel: string;
  uploadingLabel: string;
  confirmUploadLabel: string;
  cancelUploadLabel: string;
  uploadErrorMessage: string;
};

type UploadAvatarResponse = {
  ok: boolean;
  avatarUrl?: string;
  error?: string;
};

export function ProfileAvatarUploader({
  content,
  initialAvatarUrl,
  uploadLabel,
  uploadingLabel,
  confirmUploadLabel,
  cancelUploadLabel,
  uploadErrorMessage
}: ProfileAvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { refreshAccount } = useAccount();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }

    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    setErrorMessage(null);
  }

  function handleCancelUpload() {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }

    setPendingFile(null);
    setPendingPreviewUrl(null);
    setErrorMessage(null);
  }

  async function handleConfirmUpload() {
    if (!pendingFile) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", pendingFile);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as UploadAvatarResponse;

      if (!response.ok || !payload.ok || !payload.avatarUrl) {
        throw new Error(payload.error ?? uploadErrorMessage);
      }

      setAvatarUrl(payload.avatarUrl);
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
      setPendingFile(null);
      setPendingPreviewUrl(null);
      await refreshAccount({ silent: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : uploadErrorMessage);
    } finally {
      setIsUploading(false);
    }
  }

  const visibleAvatarUrl = pendingPreviewUrl ?? avatarUrl;

  return (
    <div className="profile-avatar-field">
      <button
        type="button"
        className="profile-avatar-button group"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label={isUploading ? uploadingLabel : uploadLabel}
      >
        <Avatar content={content} avatarUrl={visibleAvatarUrl} containerClassName="h-20 w-20 flex-shrink-0" iconClassName="h-14 w-14" />
        <span className="profile-avatar-overlay" aria-hidden="true">
          <TbPencil className="h-5 w-5" />
        </span>
      </button>
      {pendingFile ? (
        <div className="profile-avatar-actions">
          <button
            type="button"
            className="profile-avatar-action"
            onClick={handleCancelUpload}
            disabled={isUploading}
            aria-label={cancelUploadLabel}
          >
            <TbX className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="profile-avatar-action profile-avatar-action-confirm"
            onClick={handleConfirmUpload}
            disabled={isUploading}
            aria-label={confirmUploadLabel}
          >
            <TbCheck className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={handleAvatarChange}
      />
      {isUploading ? <p className="text-muted mt-2 text-xs">{uploadingLabel}</p> : null}
      {errorMessage ? <p className="text-accent mt-2 text-xs">{errorMessage}</p> : null}
    </div>
  );
}
