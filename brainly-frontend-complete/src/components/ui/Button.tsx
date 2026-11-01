import type { ReactNode } from "react";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  danger?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

const base = "rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none";

export function Button({ children, onClick, variant = "primary", danger, className = "", type = "button", disabled = false }: ButtonProps) {
  if (variant === "ghost") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} border bg-white font-medium ${
          danger ? "border-danger-tint text-danger" : "border-line text-ink hover:bg-paper"
        } ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} bg-brand text-white hover:bg-brand-dark ${className}`}
    >
      {children}
    </button>
  );
}
