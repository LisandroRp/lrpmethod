import { ButtonHTMLAttributes, ReactNode } from "react";
import { TbLoader2 } from "react-icons/tb";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  spinnerClassName?: string;
  children: ReactNode;
};

export function LoadingButton({ isLoading = false, spinnerClassName = "", disabled, children, className = "", ...rest }: LoadingButtonProps) {
  const isDisabled = disabled || isLoading;
  const classes = [
    "relative inline-flex items-center justify-center",
    "disabled:cursor-not-allowed disabled:opacity-75",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...rest} disabled={isDisabled} aria-busy={isLoading} className={classes}>
      <span className={`inline-flex items-center justify-center gap-2 ${isLoading ? "opacity-0" : ""}`}>
        {children}
      </span>
      {isLoading ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <TbLoader2 className={`h-4 w-4 animate-spin ${spinnerClassName}`} />
        </span>
      ) : null}
    </button>
  );
}
