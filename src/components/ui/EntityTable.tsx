// components
import React from "react";
import { cn } from "../../utils/cn";

// internal components
import {
  Permission,
  PermissionGuard,
  useCanPerform,
} from "../../hooks/useRoles";
import { Button } from "./Button";
import Card from "./Card";
import type { Column } from "./DataTable";
import DataTable from "./DataTable";
import LoadingState from "./LoadingState";

/**
 * Extended action configuration for EntityTable
 */
export interface EntityActionConfig<T = Record<string, unknown>> {
  /** Action label */
  label: string;
  /** Action handler */
  handler: (row: T) => void;
  /** Action variant */
  variant?: "primary" | "secondary" | "outline" | "destructive";
  /** Whether action is disabled for a row */
  disabled?: (row: T) => boolean;
  /** Action icon */
  icon?: React.ReactNode;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Entity configuration for table generation
 */
export interface EntityConfig<T = Record<string, unknown>> {
  /** Entity name (singular) */
  name: string;
  /** Entity name (plural) */
  namePlural?: string;
  /** Entity description */
  description?: string;
  /** Entity resource identifier for permissions */
  resource: string;
  /** Entity icon or emoji */
  icon?: string;
  /** Primary identifier field for the entity */
  identifierField?: keyof T;
  /** Display name field for the entity */
  displayNameField?: keyof T;
}

/**
 * Table generator props
 */
export interface EntityTableProps<T = Record<string, unknown>> {
  /** Entity configuration */
  entity: EntityConfig<T>;
  /** Table data */
  data: T[] | undefined;
  /** Table columns */
  columns: Column<T>[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Additional table actions */
  customActions?: EntityActionConfig<T>[];
  /** Create button handler */
  onCreateClick?: () => void;
  /** Edit handler */
  onEditClick?: (item: T) => void;
  /** Delete handler */
  onDeleteClick?: (item: T) => void;
  /** View details handler */
  onViewClick?: (item: T) => void;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom empty state description */
  emptyDescription?: string;
  /** Page size for pagination */
  pageSize?: number;
  /** Custom CSS classes */
  className?: string;
  /** Whether to show statistics */
  showStats?: boolean;
  /** Statistics data */
  stats?: Array<{
    label: string;
    value: string | number;
    valueColor?: string;
    loading?: boolean;
  }>;
}

/**
 * Reusable entity table generator component
 * Automatically generates CRUD tables with permissions, actions, and consistent styling
 */
const EntityTable = <T extends Record<string, any>>({
  entity,
  data,
  columns,
  isLoading = false,
  error = null,
  customActions = [],
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onViewClick,
  emptyMessage,
  emptyDescription,
  pageSize = 10,
  className,
  showStats = false,
  stats = [],
}: EntityTableProps<T>) => {
  // Permission checks
  const canCreate = useCanPerform(Permission.CREATE, entity.resource);
  const canEdit = useCanPerform(Permission.UPDATE, entity.resource);
  const canDelete = useCanPerform(Permission.DELETE, entity.resource);
  const canView = useCanPerform(Permission.READ, entity.resource);

  // Generate default actions based on permissions and handlers
  const defaultActions: EntityActionConfig<T>[] = [
    ...(onViewClick && canView
      ? [
          {
            label: "Detailed View",
            handler: onViewClick,
            variant: "outline" as const,
          },
        ]
      : []),
    ...(onEditClick && canEdit
      ? [
          {
            label: "Edit",
            handler: onEditClick,
            variant: "outline" as const,
          },
        ]
      : []),
    ...(onDeleteClick && canDelete
      ? [
          {
            label: "Delete",
            handler: onDeleteClick,
            variant: "outline" as const,
            className: "text-red-600 hover:text-red-700 hover:border-red-300",
          },
        ]
      : []),
  ];

  // Combine custom actions with default actions (custom first, then defaults)
  const actions = [...customActions, ...defaultActions];

  // Entity names
  const namePlural = entity.namePlural || `${entity.name}s`;

  // Default empty state messages
  const defaultEmptyMessage =
    emptyMessage || `No ${namePlural.toLowerCase()} found`;
  const defaultEmptyDescription =
    emptyDescription ||
    `Get started by ${onCreateClick ? `adding your first ${entity.name.toLowerCase()}` : `managing ${namePlural.toLowerCase()}`}.`;

  // Handle loading state
  if (isLoading) {
    return <LoadingState message={`Loading ${namePlural.toLowerCase()}...`} />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">
          Failed to load {namePlural.toLowerCase()}
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {namePlural}
          </h1>
          {entity.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {entity.description}
            </p>
          )}
        </div>

        {/* Create Button */}
        {onCreateClick && canCreate && (
          <PermissionGuard
            action={Permission.CREATE}
            resource={entity.resource}
          >
            <Button
              onClick={onCreateClick}
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              Add {entity.name}
            </Button>
          </PermissionGuard>
        )}
      </div>

      {/* Statistics Section */}
      {showStats && stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 text-center">
              <div className={cn("text-2xl font-bold mb-1", stat.valueColor)}>
                {stat.loading ? (
                  <div className="animate-pulse bg-gray-300 h-8 w-16 mx-auto rounded" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Table Section */}
      <Card className="p-6">
        {data && data.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {defaultEmptyMessage}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {defaultEmptyDescription}
            </p>
            {onCreateClick && canCreate && (
              <PermissionGuard
                action={Permission.CREATE}
                resource={entity.resource}
              >
                <Button onClick={onCreateClick}>Add {entity.name}</Button>
              </PermissionGuard>
            )}
          </div>
        ) : (
          // Data Table
          <DataTable
            data={data || []}
            columns={columns}
            actions={actions.map((action) => ({
              label: action.label,
              handler: action.handler,
              variant: action.variant,
              disabled: action.disabled,
              icon: action.icon,
            }))}
            pagination
            pageSize={pageSize}
          />
        )}
      </Card>
    </div>
  );
};

export default EntityTable;
