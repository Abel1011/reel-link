type Size = "sm" | "md" | "lg";

interface LoadingSpinnerProps {
  size?: Size;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-tomato-500 border-t-transparent ${sizeClasses[size]} ${className}`}
    />
  );
}
