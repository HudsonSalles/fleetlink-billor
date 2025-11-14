// components
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

// internal components
import AuthLayout from "./components/layout/AuthLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoadingState from "./components/ui/LoadingState";

// route configuration
import { protectedRoutes } from "./config/routes";

// hooks
import { useRealtimeSubscriptions } from "./hooks/useRealtimeData";

// context
import { ThemeProvider } from "./contexts/ThemeContext";

// utils - import for side effects (global functions)
import { useAuthStore } from "./stores/authStore";
import "./utils/dataMigration";

// Lazy-loaded page imports for public routes
const LoginPage = React.lazy(() => import("./pages/auth/LoginPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

/**
 * React Query client configuration
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof Error && error.message.includes("auth")) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * App initialization component
 * Handles authentication state and real-time subscriptions
 */
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // Initialize authentication on app start
  React.useEffect(() => {
    const unsubscribe = initializeAuth();
    return unsubscribe;
  }, [initializeAuth]);

  // Set up real-time data subscriptions
  useRealtimeSubscriptions();

  return <>{children}</>;
};

/**
 * Lazy loading wrapper component with loading fallback
 */
const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingState message="Loading page..." />}>
    {children}
  </Suspense>
);

/**
 * Protected route wrapper component
 */
const ProtectedRouteWrapper: React.FC<{
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}> = ({ component: Component }) => (
  <ProtectedRoute>
    <DashboardLayout>
      <LazyWrapper>
        <Component />
      </LazyWrapper>
    </DashboardLayout>
  </ProtectedRoute>
);

/**
 * Main App component with lazy-loaded routes
 */
function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AppInitializer>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Routes>
                {/* Public routes */}
                <Route
                  path="/login"
                  element={
                    <AuthLayout>
                      <LazyWrapper>
                        <LoginPage />
                      </LazyWrapper>
                    </AuthLayout>
                  }
                />

                {/* Protected routes - dynamically generated */}
                {protectedRoutes.map(({ path, component }) => (
                  <Route
                    key={path}
                    path={path}
                    element={<ProtectedRouteWrapper component={component} />}
                  />
                ))}

                {/* Redirect routes */}
                <Route
                  path="/dashboard"
                  element={<Navigate to="/" replace />}
                />

                {/* 404 page */}
                <Route
                  path="*"
                  element={
                    <LazyWrapper>
                      <NotFoundPage />
                    </LazyWrapper>
                  }
                />
              </Routes>
            </div>

            {/* Global toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--color-background)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                },
                success: {
                  iconTheme: {
                    primary: "#22C55E",
                    secondary: "#FFFFFF",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#EF4444",
                    secondary: "#FFFFFF",
                  },
                },
              }}
            />
          </AppInitializer>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
