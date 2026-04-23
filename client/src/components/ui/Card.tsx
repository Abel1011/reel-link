import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Subtle hover lift (previous "hoverGlow" kept for compatibility) */
  hoverGlow?: boolean;
  /** Use tomato accent instead of default ink shadow */
  accent?: "ink" | "tomato" | "sage" | "ochre";
  children: ReactNode;
}

const accentShadow: Record<Required<CardProps>["accent"], string> = {
  ink: "shadow-[4px_4px_0_0_var(--color-ink-600)]",
  tomato: "shadow-[4px_4px_0_0_var(--color-tomato-500)]",
  sage: "shadow-[4px_4px_0_0_var(--color-sage-400)]",
  ochre: "shadow-[4px_4px_0_0_var(--color-ochre-400)]",
};
const accentBorder: Record<Required<CardProps>["accent"], string> = {
  ink: "border-ink-600",
  tomato: "border-tomato-500",
  sage: "border-sage-400",
  ochre: "border-ochre-400",
};

export function Card({
  hoverGlow = false,
  accent = "ink",
  onClick,
  children,
  className = "",
  ...props
}: CardProps) {
  const interactive = !!onClick;

  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      className={`relative rounded-xl border-2 bg-paper-50 p-5 text-ink-700 transition-all duration-150 ${
        accentBorder[accent]
      } ${accentShadow[accent]} ${
        interactive ? "cursor-pointer" : ""
      } ${
        hoverGlow || interactive
          ? "hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--color-ink-600)]"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
