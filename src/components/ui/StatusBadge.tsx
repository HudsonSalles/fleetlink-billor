// components
import React from "react";
import { cn } from "../../utils/cn";

/**
 * Predefined status configurations
 */
export const STATUS_CONFIGS = {
  // Common statuses
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-800" },

  // Truck statuses
  maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-800" },

  // Driver statuses
  suspended: { label: "Suspended", color: "bg-red-100 text-red-800" },
  "on-leave": { label: "On Leave", color: "bg-blue-100 text-blue-800" },

  // Load statuses
  planned: { label: "Planned", color: "bg-blue-100 text-blue-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  booked: { label: "Booked", color: "bg-purple-100 text-purple-800" },
  "in-transit": { label: "In Transit", color: "bg-orange-100 text-orange-800" },
  in_route: { label: "In Route", color: "bg-orange-100 text-orange-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },

  // Default
  unknown: { label: "Unknown", color: "bg-gray-100 text-gray-800" },
} as const;

/**
 * StatusBadge component props
 */
export interface StatusBadgeProps {
  /** The status value */
  status: string;
  /** Custom status configuration */
  customConfig?: {
    label: string;
    color: string;
  };
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customConfig,
  className,
  size = "md",
}) => {
  // Get status configuration
  const config =
    customConfig ||
    STATUS_CONFIGS[status as keyof typeof STATUS_CONFIGS] ||
    STATUS_CONFIGS.unknown;

  // Size classes
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
