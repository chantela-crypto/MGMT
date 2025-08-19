import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../hooks/useFormValidation';

describe('useFormValidation', () => {
  const validationRules = {
    name: [
      { required: true, message: 'Name is required' },
      { minLength: 2, message: 'Name must be at least 2 characters' },
    ],
    email: [
      { required: true, message: 'Email is required' },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
    ],
    age: [
      { custom: (value: number) => value >= 18, message: 'Must be 18 or older' },
    ],
  };

  it('should validate required fields', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const isValid = result.current.validateForm({
        name: '',
        email: 'test@example.com',
        age: 25,
      });
      expect(isValid).toBe(false);
      expect(result.current.errors.name).toContain('Name is required');
    });
  });

  it('should validate email format', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const isValid = result.current.validateForm({
        name: 'John Doe',
        email: 'invalid-email',
        age: 25,
      });
      expect(isValid).toBe(false);
      expect(result.current.errors.email).toContain('Invalid email format');
    });
  });

  it('should validate custom rules', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const isValid = result.current.validateForm({
        name: 'John Doe',
        email: 'test@example.com',
        age: 16,
      });
      expect(isValid).toBe(false);
      expect(result.current.errors.age).toContain('Must be 18 or older');
    });
  });

  it('should pass validation with valid data', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      const isValid = result.current.validateForm({
        name: 'John Doe',
        email: 'test@example.com',
        age: 25,
      });
      expect(isValid).toBe(true);
      expect(Object.keys(result.current.errors)).toHaveLength(0);
    });
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useFormValidation(validationRules));

    act(() => {
      result.current.validateForm({ name: '', email: '', age: 0 });
    });

    expect(Object.keys(result.current.errors)).toHaveLength(2);

    act(() => {
      result.current.clearErrors();
    });

    expect(Object.keys(result.current.errors)).toHaveLength(0);
    expect(result.current.isValid).toBe(true);
  });
});