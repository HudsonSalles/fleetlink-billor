// components
import React from "react";
import { cn } from "../../utils/cn";

// internal components
import Spinner from "./Spinner";

/**
 * LoadingState component props
 */
export interface LoadingStateProps {
  /** Custom message to display */
  message?: string;
  /** Size of the loading state */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether to show as overlay */
  overlay?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Whether to show animated backdrop */
  backdrop?: boolean;
  /** Custom icon to show instead of spinner */
  icon?: React.ReactNode;
  /** Whether to center vertically in viewport */
  fullScreen?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  size = "md",
  overlay = false,
  className,
  backdrop = true,
  icon,
  fullScreen = false,
}) => {
  // Size classes for containers
  const containerSizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-12",
  };

  // Message size classes
  const messageSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {icon || <Spinner size={size} variant="primary" />}
      <div className="text-center">
        <p
          className={cn(
            "text-gray-600 dark:text-gray-400 font-medium",
            messageSizeClasses[size]
          )}
        >
          {message}
        </p>
      </div>
    </div>
  );

  if (overlay || fullScreen) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          backdrop && "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm",
          className
        )}
        role="dialog"
        aria-label={message}
        aria-modal="true"
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center",
            "bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
            containerSizeClasses[size]
          )}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        containerSizeClasses[size],
        className
      )}
      role="status"
      aria-label={message}
    >
      {content}
    </div>
  );
};

export default LoadingState;
