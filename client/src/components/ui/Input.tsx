import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const labelClasses =
  "font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400";

const baseClasses =
  "w-full bg-paper-50 border-2 border-ink-300 text-ink-700 placeholder-ink-200 rounded-lg px-3 py-2 text-sm font-body transition-all duration-150 outline-none focus:border-tomato-500 focus:shadow-[2px_2px_0_0_var(--color-tomato-500)]";

export function Input({ label, id, className = "", ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      )}
      <input id={inputId} className={`${baseClasses} ${className}`} {...props} />
    </div>
  );
}

export function Textarea({ label, id, className = "", ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`${baseClasses} min-h-[80px] resize-y leading-relaxed ${className}`}
        {...props}
      />
    </div>
  );
}
