import React, { useState } from 'react';
import { User, UserRole } from '../types/division';
import { divisions } from '../data/divisions';
import { useFormValidation } from '../hooks/useFormValidation';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
import { handleFormSubmission } from '../utils/buttonHelpers';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  const { isLoading, execute } = useAsyncOperation();
  
  const validationRules = {
    email: [
      { required: true, message: 'Email is required' },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
    ],
    password: [
      { required: true, message: 'Password is required' },
      { minLength: 6, message: 'Password must be at least 6 characters' },
    ],
    division: [
      { 
        custom: () => selectedRole !== 'division-manager' || selectedDivision !== '',
        message: 'Division is required for division managers'
      },
    ],
  };
  
  const { errors, validateForm } = useFormValidation(validationRules);
  const handleSubmit = (e: React.FormEvent) => {
    handleFormSubmission(e, async () => {
      const formData = { email, password, division: selectedDivision };
      
      if (!validateForm(formData)) {
        return;
      }

      await execute(async () => {
        // Simulate login delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user: User = {
          id: '1',
          name: email.split('@')[0],
          email,
          role: selectedRole,
          divisionId: selectedRole === 'division-manager' ? selectedDivision : undefined,
        };

        return user;
      }, (user) => {
        onLogin(user);
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            True Balance Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the division performance dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="admin">Admin</option>
                <option value="division-manager">Division Manager</option>
                <option value="executive">Executive</option>
              </select>
              {errors.division && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.division[0]}
                </div>
              )}
            </div>

            {selectedRole === 'division-manager' && (
              <div>
                <label htmlFor="division" className="block text-sm font-medium text-gray-700">
                  Division
                </label>
                <select
                  id="division"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a division</option>
                  {divisions.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
                {errors.division && (
                  <div className="mt-1 text-sm text-red-600">
                    {errors.division[0]}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-apple-blue hover:bg-apple-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-apple-blue transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
          
          {/* Display validation errors */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-800">
                Please fix the following errors:
                <ul className="mt-1 list-disc list-inside">
                  {Object.values(errors).flat().map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;