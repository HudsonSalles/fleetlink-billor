// components
import React from "react";
import { cn } from "../../utils/cn";

// internal components
import ErrorState, { ErrorAction } from "../ui/ErrorState";
import LoadingState from "../ui/LoadingState";
import { StatItem, StatsGrid } from "../ui/StatsCard";
import PageHeader from "./PageHeader";

/**
 * PageLayout component props
 */
export interface PageLayoutProps {
  /** Page title */
  title: string;
  /** Page subtitle/description */
  subtitle: string;
  /** Header action button configuration */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
    className?: string;
  };
  /** Statistics to display */
  stats?: StatItem[];
  /** Statistics grid configuration */
  statsConfig?: {
    columns?: {
      base?: number;
      md?: number;
      lg?: number;
    };
  };
  /** Main content */
  children: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Error state */
  error?: Error | string | null;
  /** Error actions */
  errorActions?: ErrorAction[];
  /** Additional CSS classes */
  className?: string;
  /** Whether to show stats section */
  showStats?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  action,
  stats = [],
  statsConfig,
  children,
  isLoading = false,
  loadingMessage,
  error = null,
  errorActions = [],
  className,
  showStats = true,
}) => {
  // Handle loading state
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  // Handle error state
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    return (
      <ErrorState
        message={errorMessage}
        actions={
          errorActions.length > 0
            ? errorActions
            : [
                {
                  label: "Retry",
                  onClick: () => window.location.reload(),
                },
              ]
        }
      />
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <PageHeader title={title} subtitle={subtitle} action={action} />

      {/* Statistics */}
      {showStats && stats.length > 0 && (
        <StatsGrid stats={stats} columns={statsConfig?.columns} />
      )}

      {/* Main Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
};

export default PageLayout;
