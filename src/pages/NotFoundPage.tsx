// components
import React from "react";
import { useNavigate } from "react-router-dom";

// internal components
import { Button } from "../components/ui/Button";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400">
          404
        </h1>
        <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
          Page not found
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6">
          <Button onClick={() => navigate("/")}>Go back home</Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
