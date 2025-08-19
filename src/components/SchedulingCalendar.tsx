import React, { useState, useMemo, useEffect } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division, User } from '../types/division';
import { HormoneUnit } from '../types/hormoneUnit';
import { Calendar, Clock, Users, MapPin, Lock, Unlock, Save, Filter, Grid, List, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Scheduling Calendar</h2>
            {isCalendarLocked && (
              <div className="ml-4 flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                <Lock className="h-4 w-4 mr-1" />
                Locked (After 25th)
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
                }`}
              >
                Month
              </button>
            </div>

            {/* View Type Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewType('employee')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewType === 'employee' ? 'bg-white text-[#0c5b63] shadow-sm' : 'text-gray-600'
                }`}
              >
                <Users className="h-4 w-4 mr-1 inline" />
                Employee
              </button>
              <button
                onClick={() => setViewType('unit')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewType === 'unit' ? 'bg-white text-[#0c5b63] shadow-sm' : 'text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4 mr-1 inline" />
                Hormone Unit
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              disabled={currentUser.role === 'division-manager'}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Calendar Status
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
              {isCalendarLocked ? (
                <div className="flex items-center text-red-600">
                  <Lock className="h-4 w-4 mr-2" />
                  Locked (After 25th)
                </div>
              ) : (
                <div className="flex items-center text-green-600">
                  <Unlock className="h-4 w-4 mr-2" />
                  Editable
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={navigatePrevious}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>
          
          <h3 className="text-lg font-semibold text-gray-900">
            {viewMode === 'week' 
              ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </h3>
          
          <button
            onClick={navigateNext}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  {viewType === 'employee' ? 'Employee' : 'Hormone Unit'}
                </th>
                {(viewMode === 'week' ? dateRange.slice(0, 7) : dateRange.slice(0, 7)).map(date => (
                  <th key={date.toISOString()} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    <div>{format(date, 'EEE')}</div>
                    <div className="text-lg font-bold text-gray-900">{format(date, 'd')}</div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntities.map(entity => {
                const entityId = 'id' in entity ? entity.id : entity.unitId;
                const entityName = 'name' in entity ? entity.name : entity.unitName;
                const division = 'divisionId' in entity 
                  ? divisions.find(d => d.id === entity.divisionId)
                  : divisions.find(d => d.id === 'hormone');
                const totalHours = getEntityScheduledHours(entityId);

                return (
                  <tr key={entityId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                          style={{ backgroundColor: division?.color }}
                        >
                          {entityName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entityName}</div>
                          <div className="text-sm text-gray-500">
                            {'position' in entity ? entity.position : `${entity.location} Unit`}
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
                          className={`px-3 py-4 text-center cursor-pointer transition-colors ${
                            isWeekend ? 'bg-gray-50' : ''
                          } ${
                            shift ? 'hover:bg-gray-100' : 'hover:bg-gray-100'
                          } ${
                            isCalendarLocked ? 'cursor-not-allowed opacity-60' : ''
                          }`}
                          onClick={() => handleCellClick(entityId, date)}
                        >
                          {shift ? (
                            <div className="text-xs">
                              <div className="font-medium px-2 py-1 rounded border" 
                                   style={{ 
                                     backgroundColor: `${getLocationColor(shift.location)}20`,
                                     borderColor: getLocationColor(shift.location),
                                     color: getLocationColor(shift.location)
                                   }}>
                                {shift.startTime} - {shift.endTime}
                                <div className="font-medium mt-1">
                                  {shift.scheduledHours}h
                                </div>
                                <div className="text-xs opacity-80">
                                  {shift.location}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs">
                              {isCalendarLocked ? (
                                <Lock className="h-4 w-4 mx-auto" />
                              ) : (
                                'Click to schedule'
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="px-3 py-4 text-center">
                      <div className="text-lg font-bold text-gray-900">{totalHours}h</div>
                      <div className="text-xs text-gray-500">scheduled</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Entities</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {filteredEntities.length}
              </div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Scheduled Hours</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {shifts.reduce((total, shift) => total + shift.scheduledHours, 0)}h
              </div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Shifts Created</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {shifts.length}
              </div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Calendar Status</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {isCalendarLocked ? 'Locked' : 'Open'}
              </div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                {isCalendarLocked ? (
                  <Lock className="w-6 h-6 text-red-500" />
                ) : (
                  <Unlock className="w-6 h-6 text-green-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shift Assignment Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {getShift(selectedCell.entityId, new Date(selectedCell.date)) ? 'Edit Shift' : 'Assign Shift'}
              </h3>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  value={format(new Date(selectedCell.date), 'EEEE, MMMM d, yyyy')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    disabled={isCalendarLocked}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    disabled={isCalendarLocked}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={shiftForm.location}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  disabled={isCalendarLocked}
                >
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Scheduled Hours:</span>
                  <span className="text-lg font-bold text-[#f4647d]">
                    {calculateHours(shiftForm.startTime, shiftForm.endTime)}h
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              {getShift(selectedCell.entityId, new Date(selectedCell.date)) && !isCalendarLocked && (
                <button
                  onClick={handleDeleteShift}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                >
                  Delete Shift
                </button>
              )}
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {!isCalendarLocked && (
                <button
                  onClick={handleSaveShift}
                  className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Shift
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingCalendar;