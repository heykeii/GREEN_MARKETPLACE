// Frontend validation utilities
import React from 'react';
import { validateForm, showValidationErrors } from './errorHandling';

// Common validation rules
export const VALIDATION_RULES = {
  email: {
    required: true,
    email: true,
    label: 'Email'
  },
  
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    patternMessage: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    label: 'Password'
  },
  
  confirmPassword: (password) => ({
    required: true,
    validate: (value) => value === password ? null : 'Passwords do not match',
    label: 'Confirm Password'
  }),
  
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    patternMessage: 'First name can only contain letters, spaces, hyphens, and apostrophes',
    label: 'First Name'
  },
  
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    patternMessage: 'Last name can only contain letters, spaces, hyphens, and apostrophes',
    label: 'Last Name'
  },
  
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    patternMessage: 'Please enter a valid phone number',
    label: 'Phone Number'
  },
  
  productName: {
    required: true,
    minLength: 3,
    maxLength: 100,
    label: 'Product Name'
  },
  
  productDescription: {
    required: true,
    minLength: 10,
    maxLength: 2000,
    label: 'Product Description'
  },
  
  price: {
    required: true,
    validate: (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return 'Price must be a positive number';
      }
      if (num > 999999) {
        return 'Price cannot exceed $999,999';
      }
      return null;
    },
    label: 'Price'
  },
  
  quantity: {
    required: true,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) {
        return 'Quantity must be a non-negative number';
      }
      if (num > 99999) {
        return 'Quantity cannot exceed 99,999';
      }
      return null;
    },
    label: 'Quantity'
  },
  
  category: {
    required: true,
    label: 'Category'
  },
  
  rating: {
    required: true,
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 5) {
        return 'Rating must be between 1 and 5';
      }
      return null;
    },
    label: 'Rating'
  },
  
  comment: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    label: 'Comment'
  },
  
  campaignTitle: {
    required: true,
    minLength: 5,
    maxLength: 100,
    label: 'Campaign Title'
  },
  
  campaignDescription: {
    required: true,
    minLength: 20,
    maxLength: 5000,
    label: 'Campaign Description'
  }
};

// Form validation schemas
export const FORM_SCHEMAS = {
  login: {
    email: VALIDATION_RULES.email,
    password: { ...VALIDATION_RULES.password, pattern: undefined, patternMessage: undefined } // Don't validate password complexity on login
  },
  
  register: {
    firstName: VALIDATION_RULES.firstName,
    lastName: VALIDATION_RULES.lastName,
    email: VALIDATION_RULES.email,
    password: VALIDATION_RULES.password,
    confirmPassword: (data) => VALIDATION_RULES.confirmPassword(data.password)
  },
  
  profile: {
    firstName: VALIDATION_RULES.firstName,
    lastName: VALIDATION_RULES.lastName,
    email: VALIDATION_RULES.email,
    phone: { ...VALIDATION_RULES.phone, required: false }
  },
  
  product: {
    name: VALIDATION_RULES.productName,
    description: VALIDATION_RULES.productDescription,
    price: VALIDATION_RULES.price,
    quantity: VALIDATION_RULES.quantity,
    category: VALIDATION_RULES.category,
    materialsUsed: {
      required: true,
      minLength: 5,
      maxLength: 500,
      label: 'Materials Used'
    }
  },
  
  review: {
    rating: VALIDATION_RULES.rating,
    comment: VALIDATION_RULES.comment
  },
  
  campaign: {
    title: VALIDATION_RULES.campaignTitle,
    description: VALIDATION_RULES.campaignDescription,
    type: {
      required: true,
      label: 'Campaign Type'
    }
  },
  
  changePassword: {
    currentPassword: {
      required: true,
      label: 'Current Password'
    },
    newPassword: VALIDATION_RULES.password,
    confirmNewPassword: (data) => VALIDATION_RULES.confirmPassword(data.newPassword)
  }
};

// Validate a form using a schema
export const validateFormWithSchema = (data, schemaName) => {
  const schema = FORM_SCHEMAS[schemaName];
  if (!schema) {
    throw new Error(`Validation schema '${schemaName}' not found`);
  }
  
  // Process schema to handle dynamic rules
  const processedSchema = {};
  for (const [field, rules] of Object.entries(schema)) {
    if (typeof rules === 'function') {
      processedSchema[field] = rules(data);
    } else {
      processedSchema[field] = rules;
    }
  }
  
  return validateForm(data, processedSchema);
};

// Validate individual field
export const validateField = (value, fieldName, rules) => {
  const errors = validateForm({ [fieldName]: value }, { [fieldName]: rules });
  return errors[fieldName] || null;
};

// Real-time validation hook for forms
export const useFormValidation = (initialData = {}, schemaName) => {
  const [data, setData] = React.useState(initialData);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateSingle = (field, value) => {
    const schema = FORM_SCHEMAS[schemaName];
    if (!schema || !schema[field]) return null;
    
    const fieldRules = typeof schema[field] === 'function' 
      ? schema[field](data) 
      : schema[field];
    
    return validateField(value, field, fieldRules);
  };

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Validate field if it has been touched
    if (touched[field]) {
      const error = validateSingle(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateSingle(field, data[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAll = () => {
    const validationErrors = validateFormWithSchema(data, schemaName);
    setErrors(validationErrors);
    setTouched(
      Object.keys(FORM_SCHEMAS[schemaName]).reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {})
    );
    return Object.keys(validationErrors).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    clearErrors,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).length > 0
  };
};

// File validation
export const validateFiles = (files, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles = 10,
    minFiles = 0
  } = options;

  const errors = [];

  if (files.length < minFiles) {
    errors.push(`Please select at least ${minFiles} file${minFiles !== 1 ? 's' : ''}`);
  }

  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
  }

  files.forEach((file, index) => {
    if (file.size > maxSize) {
      errors.push(`File ${index + 1} (${file.name}) is too large. Maximum size is ${formatFileSize(maxSize)}`);
    }

    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = allowedTypes.map(type => type.split('/')[1]).join(', ');
      errors.push(`File ${index + 1} (${file.name}) has invalid type. Allowed types: ${allowedExtensions}`);
    }
  });

  return errors;
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Export individual validation functions for standalone use
export {
  validateForm,
  showValidationErrors,
  validateField
};

export default {
  VALIDATION_RULES,
  FORM_SCHEMAS,
  validateFormWithSchema,
  validateField,
  useFormValidation,
  validateFiles
};
