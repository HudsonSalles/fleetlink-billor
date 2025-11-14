// components
import React from "react";
import { cn } from "../../utils/cn";

/**
 * Button variant types
 */
type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost";

/**
 * Button size types
 */
type ButtonSize = "sm" | "md" | "lg";

/**
 * Button component props
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Whether button is loading */
  loading?: boolean;
  /** Whether button is full width */
  fullWidth?: boolean;
  /** Icon to display before text */
  startIcon?: React.ReactNode;
  /** Icon to display after text */
  endIcon?: React.ReactNode;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Gets the CSS classes for a button variant
 *
 * @param {ButtonVariant} variant - The button variant
 * @returns {string} CSS classes for the variant
 */
const getVariantClasses = (variant: ButtonVariant): string => {
  const variants = {
    primary:
      "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-700",
    secondary:
      "bg-secondary-100 text-primary-900 hover:bg-secondary-200 focus:ring-secondary-300 dark:bg-secondary-800 dark:text-primary-50 dark:hover:bg-secondary-700",
    destructive:
      "bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500",
    outline:
      "border border-primary-300 bg-transparent text-primary-700 hover:bg-primary-50 focus:ring-primary-500 dark:border-primary-600 dark:text-primary-300 dark:hover:bg-primary-900",
    ghost:
      "text-primary-700 hover:bg-primary-100 focus:ring-primary-500 dark:text-primary-300 dark:hover:bg-primary-800",
  };

  return variants[variant];
};

/**
 * Gets the CSS classes for a button size
 *
 * @param {ButtonSize} size - The button size
 * @returns {string} CSS classes for the size
 */
const getSizeClasses = (size: ButtonSize): string => {
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return sizes[size];
};

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC<{ className?: string }> = ({
  className = "h-4 w-4",
}) => (
  <svg
    className={cn("animate-spin", className)}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variantClasses = getVariantClasses(variant);
    const sizeClasses = getSizeClasses(size);

    const buttonClasses = cn(
      baseClasses,
      variantClasses,
      sizeClasses,
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <LoadingSpinner
            className={cn("mr-2", size === "sm" ? "h-3 w-3" : "h-4 w-4")}
          />
        )}
        {children}
      </button>
    );
  }
);

// Set display name for debugging
Button.displayName = "Button";

export default Button;
