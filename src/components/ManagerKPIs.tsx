/*
 * LOCKED PAGE - NO LAYOUT, INFORMATION, OR DESIGN CHANGES ALLOWED
 * This page is protected from modifications to maintain consistency
 * Manager KPIs layout, information display, and design are finalized
 */

import React, { useState, useMemo } from 'react';
import { Employee, EmployeeKPIData, EmployeeTarget } from '../types/employee';
import { Division, KPIData, User, KPITarget } from '../types/division';
import { getScoreLevel, getScoreColor, getScorePercentage, formatCurrency } from '../utils/scoring';
import { BarChart3, Users, Target, TrendingUp, Calendar, DollarSign, Settings, Save, X, Filter, User as UserIcon, Building2, ChevronDown, ChevronRight, Clock } from 'lucide-react';

interface DailyEntry {
  employeeId: string;
  date: string;
  status: 'active' | 'away' | 'sick' | 'not-booked';
  hoursWorked: number;
  hoursBooked: number;
  serviceRevenue: number;
  retailSales: number;
  productivityPercentage: number;
  newClients: number;
  consults: number;
  consultConverted: number;
  consultConversionPercentage: number;
  totalClients: number;
  prebooks: number;
  prebookPercentage: number;
  isSubmitted: boolean;
}

interface DailySubmission {
  divisionId: string;
  date: string;
  isComplete: boolean;
  entries: DailyEntry[];
}

interface ManagerKPIsProps {
  currentUser: User;
  employees: Employee[];
  divisions: Division[];
  kpiData: KPIData[];
  employeeKPIData: EmployeeKPIData[];
  dailySubmissions: DailySubmission[];
  targets: KPITarget[];
  employeeTargets: EmployeeTarget[];
  scheduledHours: Record<string, number>;
  getEmployeeScheduledHours: (employeeId: string, month?: string, year?: number) => number;
  onUpdateDivisionTarget: (target: KPITarget) => void;
  onUpdateEmployeeTarget: (target: EmployeeTarget) => void;
}

// Hierarchical division structure
const divisionHierarchy = {
  wellness: {
    name: 'Wellness',
    subdivisions: ['hormone', 'iv-therapy', 'nutrition', 'feminine']
  },
  spa: {
    name: 'Spa',
    subdivisions: ['laser', 'injectables']
  },
  'patient-acquisition': {
    name: 'Patient Acquisition',
    subdivisions: ['guest-care', 'new-patient']
  }
};

const ManagerKPIs: React.FC<ManagerKPIsProps> = ({
  currentUser,
  employees,
  divisions,
  kpiData,
  employeeKPIData,
  dailySubmissions,
  targets,
  employeeTargets,
  scheduledHours,
  getEmployeeScheduledHours,
  onUpdateDivisionTarget,
  onUpdateEmployeeTarget,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('productivity');
  const [showEmployeeGoals, setShowEmployeeGoals] = useState<boolean>(false);
  const [showDivisionTargets, setShowDivisionTargets] = useState<boolean>(false);
  const [selectedTargetEmployee, setSelectedTargetEmployee] = useState<string>('');
  const [selectedTargetDivision, setSelectedTargetDivision] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [employeeTargetForm, setEmployeeTargetForm] = useState<Partial<EmployeeTarget>>({});
  const [divisionTargetForm, setDivisionTargetForm] = useState<Partial<KPITarget>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    wellness: true,
    spa: true,
    'patient-acquisition': true
  });

  // Filter employees based on division
  const filteredEmployees = useMemo(() => {
    if (selectedDivision === 'all') {
      return employees.filter(emp => emp.isActive);
    }
    return employees.filter(emp => emp.divisionId === selectedDivision && emp.isActive);
  }, [employees, selectedDivision]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeStaff = filteredEmployees.length;
    const totalSubmissions = dailySubmissions.length;
    
    // Calculate average productivity from employee KPI data
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    const relevantKPIData = employeeKPIData.filter(data => 
      data.month === currentMonth && 
      data.year === currentYear &&
      (selectedDivision === 'all' || 
       filteredEmployees.some(emp => emp.id === data.employeeId))
    );
    
    const avgProductivity = relevantKPIData.length > 0 
      ? Math.round(relevantKPIData.reduce((sum, data) => sum + data.productivityRate, 0) / relevantKPIData.length)
      : 0;

    // Calculate total sales from KPI data
    const currentMonthKPIData = kpiData.filter(data => 
      data.month === currentMonth && 
      data.year === currentYear &&
      (selectedDivision === 'all' || data.divisionId === selectedDivision)
    );

    const totalSales = currentMonthKPIData.reduce((sum, data) => 
      sum + (data.averageTicket * data.newClients), 0
    );

    const totalNewClients = currentMonthKPIData.reduce((sum, data) => 
      sum + data.newClients, 0
    );

    return {
      activeStaff,
      totalSubmissions,
      avgProductivity,
      totalSales,
      totalNewClients,
    };
  }, [filteredEmployees, dailySubmissions, employeeKPIData, kpiData, selectedDivision]);

  const availableMetrics = [
    { key: 'productivity', label: 'Productivity %' },
    { key: 'retail', label: 'Retail %' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'newClients', label: 'New Clients' },
    { key: 'happiness', label: 'Happiness Score' },
    { key: 'attendance', label: 'Attendance %' },
  ];

  // Toggle category expansion
  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Get division performance data
  const getDivisionPerformance = (divisionId: string) => {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    const divisionData = kpiData.find(data => 
      data.divisionId === divisionId && 
      data.month === currentMonth && 
      data.year === currentYear
    );

    const divisionEmployees = employees.filter(emp => emp.divisionId === divisionId && emp.isActive);
    
    return {
      data: divisionData,
      employeeCount: divisionEmployees.length,
      employees: divisionEmployees
    };
  };

  // Handle employee goal setting
  const handleOpenEmployeeGoals = () => {
    if (filteredEmployees.length === 0) {
      alert('No employees available for goal setting');
      return;
    }
    setShowEmployeeGoals(true);
  };

  const handleSaveEmployeeTarget = () => {
    if (!selectedTargetEmployee) {
      alert('Please select an employee');
      return;
    }
    
    if (!employeeTargetForm.employeeId) {
      alert('Employee target form is incomplete');
      return;
    }
    
    onUpdateEmployeeTarget(employeeTargetForm as EmployeeTarget);
    setShowEmployeeGoals(false);
    setEmployeeTargetForm({});
    setSelectedTargetEmployee('');
  };

  // Handle division target setting
  const handleOpenDivisionTargets = (divisionId?: string) => {
    setSelectedTargetDivision(divisionId || '');
    setShowDivisionTargets(true);
    
    if (divisionId) {
      const existingTarget = targets.find(t => t.divisionId === divisionId);
      if (existingTarget) {
        setDivisionTargetForm(existingTarget);
      } else {
        setDivisionTargetForm({
          divisionId,
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
        });
      }
    }
  };

  const handleSaveDivisionTarget = () => {
    if (!selectedTargetDivision) {
      alert('Please select a division');
      return;
    }
    
    if (!divisionTargetForm.divisionId) {
      alert('Division target form is incomplete');
      return;
    }
    
    onUpdateDivisionTarget(divisionTargetForm as KPITarget);
    setShowDivisionTargets(false);
    setDivisionTargetForm({});
    setSelectedTargetDivision('');
  };

  // Initialize employee target form when employee is selected
  React.useEffect(() => {
    if (selectedTargetEmployee) {
      const employee = employees.find(emp => emp.id === selectedTargetEmployee);
      const existingTarget = employeeTargets.find(target => 
        target.employeeId === selectedTargetEmployee &&
        target.month === selectedMonth &&
        target.year === selectedYear
      );
      
      if (existingTarget) {
        setEmployeeTargetForm(existingTarget);
      } else if (employee) {
        setEmployeeTargetForm({
          employeeId: selectedTargetEmployee,
          divisionId: employee.divisionId,
          month: selectedMonth,
          year: selectedYear,
          scheduledHours: 40,
          productivityRate: 85,
          serviceSales: 5000,
          retailSales: 1500,
          serviceSalesPerHour: 150,
          prebookRate: 75,
          firstTimeRetentionRate: 80,
          repeatRetentionRate: 90,
          retailPercentage: 25,
          newClients: 30,
          averageTicket: 250,
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
  }, [selectedTargetEmployee, selectedMonth, selectedYear, employees, employeeTargets]);

  return (
    <div className="space-y-6">
      {/* Header matching dashboard style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-[#f4647d]" />
          <h1 className="text-2xl font-bold text-gray-900">Manager KPIs</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] bg-white"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>

          {(currentUser.role === 'admin' || currentUser.role === 'executive') && (
            <button
              onClick={() => handleOpenDivisionTargets()}
             className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-lg hover:bg-[#fd8585] focus:outline-none focus:ring-2 focus:ring-[#f4647d] transition-all duration-200"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Set Division Targets
            </button>
          )}
          
          <button
            onClick={handleOpenEmployeeGoals}
            className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-lg hover:bg-[#fd8585] focus:outline-none focus:ring-2 focus:ring-[#f4647d] transition-all duration-200"
          >
            <Settings className="h-4 w-4 mr-2" />
            Set Employee Goals
          </button>
        </div>
      </div>

      {/* Filter Controls matching dashboard style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Division</label>
          </div>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent text-gray-900 shadow-sm"
          >
            <option value="all">All Divisions</option>
            {divisions.map(division => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-3">
            <UserIcon className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Employee</label>
          </div>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent text-gray-900 shadow-sm"
          >
            <option value="all">All Employees</option>
            {filteredEmployees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Target className="h-4 w-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Metric</label>
          </div>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent text-gray-900 shadow-sm"
          >
            {availableMetrics.map(metric => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Cards matching dashboard style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Sales Card */}
        <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-lg p-6 shadow-sm text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white/80 mb-2">Total Sales</h3>
              <div className="text-3xl font-bold text-white mb-1">
                {formatCurrency(metrics.totalSales)}
              </div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/70">Target: {formatCurrency(150000)}</span>
            <span className="text-sm font-semibold text-white">
              {Math.round((metrics.totalSales / 150000) * 100)}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-white transition-all duration-500"
                style={{
                  width: `${Math.min((metrics.totalSales / 150000) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Productivity Card */}
        <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-lg p-6 shadow-sm text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white/80 mb-2">Avg Productivity</h3>
              <div className="text-3xl font-bold text-white mb-1">
                {metrics.avgProductivity}%
              </div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/70">Target: 85%</span>
            <span className="text-sm font-semibold text-white">
              {Math.round((metrics.avgProductivity / 85) * 100)}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-white transition-all duration-500"
                style={{
                  width: `${Math.min((metrics.avgProductivity / 85) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* New Clients Card */}
        <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-lg p-6 shadow-sm text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white/80 mb-2">New Clients</h3>
              <div className="text-3xl font-bold text-white mb-1">
                {metrics.totalNewClients}
              </div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/70">Target: 300</span>
            <span className="text-sm font-semibold text-white">
              {Math.round((metrics.totalNewClients / 300) * 100)}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-white transition-all duration-500"
                style={{
                  width: `${Math.min((metrics.totalNewClients / 300) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Division Performance Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Division Performance Overview</h2>
        
        <div className="space-y-4">
          {Object.entries(divisionHierarchy).map(([categoryKey, category]) => (
            <div key={categoryKey} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Category Header */}
              <div 
                className="p-4 cursor-pointer transition-colors duration-200 hover:bg-gray-50 bg-gray-50"
                onClick={() => toggleCategory(categoryKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">
                        {category.subdivisions.length} divisions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {(currentUser.role === 'admin' || currentUser.role === 'executive') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDivisionTargets();
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Set Targets
                      </button>
                    )}
                    {expandedCategories[categoryKey] ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Subdivisions */}
              {expandedCategories[categoryKey] && (
                <div className="border-t border-gray-200">
                  {category.subdivisions.map(subdivisionId => {
                    const division = divisions.find(d => d.id === subdivisionId);
                    if (!division) return null;

                    const performance = getDivisionPerformance(division.id);
                    const hasData = !!performance.data;
                    
                    return (
                      <div key={division.id} className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h4 className="font-medium text-gray-900">{division.name}</h4>
                              <p className="text-sm text-gray-600">
                                {performance.employeeCount} team members
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            {hasData && (
                              <>
                                <div className="text-center">
                                  <p className="text-xs text-gray-600">Total Sales</p>
                                  <p className="font-semibold text-gray-900">
                                    {formatCurrency(performance.data!.averageTicket * performance.data!.newClients)}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-600">Productivity</p>
                                  <p className="font-semibold text-gray-900">
                                    {performance.data!.productivityRate}%
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-600">New Clients</p>
                                  <p className="font-semibold text-gray-900">
                                    {performance.data!.newClients}
                                  </p>
                                </div>
                              </>
                            )}
                            
                            {(currentUser.role === 'admin' || currentUser.role === 'executive') && (
                              <button
                                onClick={() => handleOpenDivisionTargets(division.id)}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                              >
                                Set Targets
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trends Section matching dashboard style */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {availableMetrics.find(m => m.key === selectedMetric)?.label} Trends - {selectedEmployee === 'all' ? 'All Employees' : employees.find(e => e.id === selectedEmployee)?.name}
        </h2>
        
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            Detailed performance trends and analytics for {selectedEmployee === 'all' ? 'all team members' : 'the selected employee'} would be displayed here.
          </p>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Team Performance</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productivity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Clients
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEmployees.map(employee => {
                const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
                const currentYear = new Date().getFullYear();
                
                const empData = employeeKPIData.find(data => 
                  data.employeeId === employee.id && 
                  data.month === currentMonth && 
                  data.year === currentYear
                );

                const division = divisions.find(d => d.id === employee.divisionId);

                if (!empData) {
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {division?.name}
                        </span>
                      </td>
                      <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        No data available
                      </td>
                    </tr>
                  );
                }

                const totalSales = empData.averageTicket * empData.newClients;
                const overallScore = Math.round((
                  empData.productivityRate + 
                  empData.retailPercentage + 
                  empData.happinessScore * 10 + 
                  empData.attendanceRate
                ) / 4);
                
                const empScoreLevel = getScoreLevel(overallScore, 100);
                const empScoreColor = getScoreColor(empScoreLevel);

                return (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: division?.color || '#f4647d' }}
                          >
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${division?.color}20`, 
                          color: division?.color 
                        }}
                      >
                        {division?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(totalSales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{empData.productivityRate}%</span>
                        <div className={`w-2 h-2 rounded-full ${
                          empData.productivityRate >= 90 ? 'bg-green-500' :
                          empData.productivityRate >= 80 ? 'bg-yellow-500' :
                          empData.productivityRate >= 70 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {empData.newClients}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getEmployeeScheduledHours(employee.id, currentMonth, currentYear)}h scheduled
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold" style={{ color: empScoreColor }}>
                          {overallScore}%
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          empScoreLevel === 'excellent' ? 'bg-green-100 text-green-800' :
                          empScoreLevel === 'good' ? 'bg-yellow-100 text-yellow-800' :
                          empScoreLevel === 'warning' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {empScoreLevel.toUpperCase()}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Goal Setting Modal */}
      {showEmployeeGoals && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-8 border w-11/12 max-w-4xl shadow-xl rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Employee Goal Setting</h3>
                <p className="text-gray-600 mt-1">
                  Set individual targets for team members - {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setShowEmployeeGoals(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                  <select
                    value={selectedTargetEmployee}
                    onChange={(e) => setSelectedTargetEmployee(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {filteredEmployees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>

              {selectedTargetEmployee && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { key: 'productivityRate', label: 'Productivity Rate (%)', type: 'percentage' },
                      { key: 'prebookRate', label: 'Prebook Rate (%)', type: 'percentage' },
                      { key: 'retailPercentage', label: 'Retail Percentage (%)', type: 'percentage' },
                      { key: 'newClients', label: 'New Clients Target', type: 'number' },
                      { key: 'averageTicket', label: 'Average Ticket ($)', type: 'currency' },
                      { key: 'hoursSold', label: 'Hours Sold Target', type: 'number' },
                      { key: 'happinessScore', label: 'Happiness Score (1-10)', type: 'score' },
                      { key: 'attendanceRate', label: 'Attendance Rate (%)', type: 'percentage' },
                      { key: 'customerSatisfactionScore', label: 'Customer Satisfaction (1-10)', type: 'score' },
                    ].map(field => (
                      <div key={field.key} className="bg-gray-50 rounded-xl p-4">
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
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      onClick={() => setShowEmployeeGoals(false)}
                      className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEmployeeTarget}
                      className="px-6 py-3 bg-[#f4647d] text-white rounded-xl hover:bg-[#fd8585] flex items-center transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Employee Targets
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Division Target Setting Modal */}
      {showDivisionTargets && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-8 border w-11/12 max-w-4xl shadow-xl rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Division Target Setting</h3>
                <p className="text-gray-600 mt-1">
                  Set performance targets for divisions to track overall performance.
                </p>
              </div>
              <button
                onClick={() => setShowDivisionTargets(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                <select
                  value={selectedTargetDivision}
                  onChange={(e) => setSelectedTargetDivision(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent"
                >
                  <option value="">Select Division</option>
                  {divisions.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTargetDivision && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { key: 'productivityRate', label: 'Productivity Rate (%)', type: 'percentage' },
                      { key: 'prebookRate', label: 'Prebook Rate (%)', type: 'percentage' },
                      { key: 'retailPercentage', label: 'Retail Percentage (%)', type: 'percentage' },
                      { key: 'newClients', label: 'New Clients Target', type: 'number' },
                      { key: 'averageTicket', label: 'Average Ticket ($)', type: 'currency' },
                      { key: 'hoursSold', label: 'Hours Sold Target', type: 'number' },
                      { key: 'happinessScore', label: 'Happiness Score (1-10)', type: 'score' },
                      { key: 'serviceSalesPerHour', label: 'Sales per Hour ($)', type: 'currency' },
                      { key: 'netCashPercentage', label: 'Net Cash Percentage (%)', type: 'percentage' },
                    ].map(field => (
                      <div key={field.key} className="bg-gray-50 rounded-xl p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                        </label>
                        <input
                          type="number"
                          step={field.type === 'percentage' || field.type === 'score' ? '0.1' : '1'}
                          min="0"
                          max={field.type === 'score' ? '10' : field.type === 'percentage' ? '100' : undefined}
                          value={divisionTargetForm[field.key as keyof KPITarget] || ''}
                          onChange={(e) => setDivisionTargetForm(prev => ({
                            ...prev,
                            [field.key]: parseFloat(e.target.value) || 0
                          }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      onClick={() => setShowDivisionTargets(false)}
                      className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDivisionTarget}
                      className="px-6 py-3 bg-[#f4647d] text-white rounded-xl hover:bg-[#fd8585] flex items-center transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Division Targets
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerKPIs;