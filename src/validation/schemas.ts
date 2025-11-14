// validation
import * as yup from 'yup';

/**
 * Common validation patterns
 */
const phoneRegex = /^\+?[\d\s\-()]+$/;

/**
 * Driver validation schema - simplified based on PRD requirements
 */
export const driverValidationSchema = yup.object({
  name: yup
    .string()
    .required('Driver name is required')
    .min(2, 'Name must be at least 2 characters'),
  
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Invalid phone number format'),
  
  license: yup
    .string()
    .required('Driver license (CNH) is required')
    .min(5, 'License number must be at least 5 characters'),
  
  truckId: yup
    .string()
    .nullable(),
});

/**
 * Truck validation schema - simplified based on PRD requirements
 */
export const truckValidationSchema = yup.object({
  licensePlate: yup
    .string()
    .required('License plate is required')
    .min(2, 'License plate must be at least 2 characters'),
  
  model: yup
    .string()
    .required('Model is required')
    .min(2, 'Model must be at least 2 characters'),
  
  capacity: yup
    .number()
    .required('Capacity is required')
    .min(1, 'Capacity must be at least 1 kg')
    .max(80000, 'Capacity cannot exceed 80,000 kg'),
  
  year: yup
    .number()
    .required('Year is required')
    .min(1980, 'Year must be 1980 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  
  status: yup
    .string()
    .required('Status is required')
    .oneOf(['active', 'maintenance'], 'Invalid status'),
  
  driverId: yup
    .string()
    .nullable(),
});

/**
 * Brazilian CEP validation pattern (XXXXX-XXX or XXXXXXXX)
 */
const cepRegex = /^\d{5}-?\d{3}$/;

/**
 * Brazilian state codes
 */
const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

/**
 * Address validation schema for Brazilian addresses
 */
const addressSchema = yup.object({
  street: yup
    .string()
    .required('Street address is required')
    .min(5, 'Street address must be at least 5 characters'),
  
  city: yup
    .string()
    .required('City is required')
    .min(2, 'City must be at least 2 characters'),
  
  state: yup
    .string()
    .required('State is required')
    .oneOf(brazilianStates, 'Invalid Brazilian state code'),
  
  zipCode: yup
    .string()
    .required('CEP is required')
    .matches(cepRegex, 'CEP must be in format XXXXX-XXX'),
  
  coordinates: yup
    .object({
      lat: yup.number(),
      lng: yup.number()
    })
    .nullable()
    .notRequired()
});

/**
 * Load validation schema - simplified based on PRD requirements
 * Using flat structure to match form fields
 */
export const loadValidationSchema = yup.object({
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
  
  weight: yup
    .number()
    .required('Weight is required')
    .min(1, 'Weight must be at least 1 kg')
    .max(80000, 'Weight cannot exceed 80,000 kg'),
  
  'origin.street': yup
    .string()
    .required('Origin street is required')
    .min(5, 'Origin street must be at least 5 characters'),
  
  'origin.city': yup
    .string()
    .required('Origin city is required')
    .min(2, 'Origin city must be at least 2 characters'),
    
  'origin.state': yup
    .string()
    .required('Origin state is required')
    .oneOf(brazilianStates, 'Invalid Brazilian state code'),
    
  'origin.zipCode': yup
    .string()
    .required('Origin CEP is required')
    .matches(cepRegex, 'CEP must be in format XXXXX-XXX'),
  
  'destination.street': yup
    .string()
    .required('Destination street is required')
    .min(5, 'Destination street must be at least 5 characters'),
  
  'destination.city': yup
    .string()
    .required('Destination city is required')
    .min(2, 'Destination city must be at least 2 characters'),
    
  'destination.state': yup
    .string()
    .required('Destination state is required')
    .oneOf(brazilianStates, 'Invalid Brazilian state code'),
    
  'destination.zipCode': yup
    .string()
    .required('Destination CEP is required')
    .matches(cepRegex, 'CEP must be in format XXXXX-XXX'),
  
  status: yup
    .string()
    .required('Status is required')
    .oneOf(['planned', 'in route', 'delivered'] as const, 'Invalid status'),
  
  driverId: yup
    .string()
    .required('Driver is required'),
  
  truckId: yup
    .string()
    .required('Truck is required'),
});

/**
 * User validation schema
 */
export const userValidationSchema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format'),
  
  phone: yup
    .string()
    .matches(phoneRegex, 'Invalid phone number format'),
  
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['admin', 'manager', 'dispatcher', 'driver'], 'Invalid role'),
  
  company: yup
    .string()
    .required('Company is required'),
});

/**
 * Login validation schema
 */
export const loginValidationSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

/**
 * Registration validation schema
 */
export const registrationValidationSchema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  
  company: yup
    .string()
    .required('Company name is required'),
  
  phone: yup
    .string()
    .matches(phoneRegex, 'Invalid phone number format'),
});