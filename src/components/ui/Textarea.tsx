import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

/**
 * Textarea component props
 */
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = "default",
      size = "md",
      fullWidth = true,
      loading = false,
      showCharCount = false,
      maxLength,
      className,
      id,
      disabled,
      required,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0);

    // Generate unique ID
    const uniqueId = React.useId();
    const textareaId = id || `textarea-${uniqueId}`;
    const errorId = `${textareaId}-error`;
    const helperTextId = `${textareaId}-helper`;

    // Update character count when value changes
    useEffect(() => {
      const currentValue = value || "";
      setCharCount(typeof currentValue === "string" ? currentValue.length : 0);
    }, [value]);

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
      sm: "px-3 py-1.5 text-sm min-h-[80px]",
      md: "px-3 py-2 text-sm min-h-[100px]",
      lg: "px-4 py-3 text-base min-h-[120px]",
    };

    // Error styles
    const errorStyles = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "";

    // Disabled styles
    const disabledStyles =
      disabled || loading ? "opacity-60 cursor-not-allowed bg-gray-50" : "";

    // Character count color based on proximity to limit
    const getCharCountColor = () => {
      if (!maxLength) return "text-gray-500";
      const percentage = (charCount / maxLength) * 100;
      if (percentage >= 95) return "text-red-600";
      if (percentage >= 80) return "text-yellow-600";
      return "text-gray-500";
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;

      // Enforce max length if specified
      if (maxLength && newValue.length > maxLength) {
        return; // Don't update if exceeding max length
      }

      setCharCount(newValue.length);
      onChange?.(e);
    };

    return (
      <div className={cn("space-y-1", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
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

        {/* Textarea wrapper */}
        <div className="relative">
          {/* Textarea */}
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled || loading}
            required={required}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={cn(error && errorId, helperText && helperTextId)}
            className={cn(
              // Base styles
              "block w-full rounded-lg border shadow-sm transition-colors duration-200",
              "focus:outline-none focus:ring-1 resize-vertical",
              "dark:bg-gray-800 dark:text-white dark:border-gray-600",

              // Variant styles
              !error && variantStyles[variant],

              // Size styles
              sizeStyles[size],

              // State styles
              errorStyles,
              disabledStyles,

              // Dark mode
              "dark:focus:border-primary-500 dark:focus:ring-primary-500",

              className
            )}
            {...props}
          />

          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-500" />
            </div>
          )}
        </div>

        {/* Character count, error message, and helper text container */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
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

          {/* Character count */}
          {(showCharCount || maxLength) && (
            <div
              className={cn(
                "text-xs font-medium ml-2 flex-shrink-0",
                getCharCountColor()
              )}
            >
              {maxLength ? (
                <span>
                  {charCount}/{maxLength}
                </span>
              ) : (
                <span>{charCount} characters</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
