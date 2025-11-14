// validation
import * as yup from 'yup';

// types
import { DriverStatus, FuelType, LoadPriority, LoadStatus, LoadType, TruckStatus } from '../types';

/**
 * Common validation patterns
 */
const patterns = {
  phone: /^\+?[1-9]\d{0,15}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  plateNumber: /^[A-Z0-9\-\s]{2,15}$/i,
  vin: /^[A-HJ-NPR-Z0-9]{17}$/i,
  zipCode: /^\d{5}(-\d{4})?$/,
  licenseNumber: /^[A-Z0-9\-\s]{5,20}$/i,
};

/**
 * Common field validation schemas
 */
const commonSchemas = {
  email: yup
    .string()
    .matches(patterns.email, 'Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .required('Email is required'),

  phone: yup
    .string()
    .matches(patterns.phone, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 digits')
    .required('Phone number is required'),

  name: yup
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters')
    .required('Name is required'),

  address: yup.object().shape({
    street: yup
      .string()
      .trim()
      .min(5, 'Street address must be at least 5 characters')
      .max(255, 'Street address must be less than 255 characters')
      .required('Street address is required'),
    
    city: yup
      .string()
      .trim()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City must be less than 100 characters')
      .matches(/^[a-zA-Z\s\-'.]+$/, 'City contains invalid characters')
      .required('City is required'),
    
    state: yup
      .string()
      .trim()
      .min(2, 'State must be at least 2 characters')
      .max(50, 'State must be less than 50 characters')
      .required('State is required'),
    
    zipCode: yup
      .string()
      .matches(patterns.zipCode, 'Please enter a valid zip code (12345 or 12345-6789)')
      .required('Zip code is required'),
    
    country: yup
      .string()
      .trim()
      .min(2, 'Country must be at least 2 characters')
      .max(50, 'Country must be less than 50 characters')
      .default('United States')
      .required('Country is required'),
  }),
};

/**
 * Authentication form schemas
 */
export const authSchemas = {
  login: yup.object().shape({
    email: commonSchemas.email,
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    rememberMe: yup.boolean().default(false),
  }),

  register: yup.object().shape({
    email: commonSchemas.email,
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/\d/, 'Password must contain at least one number')
      .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
      .required('Password is required'),
    
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
    
    displayName: yup
      .string()
      .trim()
      .min(2, 'Display name must be at least 2 characters')
      .max(50, 'Display name must be less than 50 characters')
      .required('Display name is required'),
    
    terms: yup
      .boolean()
      .oneOf([true], 'You must accept the terms and conditions')
      .required(),
  }),

  forgotPassword: yup.object().shape({
    email: commonSchemas.email,
  }),

  resetPassword: yup.object().shape({
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/\d/, 'Password must contain at least one number')
      .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
      .required('Password is required'),
    
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
  }),
};

/**
 * Truck form validation schema
 */
export const truckSchema = yup.object().shape({
  plateNumber: yup
    .string()
    .matches(patterns.plateNumber, 'Please enter a valid plate number')
    .min(2, 'Plate number must be at least 2 characters')
    .max(15, 'Plate number must be less than 15 characters')
    .required('Plate number is required'),

  vin: yup
    .string()
    .matches(patterns.vin, 'VIN must be exactly 17 alphanumeric characters')
    .length(17, 'VIN must be exactly 17 characters')
    .required('VIN is required'),

  make: yup
    .string()
    .trim()
    .min(2, 'Make must be at least 2 characters')
    .max(50, 'Make must be less than 50 characters')
    .required('Make is required'),

  model: yup
    .string()
    .trim()
    .min(2, 'Model must be at least 2 characters')
    .max(50, 'Model must be less than 50 characters')
    .required('Model is required'),

  year: yup
    .number()
    .integer('Year must be a whole number')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 2, `Year cannot be more than ${new Date().getFullYear() + 2}`)
    .required('Year is required'),

  color: yup
    .string()
    .trim()
    .min(2, 'Color must be at least 2 characters')
    .max(30, 'Color must be less than 30 characters')
    .required('Color is required'),

  fuelType: yup
    .string()
    .oneOf(Object.values(FuelType), 'Please select a valid fuel type')
    .required('Fuel type is required'),

  maxWeight: yup
    .number()
    .positive('Maximum weight must be a positive number')
    .min(1000, 'Maximum weight must be at least 1,000 lbs')
    .max(80000, 'Maximum weight cannot exceed 80,000 lbs')
    .required('Maximum weight is required'),

  currentMileage: yup
    .number()
    .min(0, 'Current mileage cannot be negative')
    .max(9999999, 'Current mileage seems unusually high')
    .required('Current mileage is required'),

  status: yup
    .string()
    .oneOf(Object.values(TruckStatus), 'Please select a valid status')
    .required('Status is required'),

  assignedDriverId: yup.string().nullable().optional(),

  lastMaintenanceDate: yup
    .date()
    .max(new Date(), 'Last maintenance date cannot be in the future')
    .nullable()
    .optional(),

  nextMaintenanceDate: yup
    .date()
    .min(new Date(), 'Next maintenance date must be in the future')
    .nullable()
    .optional(),

  insuranceExpiry: yup
    .date()
    .min(new Date(), 'Insurance expiry date must be in the future')
    .nullable()
    .optional(),

  registrationExpiry: yup
    .date()
    .min(new Date(), 'Registration expiry date must be in the future')
    .nullable()
    .optional(),

  inspectionExpiry: yup
    .date()
    .min(new Date(), 'Inspection expiry date must be in the future')
    .nullable()
    .optional(),

  specifications: yup.object().shape({
    length: yup
      .number()
      .positive('Length must be a positive number')
      .max(100, 'Length cannot exceed 100 feet')
      .required('Length is required'),

    width: yup
      .number()
      .positive('Width must be a positive number')
      .max(20, 'Width cannot exceed 20 feet')
      .required('Width is required'),

    height: yup
      .number()
      .positive('Height must be a positive number')
      .max(20, 'Height cannot exceed 20 feet')
      .required('Height is required'),

    cargoCapacity: yup
      .number()
      .positive('Cargo capacity must be a positive number')
      .max(5000, 'Cargo capacity cannot exceed 5,000 cubic feet')
      .required('Cargo capacity is required'),

    trailerType: yup.string().nullable().optional(),

    hasLiftGate: yup.boolean().default(false),

    hasRefrigeration: yup.boolean().default(false),

    axleCount: yup
      .number()
      .integer('Axle count must be a whole number')
      .min(2, 'Axle count must be at least 2')
      .max(8, 'Axle count cannot exceed 8')
      .required('Axle count is required'),
  }),
});

/**
 * Driver form validation schema
 */
export const driverSchema = yup.object().shape({
  employeeId: yup
    .string()
    .trim()
    .min(2, 'Employee ID must be at least 2 characters')
    .max(20, 'Employee ID must be less than 20 characters')
    .required('Employee ID is required'),

  firstName: commonSchemas.name,
  lastName: commonSchemas.name,
  email: commonSchemas.email,
  phoneNumber: commonSchemas.phone,

  licenseNumber: yup
    .string()
    .matches(patterns.licenseNumber, 'Please enter a valid license number')
    .min(5, 'License number must be at least 5 characters')
    .max(20, 'License number must be less than 20 characters')
    .required('License number is required'),

  licenseClass: yup
    .string()
    .trim()
    .min(1, 'License class is required')
    .max(10, 'License class must be less than 10 characters')
    .required('License class is required'),

  licenseExpiry: yup
    .date()
    .min(new Date(), 'License expiry date must be in the future')
    .required('License expiry date is required'),

  dateOfBirth: yup
    .date()
    .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'Driver must be at least 18 years old')
    .min(new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000), 'Driver cannot be older than 100 years')
    .required('Date of birth is required'),

  hireDate: yup
    .date()
    .max(new Date(), 'Hire date cannot be in the future')
    .required('Hire date is required'),

  status: yup
    .string()
    .oneOf(Object.values(DriverStatus), 'Please select a valid status')
    .required('Status is required'),

  currentTruckId: yup.string().nullable().optional(),

  address: commonSchemas.address,

  emergencyContact: yup.object().shape({
    name: commonSchemas.name,
    relationship: yup
      .string()
      .trim()
      .min(2, 'Relationship must be at least 2 characters')
      .max(50, 'Relationship must be less than 50 characters')
      .required('Relationship is required'),
    phoneNumber: commonSchemas.phone,
    alternatePhone: yup
      .string()
      .matches(patterns.phone, 'Please enter a valid alternate phone number')
      .nullable()
      .optional(),
  }),
});

/**
 * Load form validation schema
 */
export const loadSchema = yup.object().shape({
  loadNumber: yup
    .string()
    .trim()
    .min(3, 'Load number must be at least 3 characters')
    .max(50, 'Load number must be less than 50 characters')
    .required('Load number is required'),

  customerId: yup
    .string()
    .required('Customer is required'),

  customerName: yup
    .string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must be less than 100 characters')
    .required('Customer name is required'),

  status: yup
    .string()
    .oneOf(Object.values(LoadStatus), 'Please select a valid status')
    .required('Status is required'),

  priority: yup
    .string()
    .oneOf(Object.values(LoadPriority), 'Please select a valid priority')
    .required('Priority is required'),

  loadType: yup
    .string()
    .oneOf(Object.values(LoadType), 'Please select a valid load type')
    .required('Load type is required'),

  assignedTruckId: yup.string().nullable().optional(),
  assignedDriverId: yup.string().nullable().optional(),

  pickupLocation: yup.object().shape({
    address: commonSchemas.address,
    contactName: commonSchemas.name,
    contactPhone: commonSchemas.phone,
    contactEmail: commonSchemas.email.nullable().optional(),
    appointmentRequired: yup.boolean().default(false),
    specialInstructions: yup
      .string()
      .max(500, 'Special instructions must be less than 500 characters')
      .nullable()
      .optional(),
    dockNumber: yup
      .string()
      .max(20, 'Dock number must be less than 20 characters')
      .nullable()
      .optional(),
  }),

  deliveryLocation: yup.object().shape({
    address: commonSchemas.address,
    contactName: commonSchemas.name,
    contactPhone: commonSchemas.phone,
    contactEmail: commonSchemas.email.nullable().optional(),
    appointmentRequired: yup.boolean().default(false),
    specialInstructions: yup
      .string()
      .max(500, 'Special instructions must be less than 500 characters')
      .nullable()
      .optional(),
    dockNumber: yup
      .string()
      .max(20, 'Dock number must be less than 20 characters')
      .nullable()
      .optional(),
  }),

  scheduledPickupDate: yup
    .date()
    .min(new Date(), 'Pickup date must be in the future')
    .required('Scheduled pickup date is required'),

  scheduledDeliveryDate: yup
    .date()
    .min(yup.ref('scheduledPickupDate'), 'Delivery date must be after pickup date')
    .required('Scheduled delivery date is required'),

  distance: yup
    .number()
    .positive('Distance must be a positive number')
    .max(10000, 'Distance cannot exceed 10,000 miles')
    .required('Distance is required'),

  rate: yup
    .number()
    .positive('Rate must be a positive number')
    .max(1000000, 'Rate cannot exceed $1,000,000')
    .required('Rate is required'),

  currency: yup
    .string()
    .trim()
    .length(3, 'Currency must be 3 characters (e.g., USD)')
    .default('USD')
    .required('Currency is required'),

  weight: yup
    .number()
    .positive('Weight must be a positive number')
    .max(80000, 'Weight cannot exceed 80,000 lbs')
    .required('Weight is required'),

  volume: yup
    .number()
    .positive('Volume must be a positive number')
    .max(5000, 'Volume cannot exceed 5,000 cubic feet')
    .nullable()
    .optional(),

  specialInstructions: yup
    .string()
    .max(1000, 'Special instructions must be less than 1,000 characters')
    .nullable()
    .optional(),

  cargo: yup.array().of(
    yup.object().shape({
      description: yup
        .string()
        .trim()
        .min(2, 'Description must be at least 2 characters')
        .max(200, 'Description must be less than 200 characters')
        .required('Description is required'),

      quantity: yup
        .number()
        .positive('Quantity must be a positive number')
        .max(10000, 'Quantity cannot exceed 10,000')
        .required('Quantity is required'),

      unit: yup
        .string()
        .trim()
        .min(1, 'Unit is required')
        .max(20, 'Unit must be less than 20 characters')
        .required('Unit is required'),

      weight: yup
        .number()
        .positive('Weight must be a positive number')
        .max(80000, 'Weight cannot exceed 80,000 lbs')
        .required('Weight is required'),

      value: yup
        .number()
        .positive('Value must be a positive number')
        .max(10000000, 'Value cannot exceed $10,000,000')
        .nullable()
        .optional(),

      hazmat: yup.boolean().default(false),

      dimensions: yup.object().shape({
        length: yup
          .number()
          .positive('Length must be a positive number')
          .max(1000, 'Length cannot exceed 1,000 units'),
        width: yup
          .number()
          .positive('Width must be a positive number')
          .max(1000, 'Width cannot exceed 1,000 units'),
        height: yup
          .number()
          .positive('Height must be a positive number')
          .max(1000, 'Height cannot exceed 1,000 units'),
        unit: yup
          .string()
          .oneOf(['in', 'cm', 'ft', 'm'], 'Invalid dimension unit')
          .required('Dimension unit is required'),
      }).nullable().optional(),
    })
  ).min(1, 'At least one cargo item is required'),
});

/**
 * Company form validation schema
 */
export const companySchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters')
    .required('Company name is required'),

  mcNumber: yup
    .string()
    .matches(/^MC-?\d{6,7}$/i, 'MC number format: MC-123456 or MC123456')
    .nullable()
    .optional(),

  dotNumber: yup
    .string()
    .matches(/^\d{6,8}$/, 'DOT number must be 6-8 digits')
    .nullable()
    .optional(),

  address: commonSchemas.address,
  phoneNumber: commonSchemas.phone,
  email: commonSchemas.email,

  website: yup
    .string()
    .url('Please enter a valid website URL')
    .nullable()
    .optional(),
});

/**
 * User profile validation schema
 */
export const userProfileSchema = yup.object().shape({
  displayName: yup
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .required('Display name is required'),

  email: commonSchemas.email,

  preferences: yup.object().shape({
    theme: yup
      .string()
      .oneOf(['light', 'dark', 'system'], 'Please select a valid theme')
      .default('system'),

    notifications: yup.object().shape({
      email: yup.boolean().default(true),
      push: yup.boolean().default(true),
      loadUpdates: yup.boolean().default(true),
      maintenanceAlerts: yup.boolean().default(true),
      emergencyAlerts: yup.boolean().default(true),
    }),

    dashboard: yup.object().shape({
      defaultView: yup
        .string()
        .oneOf(['overview', 'map', 'loads', 'trucks'], 'Please select a valid default view')
        .default('overview'),

      refreshInterval: yup
        .number()
        .integer('Refresh interval must be a whole number')
        .min(30, 'Refresh interval must be at least 30 seconds')
        .max(300, 'Refresh interval cannot exceed 300 seconds')
        .default(60),

      showMetrics: yup.boolean().default(true),
    }),

    mapSettings: yup.object().shape({
      defaultZoom: yup
        .number()
        .min(1, 'Zoom level must be at least 1')
        .max(20, 'Zoom level cannot exceed 20')
        .default(10),

      style: yup
        .string()
        .oneOf(['streets', 'satellite', 'terrain'], 'Please select a valid map style')
        .default('streets'),

      showTraffic: yup.boolean().default(true),
      showWeather: yup.boolean().default(false),
    }),
  }),
});

/**
 * Validation error formatter
 * Converts Yup validation errors to user-friendly messages
 */
export const formatValidationErrors = (error: yup.ValidationError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (error.inner && error.inner.length > 0) {
    error.inner.forEach((err) => {
      if (err.path) {
        errors[err.path] = err.message;
      }
    });
  } else if (error.path) {
    errors[error.path] = error.message;
  }
  
  return errors;
};

/**
 * Async validation helper
 * Validates data against a schema and returns formatted errors
 */
export const validateAsync = async <T>(
  schema: yup.Schema<T>,
  data: Record<string, unknown>
): Promise<{ isValid: boolean; errors: Record<string, string>; data?: T }> => {
  try {
    const validData = await schema.validate(data, { abortEarly: false });
    return {
      isValid: true,
      errors: {},
      data: validData,
    };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return {
        isValid: false,
        errors: formatValidationErrors(error),
      };
    }
    throw error;
  }
};