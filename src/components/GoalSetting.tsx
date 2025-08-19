import React, { useState } from 'react';
import { Division, KPITarget } from '../types/division';
import { Employee, EmployeeTarget, DivisionTarget } from '../types/employee';
import { Target, Save, TrendingUp, Calendar, Users, User } from 'lucide-react';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
import { useFormValidation } from '../hooks/useFormValidation';
import { handleFormSubmission } from '../utils/buttonHelpers';

interface GoalSettingProps {
  divisions: Division[];
  employees: Employee[];
  divisionTargets: DivisionTarget[];
  employeeTargets: EmployeeTarget[];
  onUpdateDivisionTarget: (target: DivisionTarget) => void;
  onUpdateEmployeeTarget: (target: EmployeeTarget) => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({
  divisions,
  employees,
  divisionTargets,
  employeeTargets,
  onUpdateDivisionTarget,
  onUpdateEmployeeTarget,
}) => {
  const { isLoading: divisionLoading, error: divisionError, execute: executeDivision } = useAsyncOperation();
  const { isLoading: employeeLoading, error: employeeError, execute: executeEmployee } = useAsyncOperation();
  const [divisionSuccessMessage, setDivisionSuccessMessage] = useState<string>('');
  const [employeeSuccessMessage, setEmployeeSuccessMessage] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'division' | 'employee'>('division');
  
  // Division state
  const [selectedDivision, setSelectedDivision] = useState<string>(divisions[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [divisionTargetForm, setDivisionTargetForm] = useState<Partial<DivisionTarget>>({
    productivityRate: 85,
    prebookRate: 75,
    firstTimeRetentionRate: 80,
    repeatRetentionRate: 90,
    retailPercentage: 25,
    newClients: 50,
    averageTicket: 250,
    serviceSalesPerHour: 150,
    clientsRetailPercentage: 60,
    hoursSold: 160,
    happinessScore: 8.5,
    netCashPercentage: 70,
    revenue: 50000,
    profitMargin: 25,
  });

  const divisionValidationRules = {
    division: [
      { required: true, message: 'Please select a division' },
    ],
  };
  
  const employeeValidationRules = {
    employee: [
      { required: true, message: 'Please select an employee' },
    ],
  };
  
  const { errors: divisionErrors, validateForm: validateDivisionForm } = useFormValidation(divisionValidationRules);
  const { errors: employeeErrors, validateForm: validateEmployeeForm } = useFormValidation(employeeValidationRules);

  // Employee state
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeeSelectedMonth, setEmployeeSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [employeeSelectedYear, setEmployeeSelectedYear] = useState<number>(new Date().getFullYear());
  const [employeeTargetForm, setEmployeeTargetForm] = useState<Partial<EmployeeTarget>>({});

  const getCurrentDivisionTarget = () => {
    return divisionTargets.find(target => 
      target.divisionId === selectedDivision &&
      target.month === selectedMonth &&
      target.year === selectedYear
    );
  };

  const getCurrentEmployeeTarget = () => {
    return employeeTargets.find(target => 
      target.employeeId === selectedEmployee &&
      target.month === employeeSelectedMonth &&
      target.year === employeeSelectedYear
    );
  };

  React.useEffect(() => {
    const currentTarget = getCurrentDivisionTarget();
    if (currentTarget) {
      setDivisionTargetForm(currentTarget);
    } else {
      setDivisionTargetForm({
        productivityRate: 85,
        prebookRate: 75,
        firstTimeRetentionRate: 80,
        repeatRetentionRate: 90,
        retailPercentage: 25,
        newClients: 50,
        averageTicket: 250,
        serviceSalesPerHour: 150,
        clientsRetailPercentage: 60,
        hoursSold: 160,
        happinessScore: 8.5,
        netCashPercentage: 70,
        revenue: 50000,
        profitMargin: 25,
      });
    }
  }, [selectedDivision, selectedMonth, selectedYear, divisionTargets]);

  React.useEffect(() => {
    const currentTarget = getCurrentEmployeeTarget();
    if (currentTarget) {
      setEmployeeTargetForm(currentTarget);
    } else if (selectedEmployee) {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (employee) {
        setEmployeeTargetForm({
          employeeId: selectedEmployee,
          divisionId: employee.divisionId,
          month: employeeSelectedMonth,
          year: employeeSelectedYear,
          productivityRate: 85,
          prebookRate: 75,
          firstTimeRetentionRate: 80,
          repeatRetentionRate: 90,
          retailPercentage: 25,
          newClients: 30,
          averageTicket: 250,
          serviceSalesPerHour: 150,
          clientsRetailPercentage: 60,
          hoursSold: 120,
          happinessScore: 8.5,
          netCashPercentage: 70,
          attendanceRate: 95,
          trainingHours: 8,
          customerSatisfactionScore: 9.0,
        });
      }
    }
  }, [selectedEmployee, employeeSelectedMonth, employeeSelectedYear, employees, employeeTargets]);

  const handleSaveDivisionTarget = async () => {
    const formValidationData = { division: selectedDivision };
    
    if (!validateDivisionForm(formValidationData)) {
      return;
    }

    await executeDivision(async () => {
      const target: DivisionTarget = {
        divisionId: selectedDivision,
        month: selectedMonth,
        year: selectedYear,
        ...divisionTargetForm,
      } as DivisionTarget;

      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return target;
    }, (savedTarget) => {
      onUpdateDivisionTarget(savedTarget);
      const divisionName = divisions.find(d => d.id === selectedDivision)?.name || 'Division';
      setDivisionSuccessMessage(`${divisionName} targets saved successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setDivisionSuccessMessage(''), 3000);
    });
  };

  const handleSaveEmployeeTarget = async () => {
    const formValidationData = { employee: selectedEmployee };
    
    if (!validateEmployeeForm(formValidationData)) {
      return;
    }
    
    if (!employeeTargetForm.employeeId) {
      throw new Error('Employee target form is incomplete');
    }

    await executeEmployee(async () => {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return employeeTargetForm as EmployeeTarget;
    }, (savedTarget) => {
      onUpdateEmployeeTarget(savedTarget);
      const employeeName = employees.find(e => e.id === selectedEmployee)?.name || 'Employee';
      setEmployeeSuccessMessage(`${employeeName} targets saved successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setEmployeeSuccessMessage(''), 3000);
    });
  };

  const divisionTargetFields = [
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
    { key: 'revenue', label: 'Monthly Revenue Target ($)', type: 'currency' },
    { key: 'profitMargin', label: 'Profit Margin Target (%)', type: 'percentage' },
  ];

  const employeeTargetFields = [
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
    { key: 'trainingHours', label: 'Training Hours per Month', type: 'number' },
    { key: 'customerSatisfactionScore', label: 'Customer Satisfaction Score (1-10)', type: 'score' },
  ];

  const availableEmployees = employees.filter(emp => emp.isActive);
  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Target className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Goal Setting</h2>
          </div>
          
          {/* Tab Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('division')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                activeTab === 'division' ? 'bg-white text-[#0c5b63] shadow-sm' : 'text-gray-600'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Division Goals
            </button>
            <button
              onClick={() => setActiveTab('employee')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                activeTab === 'employee' ? 'bg-white text-[#0c5b63] shadow-sm' : 'text-gray-600'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              Employee Goals
            </button>
          </div>
          {divisionErrors.division && (
            <div className="mt-1 text-sm text-red-600">
              {divisionErrors.division[0]}
            </div>
          )}
          {employeeErrors.employee && (
            <div className="mt-1 text-sm text-red-600">
              {employeeErrors.employee[0]}
            </div>
          )}
        </div>

        {/* Success Message */}
        {employeeSuccessMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-800">{employeeSuccessMessage}</div>
          </div>
        )}
        
        {/* Error Message */}
        {employeeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-800">Error: {employeeError}</div>
          </div>
        )}

        {/* Success Message */}
        {divisionSuccessMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-800">{divisionSuccessMessage}</div>
          </div>
        )}
        
        {/* Error Message */}
        {divisionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-800">Error: {divisionError}</div>
          </div>
        )}

        {/* Division Goals Tab */}
        {activeTab === 'division' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Division
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {divisions.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
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
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Setting targets for {divisions.find(d => d.id === selectedDivision)?.name}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleString('default', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {divisionTargetFields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    step={field.type === 'percentage' || field.type === 'score' ? '0.1' : '1'}
                    min="0"
                    max={field.type === 'score' ? '10' : field.type === 'percentage' ? '100' : undefined}
                    value={divisionTargetForm[field.key as keyof DivisionTarget] || ''}
                    onChange={(e) => setDivisionTargetForm(prev => ({
                      ...prev,
                      [field.key]: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveDivisionTarget}
                disabled={employeeLoading || !selectedEmployee}
                className="flex items-center px-6 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                type="button"
              >
                {employeeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Employee Targets
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Employee Goals Tab */}
        {activeTab === 'employee' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                >
                  <option value="">Select Employee</option>
                  {availableEmployees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </option>
                  ))}
                </select>
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
                  value={employeeSelectedMonth}
                  onChange={(e) => setEmployeeSelectedMonth(e.target.value)}
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
                  value={employeeSelectedYear}
                  onChange={(e) => setEmployeeSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>

            {selectedEmployeeData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Setting targets for {selectedEmployeeData.name}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {selectedEmployeeData.position} - {divisions.find(d => d.id === selectedEmployeeData.divisionId)?.name} - {new Date(employeeSelectedYear, parseInt(employeeSelectedMonth) - 1).toLocaleString('default', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedEmployee && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employeeTargetFields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        step={field.type === 'percentage' || field.type === 'score' ? '0.1' : '1'}
                        min="0"
                        max={field.type === 'score' ? '10' : field.type === 'percentage' ? '100' : undefined}
                        value={employeeTargetForm[field.key as keyof EmployeeTarget] || ''}
                        onChange={(e) => setEmployeeTargetForm(prev => ({
                          ...prev,
                          [field.key]: parseFloat(e.target.value) || 0
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveEmployeeTarget}
                    className="flex items-center px-6 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save Employee Targets
            disabled={divisionLoading || !selectedDivision}
                  </button>
            type="button"
                </div>
            {divisionLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Division Targets
              </>
            )}
          </div>
        )}
      </div>

      {/* Target Summary Blocks */}
      {activeTab === 'division' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Revenue Target</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {divisionTargetForm.revenue ? `$${(divisionTargetForm.revenue / 1000).toFixed(0)}K` : '$0'}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Productivity Target</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{divisionTargetForm.productivityRate || 0}%</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">New Clients Target</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{divisionTargetForm.newClients || 0}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Profit Margin Target</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{divisionTargetForm.profitMargin || 0}%</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employee' && selectedEmployee && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Productivity Target</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{employeeTargetForm.productivityRate || 0}%</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Average Ticket Target</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">${employeeTargetForm.averageTicket || 0}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Attendance Target</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{employeeTargetForm.attendanceRate || 0}%</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Happiness Target</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{employeeTargetForm.happinessScore || 0}/10</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalSetting;