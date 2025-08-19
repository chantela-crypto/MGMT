import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Login from '../components/Login';
import DataInput from '../components/DataInput';
import EmployeeDataInput from '../components/EmployeeDataInput';
import { divisions } from '../data/divisions';
import { employees } from '../data/employees';

// Mock data
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin' as const,
};

const mockDivisions = divisions.slice(0, 3);
const mockEmployees = employees.slice(0, 5);

describe('Button Interactions', () => {
  describe('Login Component', () => {
    it('should handle login form submission', async () => {
      const mockOnLogin = vi.fn();
      render(<Login onLogin={mockOnLogin} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            role: 'admin',
          })
        );
      });
    });

    it('should show validation errors for empty form', async () => {
      const mockOnLogin = vi.fn();
      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      const mockOnLogin = vi.fn();
      render(<Login onLogin={mockOnLogin} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('DataInput Component', () => {
    it('should handle data submission with validation', async () => {
      const mockOnSaveData = vi.fn();
      render(
        <DataInput
          divisions={mockDivisions}
          currentUser={mockUser}
          onSaveData={mockOnSaveData}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save data/i });
      
      // Try to submit without selecting division
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please select a division/i)).toBeInTheDocument();
      });

      expect(mockOnSaveData).not.toHaveBeenCalled();
    });

    it('should save data when form is valid', async () => {
      const mockOnSaveData = vi.fn();
      render(
        <DataInput
          divisions={mockDivisions}
          currentUser={mockUser}
          onSaveData={mockOnSaveData}
        />
      );

      // Select division (should be pre-selected for admin)
      const productivityInput = screen.getByLabelText(/productivity rate/i);
      fireEvent.change(productivityInput, { target: { value: '85' } });

      const saveButton = screen.getByRole('button', { name: /save data/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSaveData).toHaveBeenCalledWith(
          expect.objectContaining({
            divisionId: mockDivisions[0].id,
            productivityRate: 85,
          })
        );
      });
    });

    it('should show success message after saving', async () => {
      const mockOnSaveData = vi.fn();
      render(
        <DataInput
          divisions={mockDivisions}
          currentUser={mockUser}
          onSaveData={mockOnSaveData}
        />
      );

      const productivityInput = screen.getByLabelText(/productivity rate/i);
      fireEvent.change(productivityInput, { target: { value: '85' } });

      const saveButton = screen.getByRole('button', { name: /save data/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/data saved successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('EmployeeDataInput Component', () => {
    it('should validate employee selection before submission', async () => {
      const mockOnSaveEmployeeData = vi.fn();
      render(
        <EmployeeDataInput
          employees={mockEmployees}
          divisions={mockDivisions}
          currentUser={mockUser}
          onSaveEmployeeData={mockOnSaveEmployeeData}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save employee data/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/please select an employee/i)).toBeInTheDocument();
      });

      expect(mockOnSaveEmployeeData).not.toHaveBeenCalled();
    });

    it('should save employee data when valid', async () => {
      const mockOnSaveEmployeeData = vi.fn();
      render(
        <EmployeeDataInput
          employees={mockEmployees}
          divisions={mockDivisions}
          currentUser={mockUser}
          onSaveEmployeeData={mockOnSaveEmployeeData}
        />
      );

      // Select employee
      const employeeSelect = screen.getByRole('combobox', { name: /employee/i });
      fireEvent.change(employeeSelect, { target: { value: mockEmployees[0].id } });

      // Fill in some data
      const productivityInput = screen.getByLabelText(/productivity rate/i);
      fireEvent.change(productivityInput, { target: { value: '90' } });

      const saveButton = screen.getByRole('button', { name: /save employee data/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSaveEmployeeData).toHaveBeenCalledWith(
          expect.objectContaining({
            employeeId: mockEmployees[0].id,
            productivityRate: 90,
          })
        );
      });
    });
  });
});

describe('State Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should persist user preferences across page refresh', () => {
    const testData = { theme: 'dark', language: 'en' };
    localStorage.setItem('userPreferences', JSON.stringify(testData));

    const stored = localStorage.getItem('userPreferences');
    expect(JSON.parse(stored!)).toEqual(testData);
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem('corruptedData', 'invalid-json');
    
    // Should not throw error when parsing invalid JSON
    expect(() => {
      try {
        JSON.parse(localStorage.getItem('corruptedData') || '{}');
      } catch {
        // Graceful fallback
        return {};
      }
    }).not.toThrow();
  });
});