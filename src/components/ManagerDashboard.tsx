import React, { useState, useMemo } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division, KPIData, User } from '../types/division';
import { formatCurrency } from '../utils/scoring';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Target, Award, 
  Calendar, Clock, BarChart3, AlertCircle, CheckCircle, 
  MessageSquare, Bell, Eye, X, ChevronRight, Building2,
  MapPin, Activity, Star, Zap, Filter, Grid, List
} from 'lucide-react';

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

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  targetRoles: string[];
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface ManagerDashboardProps {
  employees: Employee[];
  divisions: Division[];
  kpiData: KPIData[];
  employeeKPIData: EmployeeKPIData[];
  dailySubmissions: DailySubmission[];
  currentUser: User;
  onViewChange: (view: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  employees,
  divisions,
  kpiData,
  employeeKPIData,
  dailySubmissions,
  currentUser,
  onViewChange,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [showAnnouncements, setShowAnnouncements] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  
  // Annual goals for 2025
  const annualGoals = {
    totalRevenue: 6000000, // $6M annual target
    totalHoursBooked: 19200, // 1600 hours per month × 12
    newClients: 3600, // 300 per month × 12
    avgProductivity: 85, // 85% target
    serviceRevenue: 4200000, // 70% of total revenue
    retailSales: 1800000, // 30% of total revenue
  };

  // Sample announcements for managers
  const [announcements] = useState<Announcement[]>([
    {
      id: 'ann-001',
      title: '🎯 Q1 Performance Targets Released',
      message: 'New quarterly targets have been set for all divisions. Review your team\'s goals in the Performance section and schedule check-ins with team members.',
      type: 'info',
      targetRoles: ['admin', 'division-manager', 'executive'],
      createdBy: 'Chantel Allen',
      createdAt: new Date('2025-01-16T09:00:00'),
      priority: 'high',
      isRead: false,
    },
    {
      id: 'ann-002',
      title: '📊 Monthly Data Submission Reminder',
      message: 'Monthly KPI data submissions are due by the 25th. Ensure all division data is complete and accurate.',
      type: 'warning',
      targetRoles: ['division-manager'],
      createdBy: 'System',
      createdAt: new Date('2025-01-15T14:30:00'),
      expiresAt: new Date('2025-01-25T23:59:59'),
      priority: 'medium',
      isRead: false,
    },
    {
      id: 'ann-003',
      title: '🏆 Laser Division Exceeds Targets',
      message: 'Congratulations to the Laser Division for exceeding Q4 targets by 15%! Excellent work from the entire team.',
      type: 'success',
      targetRoles: ['admin', 'executive'],
      createdBy: 'Chantel Allen',
      createdAt: new Date('2025-01-14T16:45:00'),
      priority: 'low',
      isRead: false,
    },
  ]);

  // Calculate year-to-date metrics
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-based month

  // Business KPI calculations - Year to Date
  const businessKPIs = useMemo(() => {
    // Get all data for current year up to current month
    const ytdKPIData = kpiData.filter(data => 
      data.year === currentYear &&
      parseInt(data.month) <= currentMonth &&
      (selectedDivision === 'all' || data.divisionId === selectedDivision)
    );

    const ytdEmployeeData = employeeKPIData.filter(data => 
      data.year === currentYear &&
      parseInt(data.month) <= currentMonth &&
      (selectedDivision === 'all' || 
       employees.find(emp => emp.id === data.employeeId)?.divisionId === selectedDivision)
    );

    // Calculate YTD revenue from daily submissions
    const ytdDailyRevenue = dailySubmissions
      .filter(s => {
        const submissionDate = new Date(s.date);
        return submissionDate.getFullYear() === currentYear &&
               submissionDate.getMonth() < currentMonth; // Up to current month
      })
      .reduce((sum, submission) => {
        return sum + submission.entries
          .filter(entry => entry.status === 'active' && entry.isSubmitted)
          .reduce((entrySum, entry) => entrySum + entry.serviceRevenue + entry.retailSales, 0);
      }, 0);

    // Calculate YTD totals
    const ytdTotalRevenue = ytdDailyRevenue > 0 ? ytdDailyRevenue : 
      ytdKPIData.reduce((sum, data) => sum + (data.averageTicket * data.newClients), 0);

    const ytdNewClients = ytdKPIData.reduce((sum, data) => sum + data.newClients, 0);
    const ytdHoursBooked = ytdKPIData.reduce((sum, data) => sum + data.hoursSold, 0);
    
    // Calculate YTD averages
    const avgProductivity = ytdKPIData.length > 0 
      ? Math.round(ytdKPIData.reduce((sum, data) => sum + data.productivityRate, 0) / ytdKPIData.length)
      : 0;
    
    // Calculate YTD service and retail breakdown
    const ytdServiceRevenue = ytdDailyRevenue > 0 ? 
      dailySubmissions
        .filter(s => {
          const submissionDate = new Date(s.date);
          return submissionDate.getFullYear() === currentYear &&
                 submissionDate.getMonth() < currentMonth;
        })
        .reduce((sum, submission) => {
          return sum + submission.entries
            .filter(entry => entry.status === 'active' && entry.isSubmitted)
            .reduce((entrySum, entry) => entrySum + entry.serviceRevenue, 0);
        }, 0) :
      Math.round(ytdTotalRevenue * 0.7); // Estimate 70% service
    
    const ytdRetailSales = ytdTotalRevenue - ytdServiceRevenue;
    
    const avgRetailPercentage = ytdTotalRevenue > 0 
      ? Math.round((ytdRetailSales / ytdTotalRevenue) * 100)
      : 0;

    const activeEmployees = employees.filter(emp => 
      emp.isActive && 
      (selectedDivision === 'all' || emp.divisionId === selectedDivision)
    ).length;

    const avgHappiness = ytdEmployeeData.length > 0 
      ? Math.round(ytdEmployeeData.reduce((sum, data) => sum + data.happinessScore, 0) / ytdEmployeeData.length * 10) / 10
      : 0;

    // Calculate progress percentages against annual goals
    const revenueProgress = Math.round((ytdTotalRevenue / annualGoals.totalRevenue) * 100);
    const hoursProgress = Math.round((ytdHoursBooked / annualGoals.totalHoursBooked) * 100);
    const clientsProgress = Math.round((ytdNewClients / annualGoals.newClients) * 100);
    const productivityProgress = avgProductivity >= annualGoals.avgProductivity ? 100 : Math.round((avgProductivity / annualGoals.avgProductivity) * 100);

    return {
      ytdTotalRevenue,
      ytdServiceRevenue,
      ytdRetailSales,
      ytdNewClients,
      ytdHoursBooked,
      avgProductivity,
      avgRetailPercentage,
      activeEmployees,
      avgHappiness,
      activeDivisions: selectedDivision === 'all' ? divisions.length : 1,
      // Progress against annual goals
      revenueProgress,
      hoursProgress,
      clientsProgress,
      productivityProgress,
      // Annual goals for display
      annualGoals,
    };
  }, [kpiData, employeeKPIData, dailySubmissions, selectedDivision, employees, divisions]);

  // Calculate insights
  const insights = useMemo(() => {
    const insights: Array<{
      type: 'positive' | 'negative' | 'neutral';
      title: string;
      description: string;
      metric: string;
      change: number;
    }> = [];

    // YTD Revenue trend insight
    if (businessKPIs.revenueProgress > 100) {
      insights.push({
        type: 'positive',
        title: 'YTD Revenue Exceeding Annual Goal',
        description: 'Year-to-date revenue is ahead of annual target pace',
        metric: 'Revenue',
        change: businessKPIs.revenueProgress - 100,
      });
    } else if (businessKPIs.revenueProgress < 80) {
      insights.push({
        type: 'negative',
        title: 'YTD Revenue Behind Annual Goal',
        description: 'Year-to-date revenue is tracking below annual target pace',
        metric: 'Revenue',
        change: businessKPIs.revenueProgress - 100,
      });
    }

    // YTD Productivity insight
    if (businessKPIs.productivityProgress > 100) {
      insights.push({
        type: 'positive',
        title: 'Productivity Exceeding Annual Target',
        description: 'Year-to-date productivity is above annual target',
        metric: 'Productivity',
        change: businessKPIs.avgProductivity - businessKPIs.annualGoals.avgProductivity,
      });
    } else if (businessKPIs.productivityProgress < 80) {
      insights.push({
        type: 'negative',
        title: 'Productivity Below Annual Target',
        description: 'Year-to-date productivity needs improvement to meet annual goal',
        metric: 'Productivity',
        change: businessKPIs.avgProductivity - businessKPIs.annualGoals.avgProductivity,
      });
    }

    // Team happiness insight
    if (businessKPIs.avgHappiness > 8.5) {
      insights.push({
        type: 'positive',
        title: 'High Team Satisfaction',
        description: 'Employee happiness scores are excellent across the organization',
        metric: 'Happiness',
        change: 8,
      });
    }

    return insights;
  }, [businessKPIs]);

  // Division performance data
  const divisionPerformance = useMemo(() => {
    return divisions.map(division => {
      // Get YTD data for division
      const divisionYTDData = kpiData.filter(data => 
        data.divisionId === division.id && 
        data.year === currentYear &&
        parseInt(data.month) <= currentMonth
      );

      const divisionEmployees = employees.filter(emp => 
        emp.divisionId === division.id && emp.isActive
      );

      // Calculate YTD totals for division
      const ytdRevenue = divisionYTDData.reduce((sum, data) => sum + (data.averageTicket * data.newClients), 0);
      const ytdNewClients = divisionYTDData.reduce((sum, data) => sum + data.newClients, 0);
      const ytdHoursBooked = divisionYTDData.reduce((sum, data) => sum + data.hoursSold, 0);
      const avgProductivity = divisionYTDData.length > 0 
        ? Math.round(divisionYTDData.reduce((sum, data) => sum + data.productivityRate, 0) / divisionYTDData.length)
        : 0;
      const avgRetailPercentage = divisionYTDData.length > 0 
        ? Math.round(divisionYTDData.reduce((sum, data) => sum + data.retailPercentage, 0) / divisionYTDData.length)
        : 0;

      return {
        division,
        divisionYTDData: divisionYTDData[divisionYTDData.length - 1], // Most recent month for reference
        teamSize: divisionEmployees.length,
        ytdRevenue,
        ytdNewClients,
        ytdHoursBooked,
        avgProductivity,
        avgRetailPercentage,
      };
    }).sort((a, b) => b.ytdRevenue - a.ytdRevenue);
  }, [divisions, kpiData, employees, currentMonth, currentYear]);

  const filteredAnnouncements = announcements.filter(ann => 
    ann.targetRoles.includes(currentUser.role) && 
    (!ann.expiresAt || ann.expiresAt > new Date())
  );

  const dismissAnnouncement = (announcementId: string) => {
    // In real app, this would update the announcement's read status
    console.log('Dismissing announcement:', announcementId);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Business KPIs */}
      <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Executive Command Centre</h1>
              <p className="text-white/80 text-lg">Year-to-date performance vs annual goals</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Year-to-Date Progress</div>
            <div className="text-xl font-bold">
              {currentMonth} of 12 months
            </div>
            <div className="text-sm text-white/70">
              {Math.round((currentMonth / 12) * 100)}% through {currentYear}
            </div>
          </div>
        </div>

        {/* YTD KPI Cards in Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* YTD Revenue Card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">YTD Total Revenue</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(businessKPIs.ytdTotalRevenue)}
                </div>
                <div className="text-sm text-white/70">Annual Goal: {formatCurrency(businessKPIs.annualGoals.totalRevenue)}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">
                Progress: {businessKPIs.revenueProgress}% of annual goal
              </span>
              <div className="flex items-center text-white">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-semibold">+12%</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-white transition-all duration-500"
                  style={{
                    width: `${Math.min(businessKPIs.revenueProgress, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Manager Notifications */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-white mr-2" />
                <h3 className="text-sm font-medium text-white">Manager Notifications</h3>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/30 text-white">
                {filteredAnnouncements.filter(ann => !ann.isRead).length} new
              </span>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {filteredAnnouncements.slice(0, 2).map(announcement => (
                <div 
                  key={announcement.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h4 className="text-sm font-semibold text-white">{announcement.title}</h4>
                        <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          announcement.priority === 'high' ? 'bg-red-400/30 text-white' :
                          announcement.priority === 'medium' ? 'bg-yellow-400/30 text-white' :
                          'bg-blue-400/30 text-white'
                        }`}>
                          {announcement.priority}
                        </span>
                      </div>
                      <p className="text-xs text-white/80 line-clamp-2">{announcement.message}</p>
                      <div className="text-xs text-white/60 mt-1">
                        {announcement.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAnnouncement(announcement.id)}
                      className="ml-2 text-white/60 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredAnnouncements.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="h-6 w-6 text-white/60 mx-auto mb-2" />
                  <p className="text-sm text-white/80">No new notifications</p>
                </div>
              )}
            </div>
          </div>

          {/* Business Insights */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Zap className="h-5 w-5 text-white mr-2" />
              <h3 className="text-sm font-medium text-white">Business Insights</h3>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {insights.slice(0, 2).map((insight, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
                    <div className="flex items-center">
                      {insight.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-white mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-white mr-1" />
                      )}
                      <span className="text-xs font-bold text-white">
                        {insight.change > 0 ? '+' : ''}{insight.change}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-white/80 line-clamp-2">{insight.description}</p>
                  <div className="text-xs text-white/60 mt-1">
                    {insight.metric}
                  </div>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-center py-4">
                  <Target className="h-6 w-6 text-white/60 mx-auto mb-2" />
                  <p className="text-sm text-white/80">All metrics on track</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* YTD Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Year-to-Date Performance Summary</h3>
            <div className="text-sm text-gray-600">
              {currentMonth} months completed • {Math.round((currentMonth / 12) * 100)}% through {currentYear}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(businessKPIs.ytdTotalRevenue)}</div>
            <div className="text-sm text-gray-600">YTD Revenue</div>
            <div className="text-xs text-gray-500 mt-1">
              {businessKPIs.revenueProgress}% of {formatCurrency(businessKPIs.annualGoals.totalRevenue)} goal
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{businessKPIs.ytdHoursBooked.toLocaleString()}h</div>
            <div className="text-sm text-gray-600">YTD Hours Booked</div>
            <div className="text-xs text-gray-500 mt-1">
              {businessKPIs.hoursProgress}% of {businessKPIs.annualGoals.totalHoursBooked.toLocaleString()}h goal
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{businessKPIs.ytdNewClients.toLocaleString()}</div>
            <div className="text-sm text-gray-600">YTD New Clients</div>
            <div className="text-xs text-gray-500 mt-1">
              {businessKPIs.clientsProgress}% of {businessKPIs.annualGoals.newClients.toLocaleString()} goal
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{businessKPIs.avgProductivity}%</div>
            <div className="text-sm text-gray-600">YTD Avg Productivity</div>
            <div className="text-xs text-gray-500 mt-1">
              Target: {businessKPIs.annualGoals.avgProductivity}%
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Division Filter
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] bg-white"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'cards' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4 mr-2" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'compact' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
                }`}
              >
                <List className="h-4 w-4 mr-2" />
                Compact
              </button>
            </div>

            <button
              onClick={() => onViewChange('financials')}
              className="flex items-center px-4 py-2 bg-[#0c5b63] text-white rounded-lg hover:bg-[#0f6b73] transition-colors"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Business KPIs
            </button>
          </div>
        </div>
      </div>

      {/* Division Performance Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Division YTD Performance Overview</h3>
            <div className="text-sm text-gray-600">
              {businessKPIs.activeDivisions} active divisions • {businessKPIs.activeEmployees} team members
            </div>
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {divisionPerformance.map(divData => (
                <div 
                  key={divData.division.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-4"
                      style={{ backgroundColor: divData.division.color }}
                    >
                      {divData.division.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{divData.division.name}</h4>
                      <p className="text-sm text-gray-600">{divData.teamSize} team members</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">YTD Revenue:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(divData.ytdRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">YTD Productivity:</span>
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900">{divData.avgProductivity}%</span>
                        <div className={`ml-2 w-2 h-2 rounded-full ${
                          divData.avgProductivity >= 90 ? 'bg-green-500' :
                          divData.avgProductivity >= 80 ? 'bg-yellow-500' :
                          divData.avgProductivity >= 70 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">YTD New Clients:</span>
                      <span className="font-semibold text-gray-900">{divData.ytdNewClients}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">YTD Hours Booked:</span>
                      <span className="font-semibold text-gray-900">{divData.ytdHoursBooked}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">YTD Retail %:</span>
                      <span className="font-semibold text-gray-900">{divData.avgRetailPercentage}%</span>
                    </div>
                  </div>

                  {/* Division Actions */}
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <button
                      onClick={() => onViewChange('daily-data')}
                      className="w-full px-3 py-2 bg-[#0c5b63] text-white rounded-lg hover:bg-[#0f6b73] text-sm flex items-center justify-center transition-colors"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Enter Daily Data
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        <span>Active Division</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{divData.teamSize} members</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YTD Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YTD Productivity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YTD New Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YTD Hours Booked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {divisionPerformance.map(divData => (
                  <tr key={divData.division.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium mr-3"
                          style={{ backgroundColor: divData.division.color }}
                        >
                          {divData.division.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{divData.division.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {divData.teamSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(divData.ytdRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{divData.avgProductivity}%</span>
                        <div className={`ml-2 w-2 h-2 rounded-full ${
                          divData.avgProductivity >= 90 ? 'bg-green-500' :
                          divData.avgProductivity >= 80 ? 'bg-yellow-500' :
                          divData.avgProductivity >= 70 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {divData.ytdNewClients}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {divData.ytdHoursBooked}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onViewChange('manager-kpis')}
                        className="text-[#f4647d] hover:text-[#fd8585] flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View KPIs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onViewChange('daily-data')}
            className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            <Calendar className="h-6 w-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Daily Data</div>
              <div className="text-sm text-white/80">Enter daily metrics</div>
            </div>
          </button>

          <button
            onClick={() => onViewChange('employees')}
            className="flex items-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
          >
            <Users className="h-6 w-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Team Management</div>
              <div className="text-sm text-white/80">Manage employees</div>
            </div>
          </button>

          <button
            onClick={() => onViewChange('financials')}
            className="flex items-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
          >
            <BarChart3 className="h-6 w-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Business KPIs</div>
              <div className="text-sm text-white/80">Financial metrics</div>
            </div>
          </button>

          <button
            onClick={() => onViewChange('scheduling-calendar')}
            className="flex items-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          >
            <Clock className="h-6 w-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Scheduling</div>
              <div className="text-sm text-white/80">Manage schedules</div>
            </div>
          </button>
        </div>
      </div>

      {/* Team Status Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">YTD Team Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{businessKPIs.activeEmployees}</div>
            <div className="text-sm text-gray-600">Active Employees</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{businessKPIs.activeDivisions}</div>
            <div className="text-sm text-gray-600">Active Divisions</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(businessKPIs.ytdServiceRevenue)}</div>
            <div className="text-sm text-gray-600">YTD Service Revenue</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(businessKPIs.ytdRetailSales)}</div>
            <div className="text-sm text-gray-600">YTD Retail Sales</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;