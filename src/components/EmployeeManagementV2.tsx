import React, { useState, useMemo } from 'react';
import { Employee, EmployeeTarget, EmployeeKPIData } from '../types/employee';
import { Division, User } from '../types/division';
import { HormoneUnit } from '../types/hormoneUnit';
import { PayrollEntry } from '../types/payroll';
import { getScoreLevel, getScoreColor, getScorePercentage, formatCurrency } from '../utils/scoring';
import { 
  Users, Target, TrendingUp, Edit, Save, X, Eye, Plus, UserPlus, 
  Calendar, MapPin, Activity, Download, FileText, BarChart3, Clock, 
  Trash2, AlertCircle, DollarSign, User as UserIcon, Building2,
  Phone, Shield, Award, Star, Settings, Copy, Archive
} from 'lucide-react';
import AdvancedEmployeeProfile from './AdvancedEmployeeProfile';
import EditHormoneUnitModal from './EditHormoneUnitModal';

interface EmployeeManagementV2Props {
  employees: Employee[];
  divisions: Division[];
  currentUser: User;
  payrollData?: PayrollEntry[];
  employeeTargets: EmployeeTarget[];
  employeeKPIData: EmployeeKPIData[];
  hormoneUnits: HormoneUnit[];
  getEmployeeScheduledHours: (employeeId: string, month?: string, year?: number) => number;
  onUpdateTarget: (target: EmployeeTarget) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onAddEmployee: (employee: Employee) => void;
  onRemoveEmployee: (employeeId: string) => void;
  onUpdateHormoneUnit: (unit: HormoneUnit) => void;
  onAddHormoneUnit: (unit: HormoneUnit) => void;
  onUpdateScheduledHours: (employeeId: string, hours: number) => void;
}

const EmployeeManagementV2: React.FC<EmployeeManagementV2Props> = ({
  employees,
  divisions,
  currentUser,
  payrollData = [],
  employeeTargets,
  employeeKPIData,
  hormoneUnits,
  getEmployeeScheduledHours,
  onUpdateTarget,
  onUpdateEmployee,
  onAddEmployee,
  onRemoveEmployee,
  onUpdateHormoneUnit,
  onAddHormoneUnit,
  onUpdateScheduledHours,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'team-directory' | 'hormone-units' | 'performance-analytics' | 'bulk-operations'>('team-directory');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Employee management states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAdvancedProfile, setShowAdvancedProfile] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [showHormoneUnitForm, setShowHormoneUnitForm] = useState<boolean>(false);

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees.filter(emp => emp.isActive);
    
    // Filter by division
    if (selectedDivision !== 'all') {
      filtered = filtered.filter(emp => emp.divisionId === selectedDivision);
    }
    
    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(emp => 
        emp.locations?.includes(selectedLocation) || 
        emp.primaryLocation === selectedLocation
      );
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort employees
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'division':
          const divA = divisions.find(d => d.id === a.divisionId)?.name || '';
          const divB = divisions.find(d => d.id === b.divisionId)?.name || '';
          return divA.localeCompare(divB);
        case 'hire-date':
          return b.hireDate.getTime() - a.hireDate.getTime();
        case 'location':
          return (a.primaryLocation || '').localeCompare(b.primaryLocation || '');
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [employees, selectedDivision, selectedLocation, searchTerm, sortBy, divisions]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const activeEmployees = filteredEmployees.length;
    const totalDivisions = new Set(filteredEmployees.map(emp => emp.divisionId)).size;
    
    // Calculate average performance from KPI data
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    const relevantKPIData = employeeKPIData.filter(data => 
      data.month === currentMonth && 
      data.year === currentYear &&
      filteredEmployees.some(emp => emp.id === data.employeeId)
    );
    
    const avgPerformance = relevantKPIData.length > 0 
      ? Math.round(relevantKPIData.reduce((sum, data) => sum + data.productivityRate, 0) / relevantKPIData.length)
      : 0;

    const totalRevenue = relevantKPIData.reduce((sum, data) => 
      sum + (data.averageTicket * data.newClients), 0
    );

    const avgHappiness = relevantKPIData.length > 0 
      ? Math.round(relevantKPIData.reduce((sum, data) => sum + data.happinessScore, 0) / relevantKPIData.length * 10) / 10
      : 0;

    return {
      activeEmployees,
      totalDivisions,
      avgPerformance,
      totalRevenue,
      avgHappiness,
    };
  }, [filteredEmployees, employeeKPIData]);

  // Get employee performance data
  const getEmployeePerformance = (employee: Employee) => {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    const kpiData = employeeKPIData.find(data => 
      data.employeeId === employee.id && 
      data.month === currentMonth && 
      data.year === currentYear
    );

    const payroll = payrollData.find(data => data.employeeId === employee.id);
    
    return {
      kpiData,
      payroll,
      revenue: kpiData ? kpiData.averageTicket * kpiData.newClients : 0,
      productivity: kpiData?.productivityRate || 0,
    };
  };

  // Handle employee actions
  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      ...employee,
      hourlyWage: employee.hourlyWage || 0,
      serviceCommissionPercent: employee.serviceCommissionPercent || 0,
      retailCommissionPercent: employee.retailCommissionPercent || 0,
    });
    setShowEditModal(true);
  };

  const handleSaveEmployee = () => {
    if (!employeeForm.id || !employeeForm.name || !employeeForm.divisionId) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedEmployee: Employee = {
      ...editingEmployee!,
      ...employeeForm,
      locations: employeeForm.locations || [],
      updatedAt: new Date(),
    } as Employee;

    onUpdateEmployee(updatedEmployee);
    setShowEditModal(false);
    setEditingEmployee(null);
    setEmployeeForm({});
  };

  const handleAddEmployee = () => {
    if (!employeeForm.name || !employeeForm.divisionId || !employeeForm.position) {
      alert('Please fill in all required fields');
      return;
    }

    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: employeeForm.name!,
      divisionId: employeeForm.divisionId!,
      position: employeeForm.position!,
      email: employeeForm.email || `${employeeForm.name!.toLowerCase().replace(' ', '.')}@truebalance.com`,
      hireDate: employeeForm.hireDate || new Date(),
      isActive: true,
      locations: employeeForm.locations || [],
      primaryLocation: employeeForm.primaryLocation || 'St. Albert',
      secondaryLocations: employeeForm.secondaryLocations || [],
      experienceLevel: employeeForm.experienceLevel || 'Entry Level',
      category: employeeForm.category || 'administrative',
      metricsManagerId: employeeForm.metricsManagerId,
      hourlyWage: employeeForm.hourlyWage || 0,
      serviceCommissionPercent: employeeForm.serviceCommissionPercent || 0,
      retailCommissionPercent: employeeForm.retailCommissionPercent || 0,
      phoneNumber: employeeForm.phoneNumber,
      notes: employeeForm.notes,
    };

    onAddEmployee(newEmployee);
    setShowAddModal(false);
    setEmployeeForm({});
  };

  const handleDuplicateEmployee = (employee: Employee) => {
    setEmployeeForm({
      ...employee,
      name: `${employee.name} (Copy)`,
      email: `${employee.name.toLowerCase().replace(' ', '.')}.copy@truebalance.com`,
      id: undefined,
    });
    setEditingEmployee(null);
    setShowAddModal(true);
  };

  const handleArchiveEmployee = (employee: Employee) => {
    if (window.confirm(`Are you sure you want to archive ${employee.name}? They will be marked as inactive but their data will be preserved.`)) {
      const updatedEmployee = { ...employee, isActive: false };
      onUpdateEmployee(updatedEmployee);
    }
  };

  const locations = ['St. Albert', 'Spruce Grove', 'Sherwood Park', 'Wellness'];
  const experienceLevels = ['Entry Level', 'Intermediate', 'Senior', 'Expert'];
  const categories = [
    'laser technician', 'nurse injector', 'hormone specialist', 'nurse practitioner',
    'administrative', 'marketing', 'sales', 'physician', 'guest care', 'management'
  ];

  // Get potential metric managers (management category employees)
  const potentialManagers = employees.filter(emp => 
    emp.isActive && (emp.category === 'management' || emp.position.toLowerCase().includes('manager'))
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Employee Set Up</h1>
              <p className="text-white/80 text-lg">Comprehensive team management and performance tracking</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add Employee
            </button>
            
            <button
              onClick={() => setShowHormoneUnitForm(true)}
              className="flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200"
            >
              <Building2 className="h-5 w-5 mr-2" />
              Add Hormone Unit
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Active Employees</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {summaryMetrics.activeEmployees}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Across {summaryMetrics.totalDivisions} divisions</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Avg Performance</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {summaryMetrics.avgPerformance}%
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Team performance metric</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Revenue</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summaryMetrics.totalRevenue)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Current month total</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Avg Happiness</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {summaryMetrics.avgHappiness}/10
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Out of 10 scale</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'team-directory', label: 'Team Directory', icon: Users },
              { id: 'hormone-units', label: 'Hormone Units', icon: Building2 },
              { id: 'performance-analytics', label: 'Performance Analytics', icon: TrendingUp },
              { id: 'bulk-operations', label: 'Bulk Operations', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-[#f4647d] text-[#f4647d]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Team Directory Tab */}
        {activeTab === 'team-directory' && (
          <div className="space-y-6">
            {/* Filters and Controls */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative">
                <UserIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                />
              </div>

              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              >
                <option value="all">All Divisions</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              >
                <option value="all">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              >
                <option value="name">Sort by Name</option>
                <option value="division">Sort by Division</option>
                <option value="hire-date">Sort by Hire Date</option>
                <option value="location">Sort by Location</option>
              </select>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                    viewMode === 'grid' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                    viewMode === 'table' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Table
                </button>
              </div>

              <div className="text-sm text-gray-600 flex items-center">
                <span className="font-medium">Showing {filteredEmployees.length} of {employees.filter(e => e.isActive).length} employees</span>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="flex items-center justify-end space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>0 excellent</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>0 good</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span>0 warning</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>{filteredEmployees.length} poor</span>
              </div>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>

            {/* Employee Grid/Table */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map(employee => {
                  const division = divisions.find(d => d.id === employee.divisionId);
                  const performance = getEmployeePerformance(employee);
                  
                  return (
                    <div 
                      key={employee.id}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-3"
                            style={{ backgroundColor: division?.color }}
                          >
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                            <p className="text-sm text-gray-600">{employee.position}</p>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Target className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-sm text-gray-600">Productivity</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">{performance.productivity}%</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-gray-600">Revenue</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">{formatCurrency(performance.revenue)}</div>
                        </div>
                      </div>

                      {/* Employee Details */}
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Division:</span>
                          <span 
                            className="font-medium px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: `${division?.color}20`, color: division?.color }}
                          >
                            {division?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Experience:</span>
                          <span className="font-medium">{employee.experienceLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hire Date:</span>
                          <span className="font-medium">{employee.hireDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Locations:</span>
                          <span className="font-medium">{employee.locations?.join(', ') || employee.primaryLocation}</span>
                        </div>
                        {employee.hourlyWage && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Hourly Wage:</span>
                            <span className="font-medium">${employee.hourlyWage}/hr</span>
                          </div>
                        )}
                        {employee.serviceCommissionPercent && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service Commission:</span>
                            <span className="font-medium">{employee.serviceCommissionPercent}%</span>
                          </div>
                        )}
                        {employee.retailCommissionPercent && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Retail Commission:</span>
                            <span className="font-medium">{employee.retailCommissionPercent}%</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="flex items-center justify-center px-3 py-2 bg-[#f4647d] text-white rounded-lg hover:bg-[#fd8585] transition-colors text-sm"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowAdvancedProfile(true);
                          }}
                          className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Profile
                        </button>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <div className="flex items-center">
                          <Activity className="h-3 w-3 mr-1 text-green-500" />
                          <span className="text-green-600">Active</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{getEmployeeScheduledHours(employee.id)}h scheduled</span>
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="flex items-center text-sm text-purple-800 mb-1">
                          <Star className="h-4 w-4 mr-2" />
                          <span className="font-medium">AI Insights</span>
                        </div>
                        <p className="text-xs text-purple-700">
                          No performance data available for AI analysis
                        </p>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={() => handleDuplicateEmployee(employee)}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleArchiveEmployee(employee)}
                          className="text-red-600 hover:text-red-800 text-xs flex items-center"
                        >
                          <Archive className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table View */
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Division
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Experience
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Wage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEmployees.map(employee => {
                        const division = divisions.find(d => d.id === employee.divisionId);
                        
                        return (
                          <tr key={employee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div 
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                                  style={{ backgroundColor: division?.color }}
                                >
                                  {employee.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                  <div className="text-sm text-gray-500">{employee.position}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{ backgroundColor: `${division?.color}20`, color: division?.color }}
                              >
                                {division?.name}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.primaryLocation || employee.locations?.[0] || 'Not set'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.experienceLevel}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.hourlyWage ? `$${employee.hourlyWage}/hr` : 'Not set'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.serviceCommissionPercent ? `${employee.serviceCommissionPercent}%` : 'Not set'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditEmployee(employee)}
                                  className="text-[#f4647d] hover:text-[#fd8585]"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setShowAdvancedProfile(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other tabs content would go here */}
        {activeTab === 'overview' && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Overview Dashboard</h3>
            <p className="text-gray-500">Team overview and analytics would be displayed here</p>
          </div>
        )}

        {activeTab === 'hormone-units' && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hormone Units</h3>
            <p className="text-gray-500">Hormone unit management would be displayed here</p>
          </div>
        )}

        {activeTab === 'performance-analytics' && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Analytics</h3>
            <p className="text-gray-500">Advanced performance analytics would be displayed here</p>
          </div>
        )}

        {activeTab === 'bulk-operations' && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bulk Operations</h3>
            <p className="text-gray-500">Bulk employee operations would be displayed here</p>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-3"
                  style={{ backgroundColor: divisions.find(d => d.id === editingEmployee.divisionId)?.color }}
                >
                  {editingEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Employee Profile</h3>
                  <p className="text-gray-600">{editingEmployee.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={employeeForm.name || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                      <input
                        type="text"
                        value={employeeForm.position || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="Enter position title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={employeeForm.email || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={employeeForm.phoneNumber || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                      <input
                        type="date"
                        value={employeeForm.hireDate ? employeeForm.hireDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, hireDate: new Date(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      />
                    </div>
                  </div>
                </div>

                {/* Assignment Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Assignment & Management</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Division *</label>
                      <select
                        value={employeeForm.divisionId || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, divisionId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        <option value="">Select Division</option>
                        {divisions.map(division => (
                          <option key={division.id} value={division.id}>
                            {division.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Metrics Manager</label>
                      <select
                        value={employeeForm.metricsManagerId || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, metricsManagerId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        <option value="">Select Metrics Manager</option>
                        {potentialManagers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name} - {manager.position}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Manager responsible for entering this employee's metrics</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Location</label>
                      <select
                        value={employeeForm.primaryLocation || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, primaryLocation: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        <option value="">Select Primary Location</option>
                        {locations.map(location => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Additional Locations</label>
                      <div className="grid grid-cols-2 gap-2">
                        {locations.map(location => (
                          <div key={location} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={employeeForm.locations?.includes(location) || false}
                              onChange={(e) => {
                                const currentLocations = employeeForm.locations || [];
                                const updatedLocations = e.target.checked
                                  ? [...currentLocations, location]
                                  : currentLocations.filter(loc => loc !== location);
                                setEmployeeForm(prev => ({ ...prev, locations: updatedLocations }));
                              }}
                              className="h-4 w-4 text-[#f4647d] focus:ring-[#f4647d] border-gray-300 rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">{location}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                      <select
                        value={employeeForm.experienceLevel || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        {experienceLevels.map(level => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={employeeForm.category || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compensation Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Compensation & Payroll</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Wage ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={employeeForm.hourlyWage || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, hourlyWage: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="25.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Commission (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={employeeForm.serviceCommissionPercent || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, serviceCommissionPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="5.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Retail Commission (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={employeeForm.retailCommissionPercent || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, retailCommissionPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="8.0"
                      />
                    </div>

                    {/* Compensation Preview */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-blue-900 mb-2">Compensation Preview</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Base (160h/month):</span>
                          <span className="font-medium">{formatCurrency((employeeForm.hourlyWage || 0) * 160)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Est. Service Commission:</span>
                          <span className="font-medium">{formatCurrency(5000 * ((employeeForm.serviceCommissionPercent || 0) / 100))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Est. Retail Commission:</span>
                          <span className="font-medium">{formatCurrency(1500 * ((employeeForm.retailCommissionPercent || 0) / 100))}</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-300 pt-2">
                          <span className="text-blue-900 font-semibold">Est. Total Monthly:</span>
                          <span className="font-bold">
                            {formatCurrency(
                              (employeeForm.hourlyWage || 0) * 160 + 
                              5000 * ((employeeForm.serviceCommissionPercent || 0) / 100) + 
                              1500 * ((employeeForm.retailCommissionPercent || 0) / 100)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        value={employeeForm.notes || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        rows={3}
                        placeholder="Additional notes about the employee..."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={employeeForm.isActive !== false}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 text-[#f4647d] focus:ring-[#f4647d] border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Active Employee</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmployee}
                className="px-6 py-3 bg-[#f4647d] text-white rounded-lg hover:bg-[#fd8585] flex items-center transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add New Employee</h3>
                <p className="text-gray-600">Create a new employee profile</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={employeeForm.name || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                      <input
                        type="text"
                        value={employeeForm.position || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="Enter position title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Division *</label>
                      <select
                        value={employeeForm.divisionId || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, divisionId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        <option value="">Select Division</option>
                        {divisions.map(division => (
                          <option key={division.id} value={division.id}>
                            {division.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Location</label>
                      <select
                        value={employeeForm.primaryLocation || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, primaryLocation: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        <option value="">Select Primary Location</option>
                        {locations.map(location => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                      <select
                        value={employeeForm.experienceLevel || 'Entry Level'}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        {experienceLevels.map(level => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={employeeForm.category || 'administrative'}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compensation and Management */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Compensation</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Wage ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={employeeForm.hourlyWage || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, hourlyWage: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="25.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Commission (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={employeeForm.serviceCommissionPercent || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, serviceCommissionPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="5.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Retail Commission (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={employeeForm.retailCommissionPercent || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, retailCommissionPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="8.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Metrics Manager</label>
                      <select
                        value={employeeForm.metricsManagerId || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, metricsManagerId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      >
                        <option value="">Select Metrics Manager</option>
                        {potentialManagers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name} - {manager.position}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Manager responsible for entering this employee's metrics</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={employeeForm.email || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="employee@truebalance.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={employeeForm.phoneNumber || ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                      <input
                        type="date"
                        value={employeeForm.hireDate ? employeeForm.hireDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setEmployeeForm(prev => ({ ...prev, hireDate: new Date(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={!employeeForm.name || !employeeForm.divisionId || !employeeForm.position}
                className="px-6 py-3 bg-[#f4647d] text-white rounded-lg hover:bg-[#fd8585] disabled:bg-gray-400 flex items-center transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hormone Unit Form Modal */}
      {showHormoneUnitForm && (
        <EditHormoneUnitModal
          isOpen={showHormoneUnitForm}
          unit={null}
          employees={employees}
          onClose={() => setShowHormoneUnitForm(false)}
          onSave={(unit) => {
            onAddHormoneUnit(unit);
            setShowHormoneUnitForm(false);
          }}
        />
      )}

      {/* Advanced Employee Profile Modal */}
      {showAdvancedProfile && selectedEmployee && (
        <AdvancedEmployeeProfile
          employee={selectedEmployee}
          division={divisions.find(d => d.id === selectedEmployee.divisionId)!}
          currentUser={currentUser}
          employeeKPIData={employeeKPIData}
          payrollData={payrollData}
          employeeTargets={employeeTargets}
          getEmployeeScheduledHours={getEmployeeScheduledHours}
          onClose={() => {
            setShowAdvancedProfile(false);
            setSelectedEmployee(null);
          }}
          onUpdateEmployee={onUpdateEmployee}
          onUpdateTarget={onUpdateTarget}
        />
      )}
    </div>
  );
};

export default EmployeeManagementV2;