import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-tomato-500 text-paper-50 border-2 border-ink-600 shadow-[3px_3px_0_0_var(--color-ink-600)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-ink-600)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-ink-600)]",
  secondary:
    "bg-paper-50 text-ink-700 border-2 border-ink-600 shadow-[3px_3px_0_0_var(--color-ink-600)] hover:bg-ochre-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-ink-600)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-ink-600)]",
  ghost:
    "bg-transparent text-ink-500 border-2 border-transparent hover:border-ink-300 hover:bg-paper-50",
  danger:
    "bg-paper-50 text-tomato-700 border-2 border-tomato-500 shadow-[3px_3px_0_0_var(--color-tomato-500)] hover:bg-tomato-50 hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-tomato-500)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-lg gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-display font-semibold uppercase tracking-wider transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
