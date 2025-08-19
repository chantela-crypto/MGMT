import React, { useState, useMemo } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division } from '../types/division';
import { HormoneUnit } from '../types/hormoneUnit';
import { Calendar, Clock, Users, Target, DollarSign, MapPin, User, Edit, Save, X, TrendingUp, Activity, AlertCircle, Trash2, Download, FileText, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../utils/scoring';

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
  weeklySchedule: {
    monday: { start: string; end: string; hours: number };
    tuesday: { start: string; end: string; hours: number };
    wednesday: { start: string; end: string; hours: number };
    thursday: { start: string; end: string; hours: number };
    friday: { start: string; end: string; hours: number };
    saturday: { start: string; end: string; hours: number };
    sunday: { start: string; end: string; hours: number };
  };
  actualBookedHours?: number; // From booking system integration
}

interface SchedulingProps {
  employees: Employee[];
  divisions: Division[];
  hormoneUnits: HormoneUnit[];
  employeeKPIData: EmployeeKPIData[];
  onUpdateEmployee: (employee: Employee) => void;
  onUpdateSchedule: (schedule: ScheduleEntry) => void;
}

const Scheduling: React.FC<SchedulingProps> = ({
  employees,
  divisions,
  hormoneUnits,
  employeeKPIData,
  onUpdateEmployee,
  onUpdateSchedule,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Form states
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [scheduleForm, setScheduleForm] = useState<Partial<ScheduleEntry>>({});

  // Mock schedule data with booking system integration
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
      actualBookedHours: 140, // From booking system
      weeklySchedule: {
        monday: { start: '09:00', end: '17:00', hours: 8 },
        tuesday: { start: '09:00', end: '17:00', hours: 8 },
        wednesday: { start: '09:00', end: '17:00', hours: 8 },
        thursday: { start: '09:00', end: '17:00', hours: 8 },
        friday: { start: '09:00', end: '17:00', hours: 8 },
        saturday: { start: '10:00', end: '16:00', hours: 6 },
        sunday: { start: '', end: '', hours: 0 },
      }
    },
    {
      employeeId: 'emp-001',
      month: '12',
      year: 2024,
      scheduledHours: 155,
      actualHours: 150,
      bookedHours: 135,
      serviceSalesPerHour: 210,
      productivityGoal: 88,
      estimatedRevenue: 28350,
      actualBookedHours: 135,
      weeklySchedule: {
        monday: { start: '09:00', end: '17:00', hours: 8 },
        tuesday: { start: '09:00', end: '17:00', hours: 8 },
        wednesday: { start: '09:00', end: '17:00', hours: 8 },
        thursday: { start: '09:00', end: '17:00', hours: 8 },
        friday: { start: '09:00', end: '16:00', hours: 7 },
        saturday: { start: '10:00', end: '15:00', hours: 5 },
        sunday: { start: '', end: '', hours: 0 },
      }
    },
    {
      employeeId: 'emp-001',
      month: '11',
      year: 2024,
      scheduledHours: 160,
      actualHours: 158,
      bookedHours: 145,
      serviceSalesPerHour: 205,
      productivityGoal: 85,
      estimatedRevenue: 29725,
      actualBookedHours: 145,
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

  // Initialize schedule form when employee is selected
  React.useEffect(() => {
    if (selectedEmployee) {
      const existingSchedule = getEmployeeSchedule(selectedEmployee.id);
      if (existingSchedule) {
        setScheduleForm(existingSchedule);
      } else {
        setScheduleForm({
          employeeId: selectedEmployee.id,
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
    }
  }, [selectedEmployee, selectedMonth, selectedYear]);

  const filteredEmployees = selectedDivision === 'all' 
    ? employees.filter(emp => emp.isActive && emp.divisionId !== 'hormone')
    : selectedDivision === 'hormone'
    ? [] // Don't show individual hormone employees, show units instead
    : employees.filter(emp => emp.divisionId === selectedDivision && emp.isActive);

  // Get hormone units to display when hormone division is selected
  const displayHormoneUnits = selectedDivision === 'all' || selectedDivision === 'hormone';
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
  };

  const handleSaveEmployee = () => {
    if (employeeForm.id) {
      onUpdateEmployee(employeeForm as Employee);
      setSelectedEmployee(employeeForm as Employee);
      setEditingEmployee(false);
    }
  };

  const handleSaveSchedule = () => {
    if (!scheduleForm.employeeId) {
      alert('No employee selected for schedule');
      return;
    }
    
    const newSchedule = scheduleForm as ScheduleEntry;
    setScheduleData(prev => {
      const filtered = prev.filter(s => 
        !(s.employeeId === newSchedule.employeeId && 
          s.month === newSchedule.month && 
          s.year === newSchedule.year)
      );
      return [...filtered, newSchedule];
    });
    onUpdateSchedule(newSchedule);
  };

  const handleDeactivateEmployee = () => {
    if (!selectedEmployee) return;
    
    if (confirm(`Are you sure you want to deactivate ${selectedEmployee.name}?`)) {
      const updatedEmployee = { ...selectedEmployee, isActive: false };
      onUpdateEmployee(updatedEmployee);
      setSelectedEmployee(null);
    }
  };

  // Export schedule history
  const handleExportScheduleHistory = (format: 'csv' | 'pdf') => {
    if (!selectedEmployee) return;
    
    const history = getEmployeeScheduleHistory(selectedEmployee.id);
    const csvData = [
      ['Month', 'Year', 'Scheduled Hours', 'Actual Hours', 'Booked Hours', 'Productivity Goal', 'Estimated Revenue', 'Actual Productivity %'],
      ...history.map(schedule => [
        new Date(schedule.year, parseInt(schedule.month) - 1).toLocaleDateString('en-US', { month: 'long' }),
        schedule.year.toString(),
        schedule.scheduledHours.toString(),
        schedule.actualHours.toString(),
        schedule.bookedHours.toString(),
        `${schedule.productivityGoal}%`,
        formatCurrency(schedule.estimatedRevenue),
        schedule.actualBookedHours ? `${Math.round((schedule.actualBookedHours / schedule.scheduledHours) * 100)}%` : 'N/A'
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

  // Export performance summary
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
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Employee Projections</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>

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
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Employees</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">{filteredEmployees.length}</div>
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
                <h3 className="text-sm font-medium text-gray-600 mb-2">Scheduled Hours</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {scheduleData
                    .filter(s => s.month === selectedMonth && s.year === selectedYear)
                    .reduce((sum, s) => sum + s.scheduledHours, 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Est. Revenue</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(scheduleData
                    .filter(s => s.month === selectedMonth && s.year === selectedYear)
                    .reduce((sum, s) => sum + s.estimatedRevenue, 0))}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Productivity Goal</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {scheduleData
                    .filter(s => s.month === selectedMonth && s.year === selectedYear)
                    .reduce((sum, s, _, arr) => sum + s.productivityGoal / arr.length, 0)
                    .toFixed(0)}%
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Division:</span>
                  <span className="font-medium">{division?.name}</span>
                </div>
                
                {schedule && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Calendar Hours:</span>
                      <span className="font-medium">{getEmployeeScheduledHours(employee.id)}h</span>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={employeeForm.category || ''}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, category: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        >
                          <option value="laser technician">Laser Technician</option>
                          <option value="nurse injector">Nurse Injector</option>
                          <option value="hormone specialist">Hormone Specialist</option>
                          <option value="nurse practitioner">Nurse Practitioner</option>
                          <option value="administrative">Administrative</option>
                          <option value="marketing">Marketing</option>
                          <option value="sales">Sales</option>
                          <option value="physician">Physician</option>
                          <option value="guest care">Guest Care</option>
                          <option value="management">Management</option>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Locations</label>
                        <input
                          type="text"
                          value={employeeForm.locations?.join(', ') || ''}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, locations: e.target.value.split(', ').filter(l => l.trim()) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                          placeholder="Enter locations separated by commas"
                        />
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
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{selectedEmployee.category}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Schedule History */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule History</h3>
                  
                  {/* Export Button */}
                  <div className="flex justify-end mb-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleExportScheduleHistory('csv')}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export CSV
                      </button>
                      <button
                        onClick={() => handleExportScheduleHistory('pdf')}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center text-sm"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Export PDF
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
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Actual:</span>
                            <span className="ml-1 font-medium">{schedule.actualHours}h</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Booked:</span>
                            <span className="ml-1 font-medium">{schedule.bookedHours}h</span>
                          </div>
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

              {/* Right Column - Schedule & Metrics */}
              <div className="space-y-6">
                {/* Monthly Schedule Metrics */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Schedule</h3>
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
                  
                  {/* Performance Integration Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <Target className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Performance Integration</h4>
                        <p className="text-sm text-blue-700">
                          These metrics feed directly into Performance tab KPI cards: Scheduled vs Actual vs Booked hours, productivity calculations, and revenue tracking.
                        </p>
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
    </div>
  );
};

export default Scheduling;