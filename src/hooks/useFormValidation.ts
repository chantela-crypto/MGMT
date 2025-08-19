import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

interface ValidationRules {
  [fieldName: string]: ValidationRule[];
}

interface ValidationErrors {
  [fieldName: string]: string[];
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValid, setIsValid] = useState<boolean>(true);

  const validateField = useCallback((fieldName: string, value: any): string[] => {
    const fieldRules = rules[fieldName] || [];
    const fieldErrors: string[] = [];

    fieldRules.forEach(rule => {
      if (rule.required && (!value || value === '')) {
        fieldErrors.push(rule.message);
      } else if (rule.minLength && value && value.length < rule.minLength) {
        fieldErrors.push(rule.message);
      } else if (rule.maxLength && value && value.length > rule.maxLength) {
        fieldErrors.push(rule.message);
      } else if (rule.pattern && value && !rule.pattern.test(value)) {
        fieldErrors.push(rule.message);
      } else if (rule.custom && value && !rule.custom(value)) {
        fieldErrors.push(rule.message);
      }
    });

    return fieldErrors;
  }, [rules]);

  const validateForm = useCallback((formData: Record<string, any>): boolean => {
    const newErrors: ValidationErrors = {};
    let formIsValid = true;

    Object.keys(rules).forEach(fieldName => {
      const fieldErrors = validateField(fieldName, formData[fieldName]);
      if (fieldErrors.length > 0) {
        newErrors[fieldName] = fieldErrors;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(formIsValid);
    return formIsValid;
  }, [rules, validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(true);
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    isValid,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
  };
};