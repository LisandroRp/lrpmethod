import { TbRefresh } from "react-icons/tb";

import { LoadingButton } from "@/components/composed/LoadingButton";

type ChatRefreshButtonProps = {
  label: string;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function ChatRefreshButton({ label, isRefreshing, onRefresh }: ChatRefreshButtonProps) {
  return (
    <LoadingButton
      type="button"
      className="btn-secondary inline-flex items-center gap-2 text-sm"
      onClick={onRefresh}
      isLoading={isRefreshing}
      spinnerClassName="text-accent"
    >
      <TbRefresh className="h-4 w-4" aria-hidden="true" />
      {label}
    </LoadingButton>
  );
}
