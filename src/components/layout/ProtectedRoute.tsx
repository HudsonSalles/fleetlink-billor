// components
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

// context
import { useAuthStore } from "../../stores/authStore";

/**
 * Loading spinner component for authentication states
 */
const AuthLoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      <p className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
        Loading...
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Checking authentication status
      </p>
    </div>
  </div>
);

/**
 * Props interface for ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** Child components to render when authenticated */
  children: React.ReactNode;
  /** Optional role requirement for additional authorization */
  requiredRole?: "admin" | "operator";
  /** Optional fallback component for unauthorized access */
  fallback?: React.ComponentType;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback: Fallback,
}) => {
  const { user, loading, initialized } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading || !initialized) {
    return <AuthLoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based authorization
  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    if (Fallback) {
      return <Fallback />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access this page. Required role:{" "}
            {requiredRole}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Your current role: {user.role}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
