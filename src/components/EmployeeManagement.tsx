import React, { useState } from 'react';
import { Employee, EmployeeTarget, EmployeeKPIData } from '../types/employee';
import { Division } from '../types/division';
import { HormoneUnit } from '../types/hormoneUnit';
import { getScoreLevel, getScoreColor, getScorePercentage, formatCurrency } from '../utils/scoring';
import { Users, Target, TrendingUp, Edit, Save, X, Eye, Plus, UserPlus, Calendar, MapPin, Activity, Download, FileText, BarChart3, Clock, Trash2, AlertCircle } from 'lucide-react';

interface ScheduleEntry {
  employeeId: string;
  month: string;
  year: number;
  scheduledHours: number;
  actualHours: number;
  bookedHours: number;
  serviceSalesPerHour: number;
  productivityGoal: number;
  estimatedRevenue: number;
  actualBookedHours?: number;
  weeklySchedule: {
    monday: { start: string; end: string; hours: number };
    tuesday: { start: string; end: string; hours: number };
    wednesday: { start: string; end: string; hours: number };
    thursday: { start: string; end: string; hours: number };
    friday: { start: string; end: string; hours: number };
    saturday: { start: string; end: string; hours: number };
    sunday: { start: string; end: string; hours: number };
  };
}

interface EmployeeManagementProps {
  employees: Employee[];
  divisions: Division[];
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

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  divisions,
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
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'hormone-units'>('employees');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<boolean>(false);
  const [addingEmployee, setAddingEmployee] = useState<boolean>(false);
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [scheduleForm, setScheduleForm] = useState<Partial<ScheduleEntry>>({});

  // Mock schedule data for employee profiles
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([
    {
      employeeId: 'emp-001',
      month: '01',
      year: 2025,
      scheduledHours: 160,
      actualHours: 155,
      bookedHours: 140,
      serviceSalesPerHour: 220,
      productivityGoal: 90,
      estimatedRevenue: 30800,
      actualBookedHours: 140,
      weeklySchedule: {
        monday: { start: '09:00', end: '17:00', hours: 8 },
        tuesday: { start: '09:00', end: '17:00', hours: 8 },
        wednesday: { start: '09:00', end: '17:00', hours: 8 },
        thursday: { start: '09:00', end: '17:00', hours: 8 },
        friday: { start: '09:00', end: '17:00', hours: 8 },
        saturday: { start: '10:00', end: '16:00', hours: 6 },
        sunday: { start: '', end: '', hours: 0 },
      }
    }
  ]);

  const filteredEmployees = selectedDivision === 'all' 
    ? employees.filter(emp => emp.isActive)
    : employees.filter(emp => emp.divisionId === selectedDivision && emp.isActive);

  const getEmployeeSchedule = (employeeId: string) => {
    return scheduleData.find(schedule => 
      schedule.employeeId === employeeId && 
      schedule.month === selectedMonth && 
      schedule.year === selectedYear
    );
  };

  const getEmployeeScheduleHistory = (employeeId: string) => {
    return scheduleData.filter(schedule => schedule.employeeId === employeeId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return parseInt(b.month) - parseInt(a.month);
      });
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm(employee);
    
    // Initialize schedule form
    const existingSchedule = getEmployeeSchedule(employee.id);
    if (existingSchedule) {
      setScheduleForm(existingSchedule);
    } else {
      setScheduleForm({
        employeeId: employee.id,
        month: selectedMonth,
        year: selectedYear,
        scheduledHours: 160,
        actualHours: 0,
        bookedHours: 0,
        serviceSalesPerHour: 150,
        productivityGoal: 85,
        estimatedRevenue: 0,
        weeklySchedule: {
          monday: { start: '09:00', end: '17:00', hours: 8 },
          tuesday: { start: '09:00', end: '17:00', hours: 8 },
          wednesday: { start: '09:00', end: '17:00', hours: 8 },
          thursday: { start: '09:00', end: '17:00', hours: 8 },
          friday: { start: '09:00', end: '17:00', hours: 8 },
          saturday: { start: '10:00', end: '16:00', hours: 6 },
          sunday: { start: '', end: '', hours: 0 },
        }
      });
    }
  };

  const handleSaveEmployee = () => {
    if (employeeForm.id) {
      onUpdateEmployee(employeeForm as Employee);
      setSelectedEmployee(employeeForm as Employee);
      setEditingEmployee(false);
    }
  };

  const handleSaveSchedule = () => {
    if (scheduleForm.employeeId) {
      const newSchedule = scheduleForm as ScheduleEntry;
      setScheduleData(prev => {
        const filtered = prev.filter(s => 
          !(s.employeeId === newSchedule.employeeId && 
            s.month === newSchedule.month && 
            s.year === newSchedule.year)
        );
        const updatedSchedules = [...filtered, newSchedule];
        
        // Update scheduled hours in main app state
        if (newSchedule.employeeId) {
          onUpdateScheduledHours(newSchedule.employeeId, newSchedule.scheduledHours);
        }
        
        return updatedSchedules;
      });
    }
  };

  const handleDeactivateEmployee = () => {
    if (!selectedEmployee) return;
    
    if (window.confirm(`Are you sure you want to deactivate ${selectedEmployee.name}? Their profile and history will be preserved.`)) {
      const updatedEmployee = { ...selectedEmployee, isActive: false };
      onUpdateEmployee(updatedEmployee);
      setSelectedEmployee(null);
    }
  };

  const handleAddEmployee = () => {
    if (!employeeForm.name) {
      console.error('Employee name is required');
      return;
    }
    
    if (!employeeForm.divisionId) {
      console.error('Division selection is required');
      return;
    }
    
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: employeeForm.name,
      divisionId: employeeForm.divisionId,
      position: employeeForm.position || 'Team Member',
      email: employeeForm.email || `${employeeForm.name.toLowerCase().replace(' ', '.')}@truebalance.com`,
      hireDate: employeeForm.hireDate || new Date(),
      isActive: true,
      locations: employeeForm.locations || [],
      experienceLevel: employeeForm.experienceLevel || 'Entry Level',
      category: employeeForm.category || 'administrative',
    };
    onAddEmployee(newEmployee);
    setAddingEmployee(false);
    setEmployeeForm({});
  };

  // Export functions
  const handleExportScheduleHistory = (format: 'csv' | 'pdf') => {
    if (!selectedEmployee) return;
    
    const history = getEmployeeScheduleHistory(selectedEmployee.id);
    const csvData = [
      ['Month', 'Year', 'Scheduled Hours', 'Actual Hours', 'Booked Hours', 'Actual Booked Hours', 'Productivity Goal', 'Actual Productivity %', 'Estimated Revenue'],
      ...history.map(schedule => [
        new Date(schedule.year, parseInt(schedule.month) - 1).toLocaleDateString('en-US', { month: 'long' }),
        schedule.year.toString(),
        schedule.scheduledHours.toString(),
        schedule.actualHours.toString(),
        schedule.bookedHours.toString(),
        schedule.actualBookedHours?.toString() || 'N/A',
        `${schedule.productivityGoal}%`,
        schedule.actualBookedHours ? `${Math.round((schedule.actualBookedHours / schedule.scheduledHours) * 100)}%` : 'N/A',
        formatCurrency(schedule.estimatedRevenue)
      ])
    ];
    
    if (format === 'csv') {
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEmployee.name.replace(' ', '_')}_schedule_history.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportPerformanceSummary = (format: 'csv' | 'pdf') => {
    if (!selectedEmployee) return;
    
    const currentSchedule = getEmployeeSchedule(selectedEmployee.id);
    if (!currentSchedule) return;
    
    const performanceData = [
      ['Metric', 'Value'],
      ['Employee Name', selectedEmployee.name],
      ['Position', selectedEmployee.position],
      ['Division', divisions.find(d => d.id === selectedEmployee.divisionId)?.name || 'Unknown'],
      ['Month', new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })],
      ['Scheduled Hours', currentSchedule.scheduledHours.toString()],
      ['Actual Booked Hours', currentSchedule.actualBookedHours?.toString() || 'N/A'],
      ['Calculated Productivity %', currentSchedule.actualBookedHours ? `${Math.round((currentSchedule.actualBookedHours / currentSchedule.scheduledHours) * 100)}%` : 'N/A'],
      ['Productivity Goal', `${currentSchedule.productivityGoal}%`],
      ['Service Sales per Hour', formatCurrency(currentSchedule.serviceSalesPerHour)],
      ['Estimated Revenue', formatCurrency(currentSchedule.estimatedRevenue)],
    ];
    
    if (format === 'csv') {
      const csvContent = performanceData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEmployee.name.replace(' ', '_')}_performance_summary.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const updateWeeklySchedule = (day: string, field: string, value: string | number) => {
    setScheduleForm(prev => {
      const newSchedule = {
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule!,
          [day]: {
            ...prev.weeklySchedule![day as keyof typeof prev.weeklySchedule],
            [field]: value
          }
        }
      };
      
      // Calculate hours for the day if start and end times are provided
      if (field === 'start' || field === 'end') {
        const daySchedule = newSchedule.weeklySchedule![day as keyof typeof newSchedule.weeklySchedule];
        if (daySchedule.start && daySchedule.end) {
          const startTime = new Date(`2000-01-01T${daySchedule.start}:00`);
          const endTime = new Date(`2000-01-01T${daySchedule.end}:00`);
          const diffMs = endTime.getTime() - startTime.getTime();
          const hours = Math.max(0, diffMs / (1000 * 60 * 60));
          daySchedule.hours = Math.round(hours * 2) / 2; // Round to nearest 0.5
        }
      }
      
      return newSchedule;
    });
  };

  const calculateWeeklyHours = () => {
    if (!scheduleForm.weeklySchedule) return 0;
    return Object.values(scheduleForm.weeklySchedule).reduce((total, day) => total + day.hours, 0);
  };

  const calculateMonthlyHours = () => {
    const weeklyHours = calculateWeeklyHours();
    return Math.round(weeklyHours * 4.33); // Average weeks per month
  };

  // Update scheduled hours when weekly schedule changes
  React.useEffect(() => {
    const monthlyHours = calculateMonthlyHours();
    setScheduleForm(prev => ({
      ...prev,
      scheduledHours: monthlyHours,
      estimatedRevenue: monthlyHours * (prev.serviceSalesPerHour || 150)
    }));
  }, [scheduleForm.weeklySchedule, scheduleForm.serviceSalesPerHour]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          </div>
          
          <div className="flex items-center space-x-4">
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

            <button
              onClick={() => setAddingEmployee(true)}
              className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'employees'
                  ? 'border-[#f4647d] text-[#f4647d]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => setActiveTab('hormone-units')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'hormone-units'
                  ? 'border-[#f4647d] text-[#f4647d]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Hormone Units
            </button>
          </nav>
        </div>

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map(employee => {
              const division = divisions.find(d => d.id === employee.divisionId);
              const schedule = getEmployeeSchedule(employee.id);
              const kpiData = employeeKPIData.find(data => 
                data.employeeId === employee.id && 
                data.month === selectedMonth && 
                data.year === selectedYear
              );

              return (
                <div 
                  key={employee.id}
                  onClick={() => handleEmployeeClick(employee)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 p-6"
                  style={{ borderLeftColor: division?.color }}
                >
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-3"
                      style={{ backgroundColor: division?.color }}
                    >
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.position}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {schedule && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Scheduled Hours:</span>
                          <span className="font-medium">{schedule.scheduledHours}h</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Est. Revenue:</span>
                          <span className="font-medium">{formatCurrency(schedule.estimatedRevenue)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Productivity Goal:</span>
                          <span className="font-medium">{schedule.productivityGoal}%</span>
                        </div>
                      </>
                    )}

                    {!schedule && (
                      <div className="text-center py-2">
                        <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                        <p className="text-xs text-amber-600">No schedule set</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{employee.locations?.join(', ') || 'No location set'}</span>
                      </div>
                      <div className="flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        <span className="text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hormone Units Tab */}
        {activeTab === 'hormone-units' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hormoneUnits.map(unit => (
              <div key={unit.unitId} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{unit.unitName}</h3>
                  <MapPin className="h-5 w-5 text-gray-500" />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-sm text-gray-600">{unit.location}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Nurse Practitioners</p>
                    <p className="text-sm text-gray-600">
                      {unit.npIds.map(id => employees.find(emp => emp.id === id)?.name).filter(Boolean).join(', ') || 'None assigned'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Specialists</p>
                    <p className="text-sm text-gray-600">
                      {unit.specialistIds.map(id => employees.find(emp => emp.id === id)?.name).filter(Boolean).join(', ') || 'None assigned'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Support Staff</p>
                    <p className="text-sm text-gray-600">
                      {[unit.patientCareSpecialistId, unit.adminTeamMemberId, unit.guestCareId]
                        .filter(Boolean)
                        .map(id => employees.find(emp => emp.id === id)?.name)
                        .filter(Boolean)
                        .join(', ') || 'None assigned'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4"
                  style={{ backgroundColor: divisions.find(d => d.id === selectedEmployee.divisionId)?.color }}
                >
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</h2>
                  <p className="text-lg text-gray-600">{selectedEmployee.position}</p>
                  <p className="text-sm text-gray-500">
                    {divisions.find(d => d.id === selectedEmployee.divisionId)?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingEmployee(!editingEmployee)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editingEmployee ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Employee Details */}
              <div className="space-y-6">
                {/* Employee Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
                  
                  {editingEmployee ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={employeeForm.name || ''}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        <input
                          type="text"
                          value={employeeForm.position || ''}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                        <select
                          value={employeeForm.divisionId || ''}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, divisionId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        >
                          {divisions.map(division => (
                            <option key={division.id} value={division.id}>
                              {division.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                        <select
                          value={employeeForm.experienceLevel || ''}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        >
                          <option value="Entry Level">Entry Level</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Senior">Senior</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                        <input
                          type="date"
                          value={employeeForm.hireDate ? employeeForm.hireDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, hireDate: new Date(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Locations</label>
                        <input
                          type="text"
                          value={employeeForm.locations?.join(', ') || ''}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, locations: e.target.value.split(', ').filter(l => l.trim()) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                          placeholder="Enter locations separated by commas"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={employeeForm.isActive || false}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="h-4 w-4 text-[#f4647d] focus:ring-[#f4647d] border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Active Employee</label>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={handleSaveEmployee}
                          className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </button>
                        
                        <button
                          onClick={handleDeactivateEmployee}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deactivate Employee
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience Level:</span>
                        <span className="font-medium">{selectedEmployee.experienceLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hire Date:</span>
                        <span className="font-medium">{selectedEmployee.hireDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Locations:</span>
                        <span className="font-medium">{selectedEmployee.locations?.join(', ') || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${selectedEmployee.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Schedule History */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Schedule History</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleExportScheduleHistory('csv')}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export CSV
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getEmployeeScheduleHistory(selectedEmployee.id).map((schedule, index) => (
                      <div key={index} className="bg-white rounded p-3 border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">
                            {new Date(schedule.year, parseInt(schedule.month) - 1).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                          <span className="text-sm text-gray-600">{schedule.scheduledHours}h scheduled</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Actual Booked:</span>
                            <span className="ml-1 font-medium">{schedule.actualBookedHours || 'N/A'}h</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Productivity:</span>
                            <span className="ml-1 font-medium">
                              {schedule.actualBookedHours 
                                ? `${Math.round((schedule.actualBookedHours / schedule.scheduledHours) * 100)}%`
                                : `${schedule.productivityGoal}% (goal)`
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Revenue:</span>
                            <span className="ml-1 font-medium">{formatCurrency(schedule.estimatedRevenue)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {getEmployeeScheduleHistory(selectedEmployee.id).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No schedule history available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Schedule & Performance */}
              <div className="space-y-6">
                {/* Monthly Schedule Metrics */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Schedule & Performance</h3>
                    <select
                      value={`${selectedYear}-${selectedMonth}`}
                      onChange={(e) => {
                        const [year, month] = e.target.value.split('-');
                        setSelectedYear(parseInt(year));
                        setSelectedMonth(month);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const year = Math.floor(i / 12) + 2024;
                        const month = (i % 12) + 1;
                        const monthStr = month.toString().padStart(2, '0');
                        return (
                          <option key={`${year}-${monthStr}`} value={`${year}-${monthStr}`}>
                            {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Hours</label>
                      <input
                        type="number"
                        value={scheduleForm.scheduledHours || ''}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledHours: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Actual Booked Hours (From Booking System)</label>
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {scheduleForm.actualBookedHours || 'Not Available'}
                        {scheduleForm.actualBookedHours && 'h'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Sales/Hour</label>
                      <input
                        type="number"
                        value={scheduleForm.serviceSalesPerHour || ''}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, serviceSalesPerHour: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Productivity % (Booked / Scheduled)</label>
                      <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {scheduleForm.scheduledHours && scheduleForm.actualBookedHours
                          ? `${Math.round((scheduleForm.actualBookedHours / scheduleForm.scheduledHours) * 100)}%`
                          : 'N/A'
                        }
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Productivity Goal (%)</label>
                      <input
                        type="number"
                        value={scheduleForm.productivityGoal || ''}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, productivityGoal: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Est. Revenue</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {formatCurrency(scheduleForm.estimatedRevenue || 0)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Export Performance Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Export Performance Data</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleExportPerformanceSummary('csv')}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export CSV
                      </button>
                      <button
                        onClick={() => handleExportPerformanceSummary('pdf')}
                        className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center text-sm"
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Export PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* Weekly Schedule */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-4 gap-3 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                      <div>Day</div>
                      <div>Start Time</div>
                      <div>End Time</div>
                      <div>Hours</div>
                    </div>
                    {Object.entries(scheduleForm.weeklySchedule || {}).map(([day, schedule]) => (
                      <div key={day} className="grid grid-cols-4 gap-3 items-center">
                        <div className="font-medium text-gray-700 capitalize">{day}</div>
                        <input
                          type="time"
                          value={schedule.start}
                          onChange={(e) => updateWeeklySchedule(day, 'start', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#f4647d]"
                        />
                        <input
                          type="time"
                          value={schedule.end}
                          onChange={(e) => updateWeeklySchedule(day, 'end', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#f4647d]"
                        />
                        <div className="text-sm font-medium text-[#f4647d]">{schedule.hours}h</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Weekly Total:</span>
                      <span className="font-bold text-lg text-[#f4647d]">{calculateWeeklyHours()}h</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-medium text-gray-700">Monthly Total:</span>
                      <span className="font-bold text-lg text-[#0c5b63]">{calculateMonthlyHours()}h</span>
                    </div>
                    {scheduleForm.actualBookedHours && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-medium text-gray-700">Actual Productivity:</span>
                        <span className="font-bold text-lg text-green-600">
                          {Math.round((scheduleForm.actualBookedHours / calculateMonthlyHours()) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Schedule Button */}
                <button
                  onClick={handleSaveSchedule}
                  className="w-full px-4 py-3 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center justify-center"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save Schedule & Metrics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {addingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Employee</h3>
              <button
                onClick={() => setAddingEmployee(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={employeeForm.name || ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  placeholder="Enter employee name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={employeeForm.position || ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  placeholder="Enter position title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  value={employeeForm.experienceLevel || ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Senior">Senior</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                <input
                  type="date"
                  value={employeeForm.hireDate ? employeeForm.hireDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, hireDate: new Date(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Locations</label>
                <input
                  type="text"
                  value={employeeForm.locations?.join(', ') || ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, locations: e.target.value.split(', ').filter(l => l.trim()) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  placeholder="Enter locations separated by commas"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setAddingEmployee(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                disabled={!employeeForm.name || !employeeForm.divisionId}
                className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] disabled:bg-gray-400 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;