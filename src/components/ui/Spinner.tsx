// components
import React from "react";
import { cn } from "../../utils/cn";

/**
 * Spinner component props
 */
export interface SpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Color variant */
  variant?: "primary" | "secondary" | "white" | "gray";
  /** Custom CSS classes */
  className?: string;
  /** Loading text to display */
  text?: string;
  /** Whether to center the spinner */
  center?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  variant = "primary",
  className,
  text,
  center = false,
}) => {
  // Size classes
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  // Variant classes
  const variantClasses = {
    primary: "border-primary-200 border-t-primary-600",
    secondary:
      "border-gray-200 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300",
    white: "border-white/30 border-t-white",
    gray: "border-gray-300 border-t-gray-600",
  };

  // Text size classes
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const spinnerElement = (
    <div
      className={cn(
        "animate-spin rounded-full border-2",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label={text || "Loading"}
    >
      <span className="sr-only">{text || "Loading"}</span>
    </div>
  );

  if (center) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 p-6">
        {spinnerElement}
        {text && (
          <p
            className={cn(
              "text-gray-600 dark:text-gray-400",
              textSizeClasses[size]
            )}
          >
            {text}
          </p>
        )}
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex items-center space-x-3">
        {spinnerElement}
        <span
          className={cn(
            "text-gray-600 dark:text-gray-400",
            textSizeClasses[size]
          )}
        >
          {text}
        </span>
      </div>
    );
  }

  return spinnerElement;
};

export default Spinner;
