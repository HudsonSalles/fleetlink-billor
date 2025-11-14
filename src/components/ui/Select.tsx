// components
import React from "react";
import { cn } from "../../utils/cn";

/**
 * Select option interface
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Select component props
 */
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
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
    const selectId = id || `select-${uniqueId}`;
    const errorId = `${selectId}-error`;
    const helperTextId = `${selectId}-helper`;

    // Size styles
    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    };

    // Error styles
    const errorStyles = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-primary-500 focus:ring-primary-500";

    // Disabled styles
    const disabledStyles =
      disabled || loading ? "opacity-60 cursor-not-allowed bg-gray-50" : "";

    // Group options by group property
    const groupedOptions = options.reduce(
      (acc, option) => {
        const group = option.group || "default";
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(option);
        return acc;
      },
      {} as Record<string, SelectOption[]>
    );

    const hasGroups =
      Object.keys(groupedOptions).length > 1 ||
      (Object.keys(groupedOptions).length === 1 && !groupedOptions.default);

    return (
      <div className={cn("space-y-1", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
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

        {/* Select wrapper */}
        <div className="relative">
          {/* Select */}
          <select
            ref={ref}
            id={selectId}
            disabled={disabled || loading}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={cn(error && errorId, helperText && helperTextId)}
            className={cn(
              // Base styles
              "block w-full rounded-lg border shadow-sm transition-colors duration-200",
              "focus:outline-none focus:ring-1 appearance-none",
              "bg-white dark:bg-gray-800 dark:text-white",
              "pr-10", // Space for dropdown arrow

              // Size styles
              sizeStyles[size],

              // State styles
              errorStyles,
              disabledStyles,

              // Dark mode
              "dark:border-gray-600",
              "dark:focus:border-primary-500 dark:focus:ring-primary-500",

              className
            )}
            {...props}
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}

            {/* Render options */}
            {hasGroups
              ? // Grouped options
                Object.entries(groupedOptions).map(([group, groupOptions]) =>
                  group === "default" ? (
                    groupOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <optgroup key={group} label={group}>
                      {groupOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  )
                )
              : // Flat options
                options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
          </select>

          {/* Dropdown arrow or loading indicator */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-500" />
            ) : (
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
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

Select.displayName = "Select";

export default Select;
