// components
import React from "react";
import { cn } from "../../utils/cn";

// internal components
import { Button } from "./Button";

/**
 * Error action interface
 */
export interface ErrorAction {
  /** Action button label */
  label: string;
  /** Action handler */
  onClick: () => void;
  /** Button variant */
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost";
  /** Whether action is loading */
  loading?: boolean;
}

/**
 * ErrorState component props
 */
export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message */
  message: string;
  /** Optional error details */
  details?: string;
  /** Action buttons */
  actions?: ErrorAction[];
  /** Error icon */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Error severity */
  severity?: "error" | "warning" | "info";
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  details,
  actions = [],
  icon,
  className,
  severity = "error",
}) => {
  // Default icons for different severities
  const defaultIcons = {
    error: (
      <svg
        className="w-12 h-12 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    ),
    warning: (
      <svg
        className="w-12 h-12 text-yellow-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
    info: (
      <svg
        className="w-12 h-12 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    ),
  };

  const severityStyles = {
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  return (
    <div className={cn("text-center py-12", className)}>
      {/* Icon */}
      <div className="flex justify-center mb-4">
        {icon || defaultIcons[severity]}
      </div>

      {/* Title */}
      {title && (
        <h3
          className={cn("text-lg font-semibold mb-2", severityStyles[severity])}
        >
          {title}
        </h3>
      )}

      {/* Message */}
      <p className={cn("mb-4", severityStyles[severity])}>{message}</p>

      {/* Details */}
      {details && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {details}
        </p>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-col flex-row gap-3 justify-center">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || "primary"}
              loading={action.loading}
              className="min-w-[120px]"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ErrorState;
