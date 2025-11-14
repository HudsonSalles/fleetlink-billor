import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import DriverForm from "../../components/forms/DriverForm";

// Mock the API services
jest.mock("../../services/api", () => ({
  createDriver: jest.fn(),
  updateDriver: jest.fn(),
}));

// Mock toast notifications
jest.mock("../../utils/toast", () => ({
  toastMessages: {
    created: jest.fn(),
    createError: jest.fn(),
    updated: jest.fn(),
    updateError: jest.fn(),
  },
}));

// Simple wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe("Driver Operations - Simplified Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders driver form correctly", () => {
    render(
      <TestWrapper>
        <DriverForm onSubmit={jest.fn()} onCancel={jest.fn()} />
      </TestWrapper>
    );

    // Check if essential form fields are present
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/driver's license/i)).toBeInTheDocument();

    // Check if action buttons are present
    expect(
      screen.getByRole("button", { name: /add driver/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  test("form submission button is disabled when form is invalid", () => {
    render(
      <TestWrapper>
        <DriverForm onSubmit={jest.fn()} onCancel={jest.fn()} />
      </TestWrapper>
    );

    const submitButton = screen.getByRole("button", { name: /add driver/i });

    // Initially, button should be disabled (form is invalid/empty)
    expect(submitButton).toBeDisabled();
  });

  test("form submission button becomes enabled when valid data is entered", async () => {
    render(
      <TestWrapper>
        <DriverForm onSubmit={jest.fn()} onCancel={jest.fn()} />
      </TestWrapper>
    );

    // Fill out the form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: "+1-555-123-4567" },
    });
    fireEvent.change(screen.getByLabelText(/driver's license/i), {
      target: { value: "DL123456789" },
    });

    // Wait for form to become valid and button to be enabled
    await waitFor(() => {
      const submitButton = screen.getByRole("button", { name: /add driver/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  test("submits valid driver form", async () => {
    const mockOnSubmit = jest.fn();

    render(
      <TestWrapper>
        <DriverForm onSubmit={mockOnSubmit} onCancel={jest.fn()} />
      </TestWrapper>
    );

    // Fill out the form with valid data
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: "+1-555-123-4567" },
    });
    fireEvent.change(screen.getByLabelText(/driver's license/i), {
      target: { value: "DL123456789" },
    });

    // Wait for form to become valid, then submit
    await waitFor(() => {
      const submitButton = screen.getByRole("button", { name: /add driver/i });
      expect(submitButton).not.toBeDisabled();
    });

    const submitButton = screen.getByRole("button", { name: /add driver/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: "John Doe",
        phone: "+1-555-123-4567",
        license: "DL123456789",
        truckId: null,
      });
    });
  });

  test("handles cancel action", () => {
    const mockOnCancel = jest.fn();

    render(
      <TestWrapper>
        <DriverForm onSubmit={jest.fn()} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test("populates form when editing existing driver", () => {
    const existingDriver = {
      id: "1",
      name: "Jane Smith",
      phone: "+1-555-987-6543",
      license: "DL987654321",
      truckId: undefined,
    };

    render(
      <TestWrapper>
        <DriverForm
          initialData={existingDriver}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          editMode={true}
        />
      </TestWrapper>
    );

    // Check that form fields are populated with existing data
    expect(screen.getByDisplayValue("Jane Smith")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+1-555-987-6543")).toBeInTheDocument();
    expect(screen.getByDisplayValue("DL987654321")).toBeInTheDocument();

    // Check button text for edit mode
    expect(
      screen.getByRole("button", { name: /update driver/i })
    ).toBeInTheDocument();
  });
});
