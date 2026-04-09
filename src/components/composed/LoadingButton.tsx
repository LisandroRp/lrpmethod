import { ButtonHTMLAttributes, ReactNode } from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  children: ReactNode;
};

export function LoadingButton({ isLoading = false, disabled, children, className = "", ...rest }: LoadingButtonProps) {
  const isDisabled = disabled || isLoading;
  const classes = [
    "inline-flex items-center justify-center gap-2",
    "disabled:cursor-not-allowed disabled:opacity-75",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...rest} disabled={isDisabled} aria-busy={isLoading} className={classes}>
      {isLoading ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-30" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
