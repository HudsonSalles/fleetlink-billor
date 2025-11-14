// components
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

// context
import { useAuthStore } from "../../stores/authStore";

// internal components
import { Button } from "../ui/Button";
import Modal from "../ui/Modal";

/**
 * Navigation item interface
 */
export interface NavItem {
  /** Item label */
  label: string;
  /** Navigation path */
  path: string;
  /** Item icon */
  icon?: React.ReactNode;
  /** Required permissions */
  permissions?: string[];
  /** Child navigation items */
  children?: NavItem[];
}

/**
 * Navbar component props
 */
export interface NavbarProps {
  /** Navigation items */
  items?: NavItem[];
  /** Whether to show user menu */
  showUserMenu?: boolean;
  /** Whether to show notifications */
  showNotifications?: boolean;
  /** Custom brand logo */
  brandLogo?: React.ReactNode;
  /** Brand name */
  brandName?: string;
  /** Custom CSS classes */
  className?: string;
  /** Whether navbar is fixed */
  fixed?: boolean;
}

/**
 * Default navigation items
 */
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
      </svg>
    ),
  },
  {
    label: "Fleet",
    path: "/fleet",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    ),
    children: [
      { label: "Trucks", path: "/trucks" },
      { label: "Drivers", path: "/drivers" },
    ],
  },
  {
    label: "Loads",
    path: "/loads",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m16 0l-2-2m2 2l-2 2M4 13l2-2m-2 2l2 2"
        />
      </svg>
    ),
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

const Navbar: React.FC<NavbarProps> = ({
  items = DEFAULT_NAV_ITEMS,
  showUserMenu = true,
  showNotifications = true,
  brandLogo,
  brandName = "FleetLink",
  className,
  fixed = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuthStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  /**
   * Handle outside clicks to close menus
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Handle navigation
   */
  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
    setShowLogoutModal(false);
  };

  /**
   * Check if path is active
   */
  const isActivePath = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  /**
   * Check if user has permissions for nav item
   */
  const hasPermissions = (item: NavItem) => {
    if (!item.permissions || item.permissions.length === 0) return true;
    // Add permission check logic here
    return true;
  };

  return (
    <>
      <nav
        className={cn(
          "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm",
          fixed && "fixed top-0 left-0 right-0 z-50",
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <div className="flex items-center space-x-4">
              <button
                className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="flex items-center space-x-3">
                {brandLogo || (
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
                    </svg>
                  </div>
                )}
                <span className="font-bold text-xl text-gray-900 dark:text-white">
                  {brandName}
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {items.filter(hasPermissions).map((item) => (
                <div key={item.path} className="relative">
                  {item.children ? (
                    <>
                      <button
                        className={cn(
                          "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActivePath(item.path)
                            ? "text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20"
                            : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === item.path ? null : item.path
                          )
                        }
                        aria-expanded={activeDropdown === item.path}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        <svg
                          className={cn(
                            "w-4 h-4 transition-transform",
                            activeDropdown === item.path && "rotate-180"
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
                      </button>

                      {activeDropdown === item.path && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                          {item.children.map((child) => (
                            <button
                              key={child.path}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400"
                              onClick={() => handleNavigate(child.path)}
                            >
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      className={cn(
                        "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActivePath(item.path)
                          ? "text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20"
                          : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                      onClick={() => handleNavigate(item.path)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Right Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              {showNotifications && (
                <button
                  className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 relative"
                  aria-label="Notifications"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-5 5v-5zM11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              )}

              {/* User Menu */}
              {showUserMenu && user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    className="flex items-center space-x-2 p-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-expanded={isUserMenuOpen}
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-sm text-white font-medium">
                        {user.displayName?.[0] ||
                          user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden md:block">
                      {user.displayName || user.email}
                    </span>
                    <svg
                      className="w-4 h-4"
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
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayName || user.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>

                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          handleNavigate("/profile");
                          setIsUserMenuOpen(false);
                        }}
                      >
                        Profile Settings
                      </button>

                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setShowLogoutModal(true);
                          setIsUserMenuOpen(false);
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden" ref={mobileMenuRef}>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              {items.filter(hasPermissions).map((item) => (
                <div key={item.path}>
                  <button
                    className={cn(
                      "w-full flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium",
                      isActivePath(item.path)
                        ? "text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20"
                        : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                    onClick={() =>
                      item.children
                        ? setActiveDropdown(
                            activeDropdown === item.path ? null : item.path
                          )
                        : handleNavigate(item.path)
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.children && (
                      <svg
                        className={cn(
                          "ml-auto w-4 h-4 transition-transform",
                          activeDropdown === item.path && "rotate-180"
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
                  </button>

                  {item.children && activeDropdown === item.path && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.path}
                          className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onClick={() => handleNavigate(child.path)}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to sign out of FleetLink?
          </p>
          <div className="flex space-x-3">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex-1"
            >
              Sign Out
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowLogoutModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
