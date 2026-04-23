import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  step: string; // "Step 01", etc
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  right?: ReactNode;
}

export function PageHeader({ step, title, subtitle, icon: Icon, right }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b-2 border-dashed border-ink-200 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tomato-500">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-tomato-500" />
          {step}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink-600 bg-paper-50 text-ink-700 shadow-[3px_3px_0_0_var(--color-tomato-500)] sm:flex">
            <Icon className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-semibold leading-tight text-ink-700 sm:text-4xl md:text-5xl">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-ink-400 sm:mt-3 sm:text-[15px]">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
