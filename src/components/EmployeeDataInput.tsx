import React, { useState } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division, User } from '../types/division';
import { Save, Calendar, User as UserIcon } from 'lucide-react';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
import { useFormValidation } from '../hooks/useFormValidation';
import { handleFormSubmission } from '../utils/buttonHelpers';

interface EmployeeDataInputProps {
  employees: Employee[];
  divisions: Division[];
  currentUser: User;
  onSaveEmployeeData: (data: EmployeeKPIData) => void;
}

const EmployeeDataInput: React.FC<EmployeeDataInputProps> = ({
  employees,
  divisions,
  currentUser,
  onSaveEmployeeData,
}) => {
  const { isLoading, error, execute } = useAsyncOperation();
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [formData, setFormData] = useState<Partial<EmployeeKPIData>>({
    productivityRate: 0,
    prebookRate: 0,
    firstTimeRetentionRate: 0,
    repeatRetentionRate: 0,
    retailPercentage: 0,
    newClients: 0,
    averageTicket: 0,
    serviceSalesPerHour: 0,
    clientsRetailPercentage: 0,
    hoursSold: 0,
    happinessScore: 0,
    netCashPercentage: 0,
    attendanceRate: 0,
    trainingHours: 0,
    customerSatisfactionScore: 0,
  });

  const validationRules = {
    employee: [
      { required: true, message: 'Please select an employee' },
    ],
  };
  
  const { errors, validateForm } = useFormValidation(validationRules);

  const availableEmployees = currentUser.role === 'division-manager' && currentUser.divisionId
    ? employees.filter(emp => emp.divisionId === currentUser.divisionId && emp.isActive)
    : employees.filter(emp => emp.isActive);

  const handleInputChange = (field: keyof EmployeeKPIData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    handleFormSubmission(e, async () => {
      const formValidationData = { employee: selectedEmployee };
      
      if (!validateForm(formValidationData)) {
        return;
      }

      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) {
        throw new Error('Selected employee not found');
      }

      await execute(async () => {
        const employeeKPIData: EmployeeKPIData = {
          employeeId: selectedEmployee,
          divisionId: employee.divisionId,
          month: selectedMonth,
          year: selectedYear,
          productivityRate: formData.productivityRate || 0,
          prebookRate: formData.prebookRate || 0,
          firstTimeRetentionRate: formData.firstTimeRetentionRate || 0,
          repeatRetentionRate: formData.repeatRetentionRate || 0,
          retailPercentage: formData.retailPercentage || 0,
          newClients: formData.newClients || 0,
          averageTicket: formData.averageTicket || 0,
          serviceSalesPerHour: formData.serviceSalesPerHour || 0,
          clientsRetailPercentage: formData.clientsRetailPercentage || 0,
          hoursSold: formData.hoursSold || 0,
          happinessScore: formData.happinessScore || 0,
          netCashPercentage: formData.netCashPercentage || 0,
          attendanceRate: formData.attendanceRate || 0,
          trainingHours: formData.trainingHours || 0,
          customerSatisfactionScore: formData.customerSatisfactionScore || 0,
        };

        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return employeeKPIData;
      }, (savedData) => {
        onSaveEmployeeData(savedData);
        setSuccessMessage(`Employee data saved successfully for ${employee.name}!`);
        
        // Reset form
        setFormData({
          productivityRate: 0,
          prebookRate: 0,
          firstTimeRetentionRate: 0,
          repeatRetentionRate: 0,
          retailPercentage: 0,
          newClients: 0,
          averageTicket: 0,
          serviceSalesPerHour: 0,
          clientsRetailPercentage: 0,
          hoursSold: 0,
          happinessScore: 0,
          netCashPercentage: 0,
          attendanceRate: 0,
          trainingHours: 0,
          customerSatisfactionScore: 0,
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      });
    });
  };

  const formFields = [
    { key: 'productivityRate', label: 'Productivity Rate (%)', type: 'percentage' },
    { key: 'prebookRate', label: 'Prebook Rate (%)', type: 'percentage' },
    { key: 'firstTimeRetentionRate', label: 'First-Time Retention Rate (%)', type: 'percentage' },
    { key: 'repeatRetentionRate', label: 'Repeat Retention Rate (%)', type: 'percentage' },
    { key: 'retailPercentage', label: 'Retail % of Total Sales', type: 'percentage' },
    { key: 'newClients', label: 'Number of New Clients', type: 'number' },
    { key: 'averageTicket', label: 'Average Ticket ($)', type: 'currency' },
    { key: 'serviceSalesPerHour', label: 'Service Sales per Hour ($)', type: 'currency' },
    { key: 'clientsRetailPercentage', label: '% of Clients Purchasing Retail', type: 'percentage' },
    { key: 'hoursSold', label: 'Number of Hours Sold', type: 'number' },
    { key: 'happinessScore', label: 'Happiness Score (1-10)', type: 'score' },
    { key: 'netCashPercentage', label: 'Net Cash % / Profit Contribution', type: 'percentage' },
    { key: 'attendanceRate', label: 'Attendance Rate (%)', type: 'percentage' },
    { key: 'trainingHours', label: 'Training Hours Completed', type: 'number' },
    { key: 'customerSatisfactionScore', label: 'Customer Satisfaction Score (1-10)', type: 'score' },
  ];

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <UserIcon className="h-6 w-6 text-[#f4647d] mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Employee Data Input</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            required
          >
            <option value="">Select Employee</option>
            {availableEmployees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name} - {employee.position}
              </option>
            ))}
          </select>
          {errors.employee && (
            <div className="mt-1 text-sm text-red-600">
              {errors.employee[0]}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Division
          </label>
          <input
            type="text"
            value={selectedEmployeeData ? divisions.find(d => d.id === selectedEmployeeData.divisionId)?.name || '' : ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                {new Date(2024, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {selectedEmployeeData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Employee</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{selectedEmployeeData.name}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Position</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{selectedEmployeeData.position}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Division</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {divisions.find(d => d.id === selectedEmployeeData.divisionId)?.name || 'Unknown'}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Hire Date</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {selectedEmployeeData.hireDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm text-green-800">{successMessage}</div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-800">Error: {error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formFields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <input
                type="number"
                step={field.type === 'percentage' || field.type === 'score' ? '0.1' : '1'}
                min="0"
                max={field.type === 'score' ? '10' : field.type === 'percentage' ? '100' : undefined}
                value={formData[field.key as keyof EmployeeKPIData] || ''}
                onChange={(e) => handleInputChange(
                  field.key as keyof EmployeeKPIData,
                  parseFloat(e.target.value) || 0
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                required
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={!selectedEmployee}
            disabled={isLoading || !selectedEmployee}
            className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] focus:outline-none focus:ring-2 focus:ring-[#f4647d] disabled:bg-gray-400"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Employee Data
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeDataInput;