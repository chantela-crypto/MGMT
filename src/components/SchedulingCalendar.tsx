import React, { useState, useMemo, useEffect } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division, User } from '../types/division';
import { HormoneUnit } from '../types/hormoneUnit';
import { Calendar, Clock, Users, MapPin, Lock, Unlock, Save, Filter, Grid, List, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Star, Award, Activity, Zap } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, eachWeekOfInterval, addMonths, subMonths, isBefore, isAfter } from 'date-fns';

interface ShiftEntry {
  id: string;
  employeeId?: string;
  unitId?: string;
  date: string;
  startTime: string;
  endTime: string;
  scheduledHours: number;
  location: string;
  divisionId: string;
  createdBy: string;
  createdAt: Date;
  isLocked: boolean;
}

interface SchedulingCalendarProps {
  employees: Employee[];
  divisions: Division[];
  hormoneUnits: HormoneUnit[];
  currentUser: User;
  onUpdateScheduledHours: (employeeId: string, hours: number) => void;
  onUpdateSchedule: (shifts: ShiftEntry[]) => void;
}

const SchedulingCalendar: React.FC<SchedulingCalendarProps> = ({
  employees,
  divisions,
  hormoneUnits,
  currentUser,
  onUpdateScheduledHours,
  onUpdateSchedule,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [viewType, setViewType] = useState<'employee' | 'unit'>('employee');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [shifts, setShifts] = useState<ShiftEntry[]>(() => {
    // Load shifts from localStorage on component mount
    try {
      const savedShifts = localStorage.getItem('calendarShifts');
      return savedShifts ? JSON.parse(savedShifts) : [];
    } catch (error) {
      console.error('Error loading saved shifts:', error);
      return [];
    }
  });
  const [selectedCell, setSelectedCell] = useState<{ entityId: string; date: string } | null>(null);
  const [shiftForm, setShiftForm] = useState<{ startTime: string; endTime: string; location: string }>({
    startTime: '09:00',
    endTime: '17:00',
    location: 'St. Albert'
  });

  // Save shifts to localStorage whenever shifts change
  React.useEffect(() => {
    try {
      localStorage.setItem('calendarShifts', JSON.stringify(shifts));
    } catch (error) {
      console.error('Error saving shifts:', error);
    }
  }, [shifts]);

  // Check if calendar is locked (after 25th of current month)
  const isCalendarLocked = useMemo(() => {
    const now = new Date();
    const lockDate = new Date(now.getFullYear(), now.getMonth(), 25, 23, 59, 59); // 11:59 PM on 25th
    return isAfter(now, lockDate) && currentUser.role !== 'admin'; // COO role is admin
  }, [currentUser.role]);

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      return weeks.map(week => eachDayOfInterval({
        start: week,
        end: endOfWeek(week, { weekStartsOn: 1 })
      })).flat();
    }
  }, [currentDate, viewMode]);

  // Filter entities based on division and location
  const filteredEntities = useMemo(() => {
    if (viewType === 'employee') {
      let filtered = employees.filter(emp => emp.isActive);
      
      if (selectedDivision !== 'all') {
        filtered = filtered.filter(emp => emp.divisionId === selectedDivision);
      }
      
      if (selectedLocation !== 'all') {
        filtered = filtered.filter(emp => emp.locations?.includes(selectedLocation));
      }

      // Division managers can only see their division
      if (currentUser.role === 'division-manager' && currentUser.divisionId) {
        filtered = filtered.filter(emp => emp.divisionId === currentUser.divisionId);
      }
      
      return filtered;
    } else {
      let filtered = hormoneUnits;
      
      if (selectedLocation !== 'all') {
        filtered = filtered.filter(unit => unit.location === selectedLocation);
      }
      
      return filtered;
    }
  }, [employees, hormoneUnits, selectedDivision, selectedLocation, viewType, currentUser]);

  // Get shift for specific entity and date
  const getShift = (entityId: string, date: Date): ShiftEntry | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.find(shift => 
      (shift.employeeId === entityId || shift.unitId === entityId) && 
      shift.date === dateStr
    );
  };

  // Calculate scheduled hours for entity
  const getEntityScheduledHours = (entityId: string): number => {
    return shifts
      .filter(shift => shift.employeeId === entityId || shift.unitId === entityId)
      .reduce((total, shift) => total + shift.scheduledHours, 0);
  };

  // Handle cell click to assign shift
  const handleCellClick = (entityId: string, date: Date) => {
    if (isCalendarLocked) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingShift = getShift(entityId, date);
    
    if (existingShift) {
      setShiftForm({
        startTime: existingShift.startTime,
        endTime: existingShift.endTime,
        location: existingShift.location
      });
    } else {
      setShiftForm({
        startTime: '09:00',
        endTime: '17:00',
        location: selectedLocation !== 'all' ? selectedLocation : 'St. Albert'
      });
    }
    
    setSelectedCell({ entityId, date: dateStr });
  };

  // Calculate hours from time range
  const calculateHours = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  // Save shift
  const handleSaveShift = () => {
    if (!selectedCell) {
      return;
    }
    
    const scheduledHours = calculateHours(shiftForm.startTime, shiftForm.endTime);
    
    if (scheduledHours <= 0) {
      alert('Please enter valid start and end times');
      return;
    }
    
    const entity = filteredEntities.find(e => 
      ('id' in e ? e.id : e.unitId) === selectedCell.entityId
    );
    
    if (!entity) {
      return;
    }
    
    const newShift: ShiftEntry = {
      id: `shift-${Date.now()}`,
      [viewType === 'employee' ? 'employeeId' : 'unitId']: selectedCell.entityId,
      date: selectedCell.date,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      scheduledHours,
      location: shiftForm.location,
      divisionId: 'divisionId' in entity ? entity.divisionId : 'hormone',
      createdBy: currentUser.id,
      createdAt: new Date(),
      isLocked: false,
    };

    // Update local shifts state
    const updatedShifts = shifts.filter(shift => 
      !((shift.employeeId === selectedCell.entityId || shift.unitId === selectedCell.entityId) && 
        shift.date === selectedCell.date)
    );
    updatedShifts.push(newShift);
    setShifts(updatedShifts);

    // Update total scheduled hours for the employee
    if (newShift.employeeId) {
      const totalHours = updatedShifts
        .filter(shift => shift.employeeId === newShift.employeeId)
        .reduce((sum, shift) => sum + shift.scheduledHours, 0);
      onUpdateScheduledHours(newShift.employeeId, totalHours);
    }

    setSelectedCell(null);
    
    // Call the parent update handler with all shifts
    onUpdateSchedule(updatedShifts);
  };

  // Delete shift
  const handleDeleteShift = () => {
    if (!selectedCell) return;
    
    const updatedShifts = shifts.filter(shift => 
      !((shift.employeeId === selectedCell.entityId || shift.unitId === selectedCell.entityId) && 
        shift.date === selectedCell.date)
    );
    setShifts(updatedShifts);
    
    // Update scheduled hours if it was an employee shift
    const deletedShift = shifts.find(shift => 
      (shift.employeeId === selectedCell.entityId || shift.unitId === selectedCell.entityId) && 
      shift.date === selectedCell.date
    );
    
    if (deletedShift?.employeeId) {
      const totalHours = updatedShifts
        .filter(shift => shift.employeeId === deletedShift.employeeId)
        .reduce((sum, shift) => sum + shift.scheduledHours, 0);
      onUpdateScheduledHours(deletedShift.employeeId, totalHours);
    }
    
    setSelectedCell(null);
    
    // Call the parent update handler
    onUpdateSchedule(updatedShifts);
  };

  // Navigation functions
  const navigatePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  };

  const locations = ['St. Albert', 'Spruce Grove', 'Sherwood Park', 'Wellness', 'Remote'];

  // Location color mapping
  const getLocationColor = (location: string): string => {
    switch (location) {
      case 'Sherwood Park': return '#ec4899'; // Pink
      case 'Spruce Grove': return '#14b8a6'; // Teal  
      case 'St. Albert': return '#8b5cf6'; // Purple
      case 'Wellness': return '#f97316'; // Orange
      case 'Remote': return '#60a5fa'; // Soft blue
      default: return '#6b7280'; // Gray fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Scheduling Calendar</h1>
              <p className="text-white/80 text-lg">Staff scheduling and calendar management system</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Calendar Status</div>
            <div className="text-xl font-bold">
              {isCalendarLocked ? 'Locked' : 'Open'}
            </div>
            <div className="text-sm text-white/70">
              {isCalendarLocked ? 'After 25th' : 'Editable'}
            </div>
          </div>
        </div>

        {/* Enhanced Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Entities</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {filteredEntities.length}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">
              {viewType === 'employee' ? 'Active employees' : 'Hormone units'}
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Scheduled Hours</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {shifts.reduce((total, shift) => total + shift.scheduledHours, 0)}h
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Across all entities</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Shifts Created</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {shifts.length}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Total shift entries</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            {isCalendarLocked && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white/80 mb-2">Calendar Status</h3>
                  <div className="text-3xl font-bold text-white mb-1">Locked</div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}
            {!isCalendarLocked && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white/80 mb-2">Calendar Status</h3>
                  <div className="text-3xl font-bold text-white mb-1">Open</div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Unlock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}
            <div className="text-sm text-white/70">
              {isCalendarLocked ? 'Editing disabled after 25th' : 'Ready for scheduling'}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Calendar Controls & Filters</h3>
            <div className="text-sm text-gray-600">
              {filteredEntities.length} {viewType === 'employee' ? 'employees' : 'units'} • {shifts.length} shifts
            </div>
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                  viewMode === 'week' ? 'bg-white text-[#f4647d] shadow-md transform scale-105' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                  viewMode === 'month' ? 'bg-white text-[#f4647d] shadow-md transform scale-105' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid className="h-4 w-4 mr-2" />
                Month
              </button>
            </div>

            {/* View Type Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewType('employee')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                  viewType === 'employee' ? 'bg-white text-[#0c5b63] shadow-md transform scale-105' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="h-4 w-4 mr-1 inline" />
                Employee
              </button>
              <button
                onClick={() => setViewType('unit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                  viewType === 'unit' ? 'bg-white text-[#0c5b63] shadow-md transform scale-105' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid className="h-4 w-4 mr-1 inline" />
                Hormone Unit
              </button>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Filter className="h-4 w-4 inline mr-2 text-[#f4647d]" />
                Division Filter
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent text-gray-900 shadow-sm transition-all duration-200"
                disabled={currentUser.role === 'division-manager'}
              >
                <option value="all">All Divisions</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
              {currentUser.role === 'division-manager' && (
                <p className="text-xs text-gray-500 mt-2">Limited to your division</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <MapPin className="h-4 w-4 inline mr-2 text-[#0c5b63]" />
                Location Filter
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent text-gray-900 shadow-sm transition-all duration-200"
              >
                <option value="all">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Activity className="h-4 w-4 inline mr-2 text-purple-600" />
                Summary Stats
              </label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Entities:</span>
                  <span className="font-semibold text-gray-900">{filteredEntities.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Shifts:</span>
                  <span className="font-semibold text-gray-900">{shifts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="font-semibold text-[#f4647d]">{shifts.reduce((total, shift) => total + shift.scheduledHours, 0)}h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Calendar Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={navigatePrevious}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous {viewMode === 'week' ? 'Week' : 'Month'}
          </button>
          
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {viewMode === 'week' 
                ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                : format(currentDate, 'MMMM yyyy')
              }
            </h3>
            <p className="text-sm text-gray-600">
              {viewType === 'employee' ? 'Employee Scheduling' : 'Hormone Unit Scheduling'}
            </p>
          </div>
          
          <button
            onClick={navigateNext}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            Next {viewMode === 'week' ? 'Week' : 'Month'}
            <ChevronRight className="h-5 w-5 ml-2" />
          </button>
        </div>

        {/* Calendar Status Indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className={`flex items-center px-6 py-3 rounded-xl shadow-sm ${
            isCalendarLocked 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {isCalendarLocked ? (
              <>
                <Lock className="h-5 w-5 mr-2" />
                <span className="font-medium">Calendar Locked - Editing Disabled After 25th</span>
              </>
            ) : (
              <>
                <Unlock className="h-5 w-5 mr-2" />
                <span className="font-medium">Calendar Open - Click Cells to Schedule</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Calendar Grid */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {viewType === 'employee' ? 'Employee' : 'Hormone Unit'} Schedule Grid
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                <span>Available</span>
              </div>
              {isCalendarLocked ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Locked</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-48 bg-white/50 backdrop-blur-sm">
                  {viewType === 'employee' ? 'Employee' : 'Hormone Unit'}
                </th>
                {(viewMode === 'week' ? dateRange.slice(0, 7) : dateRange.slice(0, 7)).map(date => (
                  <th key={date.toISOString()} className="px-3 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider min-w-36 bg-white/30 backdrop-blur-sm">
                    <div className="text-gray-600 font-medium">{format(date, 'EEE')}</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{format(date, 'd')}</div>
                    <div className="text-xs text-gray-500 mt-1">{format(date, 'MMM')}</div>
                  </th>
                ))}
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center justify-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Total Hours
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEntities.map(entity => {
                const entityId = 'id' in entity ? entity.id : entity.unitId;
                const entityName = 'name' in entity ? entity.name : entity.unitName;
                const division = 'divisionId' in entity 
                  ? divisions.find(d => d.id === entity.divisionId)
                  : divisions.find(d => d.id === 'hormone');
                const totalHours = getEntityScheduledHours(entityId);

                return (
                  <tr key={entityId} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-6 whitespace-nowrap bg-gray-50/50">
                      <div className="flex items-center">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-4 shadow-md"
                          style={{ backgroundColor: division?.color }}
                        >
                          {entityName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{entityName}</div>
                          <div className="text-xs text-gray-600">
                            {'position' in entity ? entity.position : `${entity.location} Unit`}
                          </div>
                          <div className="flex items-center mt-1">
                            <div 
                              className="w-2 h-2 rounded-full mr-2"
                              style={{ backgroundColor: division?.color }}
                            />
                            <span className="text-xs text-gray-500">{division?.name}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {(viewMode === 'week' ? dateRange.slice(0, 7) : dateRange.slice(0, 7)).map(date => {
                      const shift = getShift(entityId, date);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      
                      return (
                        <td 
                          key={date.toISOString()}
                          className={`px-3 py-6 text-center cursor-pointer transition-all duration-200 ${
                            isWeekend ? 'bg-gray-50/50' : 'bg-white'
                          } ${
                            shift ? 'hover:bg-blue-50' : 'hover:bg-gray-100'
                          } ${
                            isCalendarLocked ? 'cursor-not-allowed opacity-60' : 'hover:shadow-sm'
                          }`}
                          onClick={() => handleCellClick(entityId, date)}
                        >
                          {shift ? (
                            <div className="text-xs transform hover:scale-105 transition-transform duration-200">
                              <div className="font-medium px-3 py-2 rounded-lg border-2 shadow-sm" 
                                   style={{ 
                                     backgroundColor: `${getLocationColor(shift.location)}15`,
                                     borderColor: getLocationColor(shift.location),
                                     color: getLocationColor(shift.location)
                                   }}>
                                <div className="font-bold text-sm">
                                  {shift.scheduledHours}h
                                </div>
                                <div className="text-xs mt-1 opacity-90">
                                  {shift.startTime} - {shift.endTime}
                                </div>
                                <div className="text-xs mt-1 opacity-80 font-medium">
                                  {shift.location}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs py-4">
                              {isCalendarLocked ? (
                                <div className="flex flex-col items-center">
                                  <Lock className="h-5 w-5 mx-auto mb-1" />
                                  <span className="text-xs">Locked</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity duration-200">
                                  <Plus className="h-5 w-5 mx-auto mb-1" />
                                  <span className="text-xs">Click to schedule</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="px-4 py-6 text-center bg-gray-50/50">
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-[#f4647d] mb-1">{totalHours}h</div>
                        <div className="text-xs text-gray-600 font-medium">Total Scheduled</div>
                        {totalHours > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-[#f4647d] h-1 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min((totalHours / 200) * 100, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {Math.round((totalHours / 200) * 100)}% of 200h target
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift Assignment Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
          <div className="relative top-20 mx-auto p-8 border w-11/12 max-w-md shadow-2xl rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#f4647d] bg-opacity-10 rounded-xl flex items-center justify-center mr-3">
                  <Calendar className="h-6 w-6 text-[#f4647d]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {getShift(selectedCell.entityId, new Date(selectedCell.date)) ? 'Edit Shift' : 'Create Shift'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filteredEntities.find(e => ('id' in e ? e.id : e.unitId) === selectedCell.entityId)?.name || 
                     filteredEntities.find(e => ('id' in e ? e.id : e.unitId) === selectedCell.entityId)?.unitName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Shift Details</h4>
                    <p className="text-sm text-blue-700">
                      {format(new Date(selectedCell.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1 text-green-600" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent transition-all duration-200"
                    disabled={isCalendarLocked}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1 text-red-600" />
                    End Time
                  </label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent transition-all duration-200"
                    disabled={isCalendarLocked}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1 text-purple-600" />
                  Location
                </label>
                <select
                  value={shiftForm.location}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f4647d] focus:border-transparent transition-all duration-200"
                  disabled={isCalendarLocked}
                >
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="h-6 w-6 mr-3" />
                    <div>
                      <div className="text-sm opacity-90">Scheduled Hours</div>
                      <div className="text-2xl font-bold">
                        {calculateHours(shiftForm.startTime, shiftForm.endTime)}h
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">Location</div>
                    <div className="text-lg font-bold">{shiftForm.location}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between space-x-3 pt-6 border-t border-gray-200">
              {getShift(selectedCell.entityId, new Date(selectedCell.date)) && !isCalendarLocked && (
                <button
                  onClick={handleDeleteShift}
                  className="flex items-center px-4 py-3 border-2 border-red-300 text-red-700 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Shift
                </button>
              )}
              <div className="flex space-x-3 ml-auto">
                <button
                  onClick={() => setSelectedCell(null)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                {!isCalendarLocked && (
                  <button
                    onClick={handleSaveShift}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-[#f4647d] to-[#fd8585] text-white rounded-xl hover:from-[#fd8585] hover:to-[#f4647d] transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <Save className="h-4 w-4 mr-2" />
                {getShift(selectedCell.entityId, new Date(selectedCell.date)) ? 'Edit Shift' : 'Assign Shift'}
                    Save Shift
                  </button>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingCalendar;