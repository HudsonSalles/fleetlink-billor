// components
import React from "react";

/**
 * Props interface for AuthLayout component
 */
interface AuthLayoutProps {
  /** Page content to display in the auth layout */
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-md">
        {/* FleetLink Logo */}
        <div className="flex items-center justify-center">
          <img
            src="/fleetLink-logo.png"
            alt="FleetLink Logo"
            className="w-full h-auto max-w-32 mb-4"
          />
        </div>

        {/* Subtitle */}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Welcome to FleetLink
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Connecting drivers, trucks, and loads in one platform
        </p>
      </div>

      {/* Main Content */}
      <div className="mt-8 mx-auto w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow rounded-lg px-10">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} FleetLink. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
