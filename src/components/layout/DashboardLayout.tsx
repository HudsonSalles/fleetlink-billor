// components
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

// context
import { useAuthStore } from "../../stores/authStore";

// internal components
import ThemeToggle from "../ui/ThemeToggle";

/**
 * Props interface for DashboardLayout component
 */
interface DashboardLayoutProps {
  /** Page content to display in the main area */
  children: React.ReactNode;
}

/**
 * Navigation menu item interface
 */
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

/**
 * Navigation icons
 */
const Icons = {
  Dashboard: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  Truck: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 4H6a2 2 0 00-2 2v6h2m8-8V4a2 2 0 00-2-2h-2m0 8h8l-2-6h-6v6z"
      />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17h6m-8 0H4v-4m16 4v-4h-3"
      />
    </svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h7"
        opacity="0.3"
      />
    </svg>
  ),
  Package: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 8v8a2 2 0 01-1 1.73l-7 4a2 2 0 01-2 0l-7-4A2 2 0 013 16V8a2 2 0 011-1.73l7-4a2 2 0 012 0l7 4A2 2 0 0121 8z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
      />
    </svg>
  ),
  Menu: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  ),
  X: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  Logout: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: Icons.Dashboard },
    { name: "Drivers", href: "/drivers", icon: Icons.Users },
    { name: "Trucks", href: "/trucks", icon: Icons.Truck },
    { name: "Loads", href: "/loads", icon: Icons.Package },
  ];

  // Mark current navigation item
  const navigationWithCurrent = navigation.map((item) => ({
    ...item,
    current: location.pathname === item.href,
  }));

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900 relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-40 flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:relative",
          sidebarCollapsed ? "w-16" : "w-64",
          "md:static fixed inset-y-0 left-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center flex-shrink-0 py-4 relative",
            sidebarCollapsed ? "justify-center px-2" : "px-4"
          )}
        >
          {sidebarCollapsed ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="/icon.png"
                alt="FleetLink Icon"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback to default icon if image fails to load
                  const target = e.currentTarget;
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-3 min-w-0 w-full">
              <img
                src="/fleetLink-logo.png"
                alt="FleetLink Logo"
                className="h-20 w-auto object-contain"
                onError={(e) => {
                  // Fallback to default icon + text if logo fails to load
                  const target = e.currentTarget;
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      </div>
                      <h1 class="text-xl font-bold text-gray-900 dark:text-white truncate ml-2"></h1>
                    `;
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "mt-5 flex-1",
            sidebarCollapsed ? "px-2" : "px-2 space-y-1"
          )}
        >
          {navigationWithCurrent.map((item) => (
            <div key={item.name} className="relative group">
              <button
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
                className={cn(
                  item.current
                    ? "bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
                  "group flex items-center text-sm font-medium rounded-md w-full text-left transition-all duration-200",
                  sidebarCollapsed
                    ? "justify-center px-2 py-3 mb-2"
                    : "px-2 py-2"
                )}
              >
                <item.icon
                  className={cn(
                    item.current
                      ? "text-primary-500 dark:text-primary-400"
                      : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300",
                    "flex-shrink-0 h-6 w-6",
                    sidebarCollapsed ? "" : "mr-3"
                  )}
                />
                {!sidebarCollapsed && item.name}
              </button>

              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[60] top-1/2 transform -translate-y-1/2 shadow-lg">
                  {item.name}
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 dark:bg-gray-700 rotate-45"></div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User info and logout */}
        <div className="flex-shrink-0 flex flex-col border-t border-gray-200 dark:border-gray-700">
          {/* Logout Button */}
          <div className="flex justify-center relative group">
            <button
              onClick={handleSignOut}
              className={cn(
                "flex items-center w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                sidebarCollapsed
                  ? "justify-center px-3 py-3"
                  : "justify-center px-3 py-2"
              )}
            >
              <Icons.Logout className="h-6 w-6" />
              {!sidebarCollapsed && <span className="ml-2">Sign Out</span>}
            </button>

            {/* Tooltip for collapsed state */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[60] top-1/2 transform -translate-y-1/2 shadow-lg">
                Sign Out
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 dark:bg-gray-700 rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapse Toggle Button - Positioned at border */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden md:flex absolute top-4 z-50 items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
        style={{
          left: sidebarCollapsed ? "65px" : "255px",
          transform: "translateX(-50%)",
          transition: "left 0.3s ease-in-out",
        }}
      >
        <svg
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            sidebarCollapsed ? "rotate-180" : ""
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header with user info */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 md:hidden mr-2"
              >
                <Icons.Menu className="h-6 w-6" />
              </button>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-800 dark:text-primary-200">
                      {user?.displayName?.charAt(0) ||
                        user?.email?.charAt(0) ||
                        "U"}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role}
                  </p>
                </div>
              </div>

              {/* Theme Toggle - always visible in header */}
              <div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="mx-auto px-4 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
