/*
 * LOCKED PAGE - NO LAYOUT, INFORMATION, OR DESIGN CHANGES ALLOWED
 * This page is protected from modifications to maintain consistency
 * Scoreboard layout, information display, and design are finalized
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Division, KPIData } from '../types/division';
import { Employee, EmployeeKPIData } from '../types/employee';
import { getScoreLevel, getScoreColor, getScorePercentage, formatCurrency } from '../utils/scoring';
import { TrendingUp, TrendingDown, Users, Clock, DollarSign, Target, Award, AlertCircle, CheckCircle, X, Save, Calendar, User, Filter } from 'lucide-react';

interface DailyEntry {
  employeeId: string;
  date: string;
  status: 'active' | 'away' | 'sick' | 'not-booked';
  hoursWorked: number;
  hoursBooked: number;
  serviceRevenue: number;
  retailSales: number;
  productivityPercentage: number; // auto-calculated
  newClients: number;
  consults: number;
  consultConverted: number;
  consultConversionPercentage: number; // auto-calculated
  totalClients: number;
  prebooks: number;
  prebookPercentage: number; // auto-calculated
  isSubmitted: boolean;
}

interface DivisionSubmission {
  divisionId: string;
  date: string;
  isComplete: boolean;
  entries: DailyEntry[];
}

interface MonthToDateScoreboardProps {
  divisions: Division[];
  employees: Employee[];
  kpiData: KPIData[];
  employeeKPIData: EmployeeKPIData[];
  onWeeklyUpdate: (divisionId: string, weeklyData: any) => void;
  onDailySubmission: (submission: DivisionSubmission) => void;
  dailySubmissions: DivisionSubmission[];
}

const Scoreboard: React.FC<MonthToDateScoreboardProps> = ({
  divisions,
  employees,
  kpiData,
  employeeKPIData,
  onWeeklyUpdate,
  onDailySubmission,
  dailySubmissions,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('company-wide');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [showDailyForm, setShowDailyForm] = useState<boolean>(false);
  const [selectedFormDivision, setSelectedFormDivision] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);

  // Define isDailyDataLocked and currentUser
  const isDailyDataLocked = useMemo(() => {
    const currentDate = new Date();
    const dayOfMonth = currentDate.getDate();
    // Lock data entry after the 25th of the month for non-admin users
    return dayOfMonth > 25;
  }, []);

  const currentUser = useMemo(() => ({
    id: 'current-user',
    role: 'manager' // This would come from your auth system
  }), []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if daily submission is complete for a division
  const isDailySubmissionComplete = (divisionId: string, date: string) => {
    const submission = dailySubmissions.find(s => s.divisionId === divisionId && s.date === date);
    return submission?.isComplete || false;
  };

  // Get division employees for form
  const getFormDivisionEmployees = (divisionId: string) => {
    return employees.filter(emp => emp.divisionId === divisionId && emp.isActive);
  };

  // Initialize daily entries for a division
  const initializeDailyEntries = (divisionId: string) => {
    const divisionEmployees = getFormDivisionEmployees(divisionId);
    const entries: DailyEntry[] = divisionEmployees.map(employee => ({
      employeeId: employee.id,
      date: selectedDate,
      status: 'active',
      hoursWorked: 0,
      hoursBooked: 0,
      serviceRevenue: 0,
      retailSales: 0,
      productivityPercentage: 0,
      newClients: 0,
      consults: 0,
      consultConverted: 0,
      consultConversionPercentage: 0,
      totalClients: 0,
      prebooks: 0,
      prebookPercentage: 0,
      isSubmitted: false,
    }));
    setDailyEntries(entries);
  };

  // Handle opening daily form
  const handleOpenDailyForm = (divisionId: string) => {
    setSelectedFormDivision(divisionId);
    setShowDailyForm(true);
    initializeDailyEntries(divisionId);
  };

  // Handle saving daily entries
  const handleSaveDailyEntries = () => {
    const submittedCount = dailyEntries.filter(entry => entry.isSubmitted).length;
    
    if (submittedCount === 0) {
      alert('Please submit at least one employee entry before saving');
      return;
    }
    
    const newSubmission: DivisionSubmission = {
      divisionId: selectedFormDivision,
      date: selectedDate,
      isComplete: true,
      entries: dailyEntries,
    };

    onDailySubmission(newSubmission);

    setShowDailyForm(false);
    setSelectedFormDivision('');
    setDailyEntries([]);
  };

  // Update daily entry
  const updateDailyEntry = (employeeId: string, field: keyof DailyEntry, value: number) => {
    setDailyEntries(prev => prev.map(entry => {
      if (entry.employeeId === employeeId) {
        const updatedEntry = { ...entry, [field]: value };
        
        // Auto-calculate productivity percentage
        if (field === 'hoursWorked' || field === 'hoursBooked') {
          updatedEntry.productivityPercentage = updatedEntry.hoursWorked > 0 
            ? Math.round((updatedEntry.hoursBooked / updatedEntry.hoursWorked) * 100)
            : 0;
        }
        
        // Auto-calculate consult conversion percentage
        if (field === 'consults' || field === 'consultConverted') {
          updatedEntry.consultConversionPercentage = updatedEntry.consults > 0 
            ? Math.round((updatedEntry.consultConverted / updatedEntry.consults) * 100)
            : 0;
        }
        
        // Auto-calculate prebook percentage
        if (field === 'totalClients' || field === 'prebooks') {
          updatedEntry.prebookPercentage = updatedEntry.totalClients > 0 
            ? Math.round((updatedEntry.prebooks / updatedEntry.totalClients) * 100)
            : 0;
        }
        
        return updatedEntry;
      }
      return entry;
    }));
  };

  // Update daily entry status
  const updateDailyEntryStatus = (employeeId: string, status: 'active' | 'away' | 'sick' | 'not-booked') => {
    setDailyEntries(prev => prev.map(entry => 
      entry.employeeId === employeeId 
        ? { ...entry, status }
        : entry
    ));
  };

  // Submit individual employee entry
  const submitEmployeeEntry = (employeeId: string) => {
    const entry = dailyEntries.find(e => e.employeeId === employeeId);
    if (!entry) return;
    
    if (entry.status === 'active' && entry.hoursWorked === 0) {
      if (!confirm('Hours worked is 0. Are you sure you want to submit this entry?')) {
        return;
      }
    }
    
    setDailyEntries(prev => prev.map(entry => 
      entry.employeeId === employeeId 
        ? { ...entry, isSubmitted: true }
        : entry
    ));
  };

  // Calculate top performers of the week
  useEffect(() => {
    const performers = employees.map(employee => {
      const empData = employeeKPIData.find(data => 
        data.employeeId === employee.id && 
        data.month === (new Date().getMonth() + 1).toString().padStart(2, '0') && 
        data.year === new Date().getFullYear()
      );

      if (!empData) return null;

      const avgScore = [
        empData.productivityRate,
        empData.retailPercentage,
        empData.happinessScore * 10,
        empData.attendanceRate,
      ].reduce((sum, val) => sum + val, 0) / 4;

      return {
        employee,
        score: Math.round(avgScore),
        division: divisions.find(d => d.id === employee.divisionId),
        data: empData,
      };
    }).filter(Boolean).sort((a, b) => b!.score - a!.score).slice(0, 5);

    setTopPerformers(performers);
  }, [employees, employeeKPIData, divisions]);

  const getDivisionEmployees = (divisionId: string) => {
    if (divisionId === 'company-wide') return employees.filter(emp => emp.isActive);
    return employees.filter(emp => emp.divisionId === divisionId && emp.isActive);
  };

  const getDivisionCurrentData = (divisionId: string) => {
    if (divisionId === 'company-wide') return kpiData;
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    return kpiData.find(data => 
      data.divisionId === divisionId && 
      data.month === currentMonth && 
      data.year === currentYear
    );
  };

  const calculateMonthProgress = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const currentDay = now.getDate();
    return Math.round((currentDay / totalDays) * 100);
  };

  // Calculate revenue metrics from daily submissions
  const calculateRevenueMetrics = () => {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    // Calculate revenue from daily submissions
    const dailyRevenue = dailySubmissions
      .filter(s => s.date.startsWith(`${currentYear}-${currentMonth.padStart(2, '0')}`))
      .reduce((sum, submission) => {
        return sum + submission.entries
          .filter(entry => entry.status === 'active' && entry.isSubmitted)
          .reduce((entrySum, entry) => entrySum + entry.serviceRevenue + entry.retailSales, 0);
      }, 0);
    
    const totalTarget = 500000; // Company-wide monthly target
    const percentToGoal = totalTarget > 0 ? Math.round((dailyRevenue / totalTarget) * 100) : 0;
    
    return { revenue: dailyRevenue, target: totalTarget, percentToGoal };
  };

  // Calculate daily metrics from submissions for each division
  const calculateDivisionDailyMetrics = (divisionId: string) => {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    const divisionSubmissions = dailySubmissions.filter(s => 
      s.divisionId === divisionId && 
      s.date.startsWith(`${currentYear}-${currentMonth.padStart(2, '0')}`)
    );

    let totalHoursWorked = 0;
    let totalHoursBooked = 0;
    let totalServiceRevenue = 0;
    let totalRetailSales = 0;
    let totalNewClients = 0;
    let totalConsults = 0;
    let totalConsultConverted = 0;
    let totalClients = 0;
    let totalPrebooks = 0;

    divisionSubmissions.forEach(submission => {
      submission.entries.forEach(entry => {
        if (entry.status === 'active' && entry.isSubmitted) {
          totalHoursWorked += entry.hoursWorked;
          totalHoursBooked += entry.hoursBooked;
          totalServiceRevenue += entry.serviceRevenue;
          totalRetailSales += entry.retailSales;
          totalNewClients += entry.newClients;
          totalConsults += entry.consults;
          totalConsultConverted += entry.consultConverted;
          totalClients += entry.totalClients;
          totalPrebooks += entry.prebooks;
        }
      });
    });

    const productivityPercent = totalHoursWorked > 0 ? Math.round((totalHoursBooked / totalHoursWorked) * 100) : 0;
    const conversionPercent = totalConsults > 0 ? Math.round((totalConsultConverted / totalConsults) * 100) : 0;
    const prebookPercent = totalClients > 0 ? Math.round((totalPrebooks / totalClients) * 100) : 0;

    return {
      hoursWorked: totalHoursWorked,
      hoursBooked: totalHoursBooked,
      serviceRevenue: totalServiceRevenue,
      retailSales: totalRetailSales,
      productivityPercent,
      newClients: totalNewClients,
      consults: totalConsults,
      consultConverted: totalConsultConverted,
      conversionPercent,
      totalClients,
      prebooks: totalPrebooks,
      prebookPercent,
    };
  };

  const revenueMetrics = calculateRevenueMetrics();
  const selectedDivisionName = selectedDivision === 'company-wide' 
    ? 'Company Wide' 
    : divisions.find(d => d.id === selectedDivision)?.name || 'Unknown Division';

  const monthProgress = calculateMonthProgress();
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const filteredDivisions = selectedDivision === 'company-wide' ? divisions : divisions.filter(d => d.id === selectedDivision);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Business KPIs - Matching Template */}
      <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Daily Data</h1>
              <p className="text-white/80 text-lg">Real-time daily submissions and performance tracking</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Current Period</div>
            <div className="text-xl font-bold">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div className="text-sm text-white/70">
              Day {new Date().getDate()} of {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}
            </div>
          </div>
        </div>

        {/* Revenue KPI Card in Header */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white/80 mb-2">Total Revenue</h3>
              <div className="text-3xl font-bold text-white mb-1">
                {formatCurrency(revenueMetrics.revenue)}
              </div>
              <div className="text-sm text-white/70">Monthly Target: {formatCurrency(revenueMetrics.target)}</div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/70">
              Progress: {revenueMetrics.percentToGoal}%
            </span>
            <div className="flex items-center text-white">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm font-semibold">+12%</span>
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-white transition-all duration-500"
                style={{
                  width: `${Math.min(revenueMetrics.percentToGoal, 100)}%`,
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

      {/* Controls and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Division View
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] bg-white"
              >
                <option value="company-wide">Company Wide</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">Current Period</div>
            <div className="text-lg font-bold text-gray-900">{monthName}</div>
            <div className="text-sm text-gray-500">
              Day {currentDate.getDate()} of {new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dailySubmissions.filter(s => s.isComplete).length}
            </div>
            <div className="text-sm text-gray-600">Completed Submissions</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dailySubmissions.reduce((sum, s) => 
                sum + s.entries.filter(e => e.status === 'active' && e.isSubmitted).reduce((entrySum, e) => entrySum + e.hoursBooked, 0), 0
              )}
            </div>
            <div className="text-sm text-gray-600">Total Hours Booked</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dailySubmissions.reduce((sum, s) => 
                sum + s.entries.filter(e => e.status === 'active' && e.isSubmitted).reduce((entrySum, e) => entrySum + e.newClients, 0), 0
              )}
            </div>
            <div className="text-sm text-gray-600">New Clients</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {(() => {
                const totalWorked = dailySubmissions.reduce((sum, s) => 
                  sum + s.entries.filter(e => e.status === 'active' && e.isSubmitted).reduce((entrySum, e) => entrySum + e.hoursWorked, 0), 0
                );
                const totalBooked = dailySubmissions.reduce((sum, s) => 
                  sum + s.entries.filter(e => e.status === 'active' && e.isSubmitted).reduce((entrySum, e) => entrySum + e.hoursBooked, 0), 0
                );
                return totalWorked > 0 ? Math.round((totalBooked / totalWorked) * 100) : 0;
              })()}%
            </div>
            <div className="text-sm text-gray-600">Avg Productivity</div>
          </div>
        </div>
      </div>

      {/* Division Scoreboard Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Division Daily Performance</h3>
            <div className="text-sm text-gray-600">
              {filteredDivisions.length} divisions • Real-time daily data
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDivisions.map(division => {
          const divisionEmployees = getDivisionEmployees(division.id);
          const dailyMetrics = calculateDivisionDailyMetrics(division.id);
          const hasSubmission = isDailySubmissionComplete(division.id, selectedDate);

          return (
            <div key={division.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 border-l-4" 
                 style={{ borderLeftColor: division.color }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-4"
                    style={{ backgroundColor: division.color }}
                  >
                    {division.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{division.name}</h3>
                    <p className="text-sm text-gray-600">{divisionEmployees.length} team members</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {hasSubmission ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                </div>
              </div>

              {/* Daily Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Hours Worked</p>
                      <p className="text-lg font-semibold">{dailyMetrics.hoursWorked}h</p>
                    </div>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Hours Booked</p>
                      <p className="text-lg font-semibold">{dailyMetrics.hoursBooked}h</p>
                    </div>
                    <Target className="h-4 w-4 text-green-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Service Revenue</p>
                      <p className="text-lg font-semibold">{formatCurrency(dailyMetrics.serviceRevenue)}</p>
                    </div>
                    <DollarSign className="h-4 w-4 text-purple-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Retail Sales</p>
                      <p className="text-lg font-semibold">{formatCurrency(dailyMetrics.retailSales)}</p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Productivity %</p>
                      <p className="text-lg font-semibold">{dailyMetrics.productivityPercent}%</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full`} 
                         style={{ backgroundColor: getScoreColor(getScoreLevel(dailyMetrics.productivityPercent, 85)) }} />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">New Clients</p>
                      <p className="text-lg font-semibold">{dailyMetrics.newClients}</p>
                    </div>
                    <Users className="h-4 w-4 text-indigo-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Consults</p>
                      <p className="text-lg font-semibold">{dailyMetrics.consults}</p>
                    </div>
                    <Award className="h-4 w-4 text-cyan-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Consult Converted</p>
                      <p className="text-lg font-semibold">{dailyMetrics.consultConverted}</p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Conversion %</p>
                      <p className="text-lg font-semibold">{dailyMetrics.conversionPercent}%</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full`} 
                         style={{ backgroundColor: getScoreColor(getScoreLevel(dailyMetrics.conversionPercent, 75)) }} />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Total Clients</p>
                      <p className="text-lg font-semibold">{dailyMetrics.totalClients}</p>
                    </div>
                    <Users className="h-4 w-4 text-pink-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600"># Prebooks</p>
                      <p className="text-lg font-semibold">{dailyMetrics.prebooks}</p>
                    </div>
                    <Calendar className="h-4 w-4 text-violet-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Prebook %</p>
                      <p className="text-lg font-semibold">{dailyMetrics.prebookPercent}%</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full`} 
                         style={{ backgroundColor: getScoreColor(getScoreLevel(dailyMetrics.prebookPercent, 75)) }} />
                  </div>
                </div>
              </div>

              {/* Daily Update Button */}
              <button
                onClick={() => handleOpenDailyForm(division.id)}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
                  hasSubmission
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : isDailyDataLocked && currentUser?.role !== 'admin'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={hasSubmission || (isDailyDataLocked && currentUser?.role !== 'admin')}
              >
                {hasSubmission ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Daily Data Submitted ✓
                  </>
                ) : isDailyDataLocked && currentUser?.role !== 'admin' ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Data Locked 🔒
                  </>
                ) : (
                  'Enter Daily Data'
                )}
              </button>
            </div>
          );
        })}
        </div>
      </div>

      {/* Daily Data Entry Modal */}
      {showDailyForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-[#ec4899] mr-2" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Daily Data Entry</h3>
                  <p className="text-gray-600">
                    {divisions.find(d => d.id === selectedFormDivision)?.name} - {new Date(selectedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDailyForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Date Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              />
            </div>

            {/* Submission Progress */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Progress</h4>
              <p className="text-lg font-semibold text-gray-900">
                {dailyEntries.filter(entry => entry.isSubmitted).length} of {dailyEntries.length} team members submitted
              </p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#ec4899] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${dailyEntries.length > 0 ? (dailyEntries.filter(entry => entry.isSubmitted).length / dailyEntries.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            {/* Employee Data Entry Table */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Worked</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Booked</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Revenue</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retail Sales</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productivity %</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Clients</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consults</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consult Converted</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion %</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Clients</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Prebooks</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prebook %</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyEntries.map((entry) => {
                    const employee = employees.find(emp => emp.id === entry.employeeId);
                    if (!employee) return null;

                    return (
                      <tr key={entry.employeeId}>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-500">{employee.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <select
                            value={entry.status}
                            onChange={(e) => updateDailyEntryStatus(entry.employeeId, e.target.value as 'active' | 'away' | 'sick' | 'not-booked')}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="away">Away</option>
                            <option value="sick">Sick</option>
                            <option value="not-booked">Not Booked</option>
                          </select>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={entry.hoursWorked}
                            onChange={(e) => updateDailyEntry(entry.employeeId, 'hoursWorked', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={entry.status !== 'active'}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={entry.hoursBooked}
                            onChange={(e) => updateDailyEntry(entry.employeeId, 'hoursBooked', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={entry.status !== 'active'}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={entry.serviceRevenue}
                            onChange={(e) => updateDailyEntry(entry.employeeId, 'serviceRevenue', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={entry.status !== 'active'}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={entry.retailSales}
                            onChange={(e) => updateDailyEntry(entry.employeeId, 'retailSales', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={entry.status !== 'active'}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="w-20 px-2 py-1 bg-gray-100 rounded text-sm text-center font-medium">
                            {entry.productivityPercentage}%
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={entry.newClients}
                            onChange={(e) => updateDailyEntry(entry.employeeId, 'newClients', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={entry.status !== 'active'}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={entry.consults}
                            onChange={(e) => updateDailyEntry(entry.employeeId, 'consults', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={entry.status !== 'active'}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={entry.consultConverted}
                            onChange={(e) => updateDailyEntry(entry.employeeId, 'consultConverted', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={entry.status !== 'active'}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="w-20 px-2 py-1 bg-gray-100 rounded text-sm text-center font-medium">
                            {entry.consultConversionPercentage}%
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={entry.totalClients}
                            onChange={(e) => updateDailyEntry(entry.employeeId, 'totalClients', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={entry.status !== 'active'}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={entry.prebooks}
                            onChange={(e) => updateDailyEntry(entry.employeeId, 'prebooks', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={entry.status !== 'active'}
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="w-20 px-2 py-1 bg-gray-100 rounded text-sm text-center font-medium">
                            {entry.prebookPercentage}%
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <button
                            onClick={() => submitEmployeeEntry(entry.employeeId)}
                            disabled={entry.isSubmitted}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              entry.isSubmitted
                                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                : entry.status === 'active'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {entry.isSubmitted ? 'Submitted ✓' : 'Submit'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDailyForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDailyEntries}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Daily Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;