// components
import React from "react";
import { cn } from "../../utils/cn";

// internal components
import Card from "./Card";

/**
 * Individual stat item interface
 */
export interface StatItem {
  /** The main value to display */
  value: number | string;
  /** The label for the stat */
  label: string;
  /** Optional color for the value */
  valueColor?: string;
  /** Optional icon element */
  icon?: React.ReactNode;
}

/**
 * StatsCard component props
 */
export interface StatsCardProps {
  /** Individual stat item */
  stat: StatItem;
  /** Additional CSS classes */
  className?: string;
  /** Card padding size */
  padding?: "sm" | "md" | "lg";
}

/**
 * StatsGrid component props for displaying multiple stats
 */
export interface StatsGridProps {
  /** Array of stat items */
  stats: StatItem[];
  /** Number of columns (responsive) */
  columns?: {
    base?: number;
    md?: number;
    lg?: number;
  };
  /** Additional CSS classes */
  className?: string;
  /** Card padding size */
  padding?: "sm" | "md" | "lg";
}

const StatsCard: React.FC<StatsCardProps> = ({
  stat,
  className,
  padding = "md",
}) => {
  const paddingClasses = {
    sm: "p-2",
    md: "p-2 md:p-4",
    lg: "p-4 md:p-6",
  };

  return (
    <Card className={cn(paddingClasses[padding], className)}>
      <div className="text-center">
        {stat.icon && (
          <div className="flex justify-center mb-2">{stat.icon}</div>
        )}
        <div
          className={cn(
            "text-2xl font-bold",
            stat.valueColor || "text-gray-900 dark:text-white"
          )}
        >
          {stat.value}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {stat.label}
        </div>
      </div>
    </Card>
  );
};

const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  columns = { base: 2, md: 3 },
  className,
  padding = "md",
}) => {
  const gridClasses = cn(
    "grid gap-4",
    columns.base && `grid-cols-${columns.base}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    className
  );

  return (
    <div className={gridClasses}>
      {stats.map((stat, index) => (
        <StatsCard key={index} stat={stat} padding={padding} />
      ))}
    </div>
  );
};

export default StatsCard;
export { StatsGrid };
