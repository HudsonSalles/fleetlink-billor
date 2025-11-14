import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

/**
 * Searchable select option interface
 */
export interface SearchableSelectOption {
  value: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
  status?: string;
  statusColor?: "green" | "yellow" | "red" | "blue" | "gray";
}

/**
 * SearchableSelect component props
 */
export interface SearchableSelectProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "onSelect"
  > {
  label?: string;
  error?: string;
  helperText?: string;
  options: SearchableSelectOption[];
  value?: string;
  onSelect?: (value: string) => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
}

const SearchableSelect = React.forwardRef<
  HTMLInputElement,
  SearchableSelectProps
>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      value,
      onSelect,
      placeholder = "Search and select...",
      size = "md",
      fullWidth = true,
      loading = false,
      emptyMessage = "No options available",
      searchPlaceholder = "Type to search...",
      className,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOption, setSelectedOption] =
      useState<SearchableSelectOption | null>(null);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Generate unique ID
    const uniqueId = React.useId();
    const selectId = id || `searchable-select-${uniqueId}`;
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

    // Status color mapping
    const statusColors = {
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
      blue: "bg-blue-100 text-blue-800",
      gray: "bg-gray-100 text-gray-800",
    };

    // Filter options based on search term
    const filteredOptions = options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.subtitle &&
          option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Update selected option when value changes
    useEffect(() => {
      const option = options.find((opt) => opt.value === value);
      setSelectedOption(option || null);
    }, [value, options]);

    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;

        // Don't close if clicking inside the wrapper or dropdown
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(target) &&
          !target.closest("[data-searchable-select-dropdown]")
        ) {
          setIsOpen(false);
          setSearchTerm("");
        }
      };

      if (isOpen) {
        // Use capture phase to handle clicks before they bubble
        document.addEventListener("mousedown", handleClickOutside, true);

        // Handle window resize and scroll to reposition dropdown
        const handlePositionUpdate = () => {
          // Force re-render to update position
          setIsOpen(false);
          setTimeout(() => setIsOpen(true), 0);
        };

        window.addEventListener("resize", handlePositionUpdate);
        window.addEventListener("scroll", handlePositionUpdate, true);

        return () => {
          document.removeEventListener("mousedown", handleClickOutside, true);
          window.removeEventListener("resize", handlePositionUpdate);
          window.removeEventListener("scroll", handlePositionUpdate, true);
        };
      }
    }, [isOpen]);

    const handleInputClick = () => {
      if (!disabled && !loading) {
        setIsOpen(!isOpen);
        if (!isOpen) {
          // Focus the search input in dropdown when opening
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }
    };

    const handleOptionSelect = (option: SearchableSelectOption) => {
      if (option.disabled) return;

      setSelectedOption(option);
      setIsOpen(false);
      setSearchTerm("");
      onSelect?.(option.value);
    };

    const displayValue = selectedOption
      ? `${selectedOption.label}${selectedOption.subtitle ? ` - ${selectedOption.subtitle}` : ""}`
      : "";

    return (
      <div className={cn("space-y-1", fullWidth && "w-full")} ref={wrapperRef}>
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
        <div className="relative" style={{ zIndex: isOpen ? 50 : "auto" }}>
          {/* Display field - always shows selected value */}
          <div
            className={cn(
              "block w-full rounded-lg border shadow-sm transition-colors duration-200 cursor-pointer",
              "focus-within:ring-1 focus-within:outline-none",
              "bg-white dark:bg-gray-800 dark:text-white",
              "pr-10", // Space for dropdown arrow
              sizeStyles[size],
              errorStyles,
              disabledStyles,
              "dark:border-gray-600",
              isOpen &&
                "border-primary-500 ring-1 ring-primary-500 dark:border-primary-500"
            )}
            onClick={handleInputClick}
          >
            <div
              className={cn(
                "truncate",
                !selectedOption && "text-gray-400 dark:text-gray-500"
              )}
            >
              {displayValue || placeholder}
            </div>
          </div>

          {/* Dropdown arrow or loading indicator */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-500" />
            ) : (
              <svg
                className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
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

          {/* Dropdown menu */}
          {isOpen &&
            createPortal(
              <div
                data-searchable-select-dropdown
                className={cn(
                  "fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
                  "rounded-lg shadow-xl max-h-96 overflow-hidden flex flex-col"
                )}
                style={(() => {
                  if (!wrapperRef.current) return { display: "none" };

                  const rect = wrapperRef.current.getBoundingClientRect();
                  const dropdownHeight = 384; // max-h-96 = 24rem = 384px
                  const viewportHeight = window.innerHeight;
                  const spaceBelow = viewportHeight - rect.bottom;
                  const spaceAbove = rect.top;

                  // Show above if not enough space below and more space above
                  const showAbove =
                    spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

                  return {
                    top: showAbove
                      ? rect.top - Math.min(dropdownHeight, spaceAbove - 10)
                      : rect.bottom + 4,
                    left: rect.left,
                    width: rect.width,
                    maxHeight: showAbove
                      ? Math.min(dropdownHeight, spaceAbove - 10)
                      : Math.min(dropdownHeight, spaceBelow - 10),
                    zIndex: 9999,
                  };
                })()}
              >
                {/* Search input at top of dropdown */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={searchPlaceholder}
                      className={cn(
                        "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md",
                        "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
                        "placeholder-gray-400 dark:placeholder-gray-500",
                        "focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500",
                        "dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      )}
                      disabled={disabled || loading}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Options list */}
                <div className="overflow-y-auto flex-1 max-h-72">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOptionSelect(option);
                        }}
                        className={cn(
                          "px-3 py-2 cursor-pointer transition-colors duration-150",
                          "hover:bg-gray-100 dark:hover:bg-gray-700",
                          "flex items-center justify-between",
                          option.disabled &&
                            "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent",
                          value === option.value &&
                            "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {option.label}
                          </div>
                          {option.subtitle && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {option.subtitle}
                            </div>
                          )}
                        </div>
                        {option.status && (
                          <span
                            className={cn(
                              "ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                              statusColors[option.statusColor || "gray"]
                            )}
                          >
                            {option.status}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? "No matching options found" : emptyMessage}
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>{" "}
        {/* Hidden input for form integration */}
        <input
          ref={ref}
          type="hidden"
          id={selectId}
          value={value || ""}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={cn(error && errorId, helperText && helperTextId)}
          {...props}
        />
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

SearchableSelect.displayName = "SearchableSelect";

export default SearchableSelect;
