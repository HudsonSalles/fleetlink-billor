import React from "react";

// Lazy-loaded page imports
const Dashboard = React.lazy(() => import("../pages/dashboard/DashboardPage"));
const DriversPage = React.lazy(() => import("../pages/drivers/DriversPage"));
const LoadDetailsPage = React.lazy(() => import("../pages/loads/LoadDetailsPage"));
const LoadsPage = React.lazy(() => import("../pages/loads/LoadsPage"));
const TrucksPage = React.lazy(() => import("../pages/trucks/TrucksPage"));

/**
 * Route configuration interface
 */
export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  title?: string;
  description?: string;
}

/**
 * Legacy interface for backward compatibility
 * @deprecated Use RouteConfig instead
 */
export interface ProtectedRouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

/**
 * Protected routes configuration
 * All routes that require authentication and use the DashboardLayout
 */
export const protectedRoutes: RouteConfig[] = [
  { 
    path: "/", 
    component: Dashboard,
    title: "Dashboard",
    description: "Fleet overview and statistics"
  },
  { 
    path: "/trucks", 
    component: TrucksPage,
    title: "Trucks",
    description: "Manage fleet vehicles"
  },
  { 
    path: "/drivers", 
    component: DriversPage,
    title: "Drivers",
    description: "Manage driver profiles"
  },
  { 
    path: "/loads", 
    component: LoadsPage,
    title: "Loads",
    description: "Manage cargo and deliveries"
  },
  { 
    path: "/loads/:id", 
    component: LoadDetailsPage,
    title: "Load Details",
    description: "View specific load information"
  },
];

/**
 * Public routes configuration
 * Routes that don't require authentication
 */
export const publicRoutes: RouteConfig[] = [
  // Login is handled separately in App.tsx due to different layout
];

/**
 * Redirect routes configuration
 * Routes that redirect to other paths
 */
export const redirectRoutes: Array<{ from: string; to: string }> = [
  { from: "/dashboard", to: "/" },
];

/**
 * Route utilities
 */
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return [...protectedRoutes, ...publicRoutes].find(route => route.path === path);
};

export const getProtectedPaths = (): string[] => {
  return protectedRoutes.map(route => route.path);
};

export const isProtectedRoute = (path: string): boolean => {
  return protectedRoutes.some(route => route.path === path);
};