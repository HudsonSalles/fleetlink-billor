// components
import React from "react";
import { cn } from "../../utils/cn";

/**
 * Input component props
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      variant = "default",
      size = "md",
      fullWidth = true,
      loading = false,
      className,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    // Generate unique ID
    const uniqueId = React.useId();
    const inputId = id || `input-${uniqueId}`;
    const errorId = `${inputId}-error`;
    const helperTextId = `${inputId}-helper`;

    // Variant styles
    const variantStyles = {
      default:
        "border-gray-300 bg-white focus:border-primary-500 focus:ring-primary-500",
      filled:
        "border-transparent bg-gray-100 focus:bg-white focus:border-primary-500 focus:ring-primary-500",
      outlined:
        "border-2 border-gray-300 bg-transparent focus:border-primary-500 focus:ring-0",
    };

    // Size styles
    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    };

    // Error styles
    const errorStyles = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "";

    // Disabled styles
    const disabledStyles =
      disabled || loading ? "opacity-60 cursor-not-allowed bg-gray-50" : "";

    return (
      <div className={cn("space-y-1", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium text-gray-700 dark:text-gray-300",
              disabled && "opacity-60"
            )}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled || loading}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={cn(error && errorId, helperText && helperTextId)}
            className={cn(
              // Base styles
              "block w-full rounded-lg border shadow-sm transition-colors duration-200",
              "placeholder:text-gray-400 focus:outline-none focus:ring-1",
              "dark:text-white dark:placeholder:text-gray-500",

              // Hide number input spinners
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",

              // Variant styles
              variantStyles[variant],

              // Size styles
              sizeStyles[size],

              // Icon padding
              icon && "pl-10",

              // Loading padding
              loading && "pr-10",

              // State styles
              errorStyles,
              disabledStyles,

              // Dark mode
              "dark:bg-gray-800 dark:border-gray-600",
              "dark:focus:border-primary-500 dark:focus:ring-primary-500",

              className
            )}
            {...props}
          />

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-500" />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p
            id={helperTextId}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
