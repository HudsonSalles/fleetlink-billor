// components
import React from "react";
import Card from "./Card";

/**
 * Statistics card component props
 */
export interface StatCardProps {
  /** The main statistic value to display */
  value: string | number;
  /** The label/description for the statistic */
  label: string;
  /** Optional color for the value text */
  valueColor?: string;
  /** Custom CSS classes */
  className?: string;
  /** Loading state */
  loading?: boolean;
}

/**
 * Optimized statistics card component
 *
 * This component is memoized to prevent re-renders when the value hasn't changed.
 * Perfect for dashboard statistics that update frequently via real-time data.
 *
 * @component
 * @category UI
 */
const StatCard: React.FC<StatCardProps> = React.memo(
  ({
    value,
    label,
    valueColor = "text-gray-900 dark:text-white",
    className,
    loading = false,
  }) => {
    return (
      <Card className={`p-2 md:p-4 ${className || ""}`} loading={loading}>
        <div className="text-center">
          <div className={`text-2xl font-bold ${valueColor}`}>
            {loading ? "..." : value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {label}
          </div>
        </div>
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

export default StatCard;
