import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "../../pages/auth/LoginPage";

// Simple mock for auth store
jest.mock("../../stores/authStore", () => ({
  useAuthStore: () => ({
    signIn: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
    loading: false,
    error: null,
  }),
}));

// Simple wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe("Login Page - Simplified Tests", () => {
  test("renders login form correctly", () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    // Check if essential form elements are present
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  test("validates required email field", async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Try to submit without email
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  test("validates required password field", async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Fill email but leave password empty
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test("submits form with valid credentials", async () => {
    const mockSignIn = jest.fn().mockResolvedValue(undefined);

    // Override mock for this test
    jest.doMock("../../stores/authStore", () => ({
      useAuthStore: () => ({
        signIn: mockSignIn,
        clearError: jest.fn(),
        loading: false,
        error: null,
      }),
    }));

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Fill form with valid data
    fireEvent.change(emailInput, { target: { value: "admin@fleetlink.com" } });
    fireEvent.change(passwordInput, { target: { value: "admin123" } });
    fireEvent.click(submitButton);

    // Form should submit without validation errors
    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
  });
});
