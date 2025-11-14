# Jest Test Configuration

This directory contains the test suite for FleetLink using Jest and React Testing Library.

## Test Structure

```
src/
├── __tests__/
│   ├── simplified/
│   │   ├── Login.test.tsx        # ✅ Login authentication tests (4 tests)
│   │   └── Drivers.test.tsx      # ✅ Driver form operations (6 tests)
│   └── README.md                 # This documentation
└── setupTests.ts                 # Test setup and mocks
```

## Current Test Status

**✅ All Tests Passing: 10/10**

### Simplified Test Suite

Focused on core functionality with real-world testing patterns:

**Login Tests (4 passing)**

- Form rendering validation
- Email field validation
- Password field validation
- Successful form submission

**Driver Tests (6 passing)**

- Form rendering with all required fields
- Form validation state management
- Dynamic button enabling based on form validity
- Successful form submission with correct data structure
- Cancel action handling
- Edit mode with pre-populated data

## Running Tests

```bash
# Run all tests
npm test

# Run tests without watch mode
npm test -- --watchAll=false

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test Login.test.tsx
npm test Drivers.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders"
```

## Test Implementation Details

### Login Tests (`simplified/Login.test.tsx`)

**Mocking Strategy:**

```tsx
// Auth store mock
jest.mock("../../stores/authStore", () => ({
  useAuthStore: () => ({
    signIn: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
    loading: false,
    error: null,
  }),
}));
```

**Key Test Patterns:**

- Form field validation using `getByLabelText`
- Error message validation with `waitFor`
- Form submission behavior testing
- React Router integration with `BrowserRouter`

### Driver Tests (`simplified/Drivers.test.tsx`)

**Mocking Strategy:**

```tsx
// API services mock
jest.mock("../../services/api", () => ({
  createDriver: jest.fn(),
  updateDriver: jest.fn(),
}));

// Toast notifications mock
jest.mock("../../utils/toast", () => ({
  toastMessages: {
    created: jest.fn(),
    createError: jest.fn(),
    updated: jest.fn(),
    updateError: jest.fn(),
  },
}));
```

**Key Test Patterns:**

- Form state management with `react-hook-form`
- Dynamic button enabling based on form validity
- Form submission with exact data structure validation
- Edit vs create mode behavior testing
- Real component interaction without mocking internal validation

## Mocking Strategy

### Firebase

- All Firebase services are mocked in `setupTests.ts`
- Auth state changes are stubbed
- Firestore operations return mock data

### Mapbox

- Mapbox GL is completely mocked
- Map instances return mock objects
- Navigation controls are stubbed

### Browser APIs

- `localStorage` and `sessionStorage` are mocked
- `IntersectionObserver` and `ResizeObserver` are polyfilled
- `matchMedia` is mocked for responsive design tests

## Testing Philosophy

### Focus on User Behavior

Our tests prioritize testing what users actually do rather than implementation details:

```tsx
// ❌ Testing implementation details
expect(mockValidationFunction).toHaveBeenCalled();

// ✅ Testing user behavior
fireEvent.change(screen.getByLabelText(/name/i), {
  target: { value: "John Doe" },
});
expected(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
```

### Real Form Integration

Instead of mocking form validation, we test the actual form behavior:

```tsx
// Test real form state management
const submitButton = screen.getByRole("button", { name: /add driver/i });
expect(submitButton).toBeDisabled(); // Initially disabled

// Fill form and verify button becomes enabled
fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "John" } });
fireEvent.change(screen.getByLabelText(/phone/i), {
  target: { value: "+1-555-123" },
});

await waitFor(() => {
  expect(submitButton).not.toBeDisabled();
});
```

## Best Practices

1. **Arrange, Act, Assert**: Structure tests clearly
2. **Test user behavior**: Focus on what users do, not implementation
3. **Use semantic queries**: Prefer `getByRole`, `getByLabelText`, etc.
4. **Mock external dependencies**: Keep tests isolated and fast
5. **Test error states**: Include negative test cases
6. **Use waitFor**: Handle async operations properly
7. **Real component integration**: Test actual form behavior when possible

## Coverage Goals

- **Core User Flows**: 100% coverage for login and driver management
- **Form Behavior**: Real validation and submission testing
- **Component Integration**: Test components as users interact with them

## Common Patterns

### Component Testing with Router

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

test("handles user interaction", () => {
  render(
    <TestWrapper>
      <MyComponent />
    </TestWrapper>
  );

  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByText("Expected result")).toBeInTheDocument();
});
```

### Async Form Testing

```tsx
import { waitFor } from "@testing-library/react";

test("submits form with valid data", async () => {
  const mockOnSubmit = jest.fn();

  render(<MyForm onSubmit={mockOnSubmit} />);

  // Fill form fields
  fireEvent.change(screen.getByLabelText(/name/i), {
    target: { value: "Test Name" },
  });

  // Wait for form to become valid
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /submit/i })).not.toBeDisabled();
  });

  // Submit form
  fireEvent.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalledWith(expectedData);
  });
});
```

### Testing Form Validation

```tsx
test("shows validation errors", async () => {
  render(<MyForm />);

  // Try to submit empty form
  fireEvent.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/field is required/i)).toBeInTheDocument();
  });
});
```
