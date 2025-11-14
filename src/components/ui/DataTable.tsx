// components
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

// internal components
import { Button } from "./Button";
import Input from "./Input";
import LoadingState from "./LoadingState";
import Select from "./Select";

/**
 * Column definition interface
 */
export interface Column<T = Record<string, unknown>> {
  /** Column identifier */
  key: string;
  /** Column header text */
  header: string;
  /** Cell renderer function */
  cell?: (value: unknown, row: T) => React.ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Column width */
  width?: string;
  /** Column alignment */
  align?: "left" | "center" | "right";
  /** Whether column can be hidden */
  hideable?: boolean;
  /** Accessor function for nested data */
  accessor?: (row: T) => React.ReactNode;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  key: string;
  value: string;
  type: "text" | "select" | "date" | "number";
  options?: Array<{ value: string; label: string }>;
}

/**
 * Action configuration
 */
export interface ActionConfig<T = Record<string, unknown>> {
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
}

/**
 * DataTable component props
 */
export interface DataTableProps<T = Record<string, unknown>> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Whether data is loading */
  loading?: boolean;
  /** Whether table is empty */
  empty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Row actions */
  actions?: ActionConfig<T>[];
  /** Whether to show pagination */
  pagination?: boolean;
  /** Items per page */
  pageSize?: number;
  /** Current page */
  currentPage?: number;
  /** Total items count */
  totalItems?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange?: (pageSize: number) => void;
  /** Sort configuration */
  sort?: SortConfig;
  /** Sort change handler */
  onSortChange?: (sort: SortConfig) => void;
  /** Filter configurations */
  filters?: FilterConfig[];
  /** Filter change handler */
  onFilterChange?: (filters: FilterConfig[]) => void;
  /** Row selection */
  selectable?: boolean;
  /** Selected rows */
  selectedRows?: T[];
  /** Selection change handler */
  onSelectionChange?: (selectedRows: T[]) => void;
  /** Row identifier function */
  getRowId?: (row: T) => string;
  /** Custom row click handler */
  onRowClick?: (row: T) => void;
  /** Whether rows are clickable */
  clickableRows?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Table caption */
  caption?: string;
}

/**
 * Actions dropdown component for table rows
 */
interface ActionsDropdownProps<T> {
  actions: ActionConfig<T>[];
  row: T;
}

const ActionsDropdown = <T,>({ actions, row }: ActionsDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside - following React best practices
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 120; // Reduced estimated dropdown height
      const viewportHeight = window.innerHeight;

      // Position below button, but above if not enough space
      const shouldShowAbove =
        buttonRect.bottom + dropdownHeight > viewportHeight;

      setPosition({
        top: shouldShowAbove
          ? buttonRect.top - dropdownHeight - 2
          : buttonRect.bottom + 2, // Much smaller gap
        left: Math.max(
          8,
          Math.min(buttonRect.right - 120, window.innerWidth - 128) // Closer to button
        ),
      });
    }
  }, [isOpen]);

  // If only one action, show it as a button
  if (actions.length === 1) {
    const action = actions[0];
    return (
      <Button
        size="sm"
        variant={action.variant || "outline"}
        onClick={(e) => {
          e.stopPropagation();
          action.handler(row);
        }}
        disabled={action.disabled?.(row)}
        startIcon={action.icon}
      >
        {action.label}
      </Button>
    );
  }

  return (
    <>
      <Button
        ref={buttonRef}
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="px-2"
        aria-label="Open actions menu"
        aria-expanded={isOpen}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </Button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed min-w-[120px] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            role="menu"
            aria-label="Actions menu"
          >
            <div className="py-1">
              {actions.map((action, index) => (
                <button
                  key={`action-${index}`}
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.handler(row);
                    setIsOpen(false);
                  }}
                  disabled={action.disabled?.(row)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm flex items-center space-x-2",
                    action.disabled?.(row)
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                    action.variant === "destructive" && !action.disabled?.(row)
                      ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : ""
                  )}
                >
                  {action.icon && (
                    <span
                      className="w-4 h-4 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {action.icon}
                    </span>
                  )}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

ActionsDropdown.displayName = "ActionsDropdown";

const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  empty = false,
  emptyMessage = "No data available",
  actions = [],
  pagination = false,
  pageSize = 10,
  currentPage = 1,
  totalItems,
  onPageChange,
  onPageSizeChange,
  sort,
  onSortChange,
  filters = [],
  onFilterChange,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  getRowId = (row: T) => row.id || String(Math.random()),
  onRowClick,
  clickableRows = false,
  className,
  caption,
}: DataTableProps<T>): JSX.Element => {
  const [localFilters, setLocalFilters] = useState<FilterConfig[]>(filters);
  const [localSort, setLocalSort] = useState<SortConfig | undefined>(sort);

  /**
   * Handle sort change
   */
  const handleSort = (key: string) => {
    const newSort: SortConfig = {
      key,
      direction:
        localSort?.key === key && localSort.direction === "asc"
          ? "desc"
          : "asc",
    };
    setLocalSort(newSort);
    onSortChange?.(newSort);
  };

  /**
   * Handle select all
   */
  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data);
    }
  };

  /**
   * Handle row selection
   */
  const handleRowSelect = (row: T) => {
    const rowId = getRowId(row);
    const isSelected = selectedRows.some(
      (selectedRow) => getRowId(selectedRow) === rowId
    );

    if (isSelected) {
      onSelectionChange?.(
        selectedRows.filter((selectedRow) => getRowId(selectedRow) !== rowId)
      );
    } else {
      onSelectionChange?.([...selectedRows, row]);
    }
  };

  /**
   * Get cell value
   */
  const getCellValue = (row: T, column: Column<T>) => {
    if (column.accessor) {
      return column.accessor(row);
    }
    return row[column.key];
  };

  /**
   * Filtered and sorted data
   */
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply local sorting if no external sorting
    if (localSort && !onSortChange) {
      result.sort((a, b) => {
        const aVal = a[localSort.key];
        const bVal = b[localSort.key];

        if (aVal < bVal) return localSort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return localSort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, localSort, onSortChange]);

  // Calculate pagination
  const totalPages = Math.ceil((totalItems || processedData.length) / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = pagination
    ? processedData.slice(startIndex, endIndex)
    : processedData;

  if (loading) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <LoadingState message="Loading data..." />
      </div>
    );
  }

  if (empty || data.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      {localFilters.length > 0 && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {localFilters.map((filter) => (
            <div key={filter.key} className="min-w-48">
              {filter.type === "select" ? (
                <Select
                  label={filter.key}
                  options={filter.options || []}
                  value={filter.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    const updated = localFilters.map((f) =>
                      f.key === filter.key ? { ...f, value } : f
                    );
                    setLocalFilters(updated);
                    onFilterChange?.(updated);
                  }}
                />
              ) : (
                <Input
                  label={filter.key}
                  type={filter.type}
                  value={filter.value}
                  onChange={(e) => {
                    const updated = localFilters.map((f) =>
                      f.key === filter.key ? { ...f, value: e.target.value } : f
                    );
                    setLocalFilters(updated);
                    onFilterChange?.(updated);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            {caption && <caption className="sr-only">{caption}</caption>}

            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {selectable && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === data.length && data.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      aria-label="Select all rows"
                    />
                  </th>
                )}

                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sortable &&
                        "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                    aria-sort={
                      localSort?.key === column.key
                        ? localSort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <div className="flex items-center space-x-1">
                      <span className="whitespace-nowrap">{column.header}</span>
                      {column.sortable && (
                        <span className="flex flex-col">
                          <svg
                            className={cn(
                              "w-3 h-3",
                              localSort?.key === column.key &&
                                localSort.direction === "asc"
                                ? "text-primary-600"
                                : "text-gray-400"
                            )}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                  </th>
                ))}

                {actions.length > 0 && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.map((row, index) => {
                const rowId = getRowId(row);
                const isSelected = selectedRows.some(
                  (selectedRow) => getRowId(selectedRow) === rowId
                );

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800",
                      isSelected && "bg-primary-50 dark:bg-primary-900/20",
                      clickableRows && "cursor-pointer"
                    )}
                    onClick={() => {
                      if (clickableRows && onRowClick) {
                        onRowClick(row);
                      }
                    }}
                  >
                    {selectable && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(row)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          aria-label={`Select row ${index + 1}`}
                        />
                      </td>
                    )}

                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {column.cell
                          ? column.cell(getCellValue(row, column), row)
                          : getCellValue(row, column)}
                      </td>
                    ))}

                    {actions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ActionsDropdown actions={actions} row={row} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, totalItems || processedData.length)} of{" "}
              {totalItems || processedData.length} results
            </span>

            {onPageSizeChange && (
              <Select
                options={[
                  { value: "10", label: "10 per page" },
                  { value: "25", label: "25 per page" },
                  { value: "50", label: "50 per page" },
                  { value: "100", label: "100 per page" },
                ]}
                value={String(pageSize)}
                onChange={(value) => onPageSizeChange(Number(value))}
                className="w-32"
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

DataTable.displayName = "DataTable";

export default DataTable;
