import React, { useState, useMemo } from 'react';
import { Employee, EmployeeKPIData, EmployeeTarget, EmployeeGoal, CustomGoal, KPIGoal, MonthlyCheckIn, TrainingRequest, TrainingPlan, PerformanceReview } from '../types/employee';
import { Division, User } from '../types/division';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useKPIManagement } from '../hooks/useKPIManagement';
import { formatCurrency } from '../utils/scoring';
import { 
  Calendar, Target, Users, TrendingUp, CheckCircle, AlertCircle, 
  Clock, Plus, Edit, Save, X, Eye, Download, FileText, Star,
  Award, BarChart3, User as UserIcon, Filter, Search, Grid,
  List, Settings, Zap, Shield, Activity, MapPin, Building2,
  BookOpen, Lightbulb, MessageSquare, ThumbsUp, ThumbsDown, TrendingDown,
  Lock, Unlock, Send, RefreshCw, ChevronDown, ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MonthlyCheckInPageProps {
  employees: Employee[];
  divisions: Division[];
  currentUser: User;
  employeeKPIData: EmployeeKPIData[];
  employeeTargets: EmployeeTarget[];
  goals: EmployeeTarget[];
  divisionTargets: any[];
  kpiData: any[];
  selectedMonth: string;
  selectedYear: number;
  onUpdateEmployee: (employee: Employee) => void;
  onUpdateTarget: (target: EmployeeTarget) => void;
  onUpdateDivisionTarget: (target: any) => void;
}

const MonthlyCheckInPage: React.FC<MonthlyCheckInPageProps> = ({
  employees,
  divisions,
  currentUser,
  employeeKPIData,
  employeeTargets,
  selectedMonth,
  selectedYear,
  onUpdateEmployee,
  onUpdateTarget,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'check-ins' | 'performance-plans' | 'insights' | 'annual-tracking'>('overview');
  const [selectedMetricsManager, setSelectedMetricsManager] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Modal states
  const [showCheckInForm, setShowCheckInForm] = useState<boolean>(false);
  const [showPerformancePlan, setShowPerformancePlan] = useState<boolean>(false);
  const [showKPISelector, setShowKPISelector] = useState<boolean>(false);
  const [showCustomGoalForm, setShowCustomGoalForm] = useState<boolean>(false);
  const [showTrainingRequest, setShowTrainingRequest] = useState<boolean>(false);
  const [showResultFeedback, setShowResultFeedback] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form states
  const [checkInForm, setCheckInForm] = useState<Partial<MonthlyCheckIn>>({});
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [kpiTargets, setKpiTargets] = useState<Record<string, number>>({});
  const [customGoals, setCustomGoals] = useState<CustomGoal[]>([]);
  const [trainingForm, setTrainingForm] = useState<Partial<TrainingRequest>>({});
  const [feedbackForm, setFeedbackForm] = useState<any>({});

  // Data storage
  const [monthlyCheckIns, setMonthlyCheckIns] = useLocalStorage<MonthlyCheckIn[]>('monthlyCheckIns', []);
  const [employeeGoals, setEmployeeGoals] = useLocalStorage<EmployeeGoal[]>('employeeGoals', []);
  const [trainingRequests, setTrainingRequests] = useLocalStorage<TrainingRequest[]>('trainingRequests', []);
  const [performanceReviews, setPerformanceReviews] = useLocalStorage<PerformanceReview[]>('performanceReviews', []);

  const { kpiDefinitions, getDivisionKPIs, getKPITarget } = useKPIManagement();

  // Calculate due dates
  const calculateDueDates = (month: string, year: number) => {
    const monthNum = parseInt(month) - 1;
    
    // Goals due: Last Friday of the month
    const lastDayOfMonth = new Date(year, monthNum + 1, 0);
    const lastFriday = new Date(lastDayOfMonth);
    while (lastFriday.getDay() !== 5) {
      lastFriday.setDate(lastFriday.getDate() - 1);
    }
    
    // Results due: First Friday of next month
    const firstDayOfNextMonth = new Date(year, monthNum + 1, 1);
    const firstFriday = new Date(firstDayOfNextMonth);
    while (firstFriday.getDay() !== 5) {
      firstFriday.setDate(firstFriday.getDate() + 1);
    }
    
    return { goalsDue: lastFriday, resultsDue: firstFriday };
  };

  const { goalsDue, resultsDue } = calculateDueDates(selectedMonth, selectedYear);
  const now = new Date();
  const isGoalsLocked = now > goalsDue;
  const isResultsLocked = now > resultsDue;

  // Get metrics managers
  const metricsManagers = employees.filter(emp => 
    emp.category === 'management' && emp.isActive
  );

  // Filter employees by metrics manager
  const filteredEmployees = useMemo(() => {
    let filtered = employees.filter(emp => emp.isActive);
    
    if (selectedMetricsManager !== 'all') {
      filtered = filtered.filter(emp => emp.metricsManagerId === selectedMetricsManager);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [employees, selectedMetricsManager, searchTerm]);

  // Get employee's current goals
  const getEmployeeGoals = (employeeId: string) => {
    return employeeGoals.find(goal => 
      goal.employeeId === employeeId && 
      goal.month === selectedMonth && 
      goal.year === selectedYear
    );
  };

  // Get employee's check-in
  const getEmployeeCheckIn = (employeeId: string) => {
    return monthlyCheckIns.find(checkIn => 
      checkIn.employeeId === employeeId && 
      checkIn.month === selectedMonth && 
      checkIn.year === selectedYear
    );
  };

  // Calculate performance score
  const calculatePerformanceScore = (employeeId: string): number => {
    const empData = employeeKPIData.find(data => 
      data.employeeId === employeeId && 
      data.month === selectedMonth && 
      data.year === selectedYear
    );

    if (!empData) return 0;

    const metrics = [
      empData.productivityRate,
      empData.retailPercentage,
      empData.happinessScore * 10,
      empData.attendanceRate,
    ];

    return Math.round(metrics.reduce((sum, val) => sum + val, 0) / metrics.length);
  };

  // Handle opening monthly check-in
  const handleOpenCheckIn = (employee: Employee) => {
    setSelectedEmployee(employee);
    const existingCheckIn = getEmployeeCheckIn(employee.id);
    
    if (existingCheckIn) {
      setCheckInForm(existingCheckIn);
    } else {
      setCheckInForm({
        employeeId: employee.id,
        month: selectedMonth,
        year: selectedYear,
        submissionDeadline: goalsDue,
        resultsDeadline: resultsDue,
        status: 'draft',
        isLocked: false,
        createdBy: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    setShowCheckInForm(true);
  };

  // Handle opening goal setting
  const handleOpenGoalSetting = (employee: Employee) => {
    setSelectedEmployee(employee);
    const existingGoals = getEmployeeGoals(employee.id);
    
    if (existingGoals) {
      setSelectedKPIs(existingGoals.kpiGoals.map(goal => goal.kpiKey));
      setKpiTargets(existingGoals.kpiGoals.reduce((acc, goal) => ({
        ...acc,
        [goal.kpiKey]: goal.targetValue
      }), {}));
      setCustomGoals(existingGoals.customGoals);
    } else {
      setSelectedKPIs([]);
      setKpiTargets({});
      setCustomGoals([]);
    }
    setShowKPISelector(true);
  };

  // Handle opening performance plan
  const handleOpenPerformancePlan = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowPerformancePlan(true);
  };

  // Handle opening result feedback
  const handleOpenResultFeedback = (employee: Employee) => {
    setSelectedEmployee(employee);
    const goals = getEmployeeGoals(employee.id);
    
    setFeedbackForm({
      employeeId: employee.id,
      month: selectedMonth,
      year: selectedYear,
      goals: goals?.kpiGoals || [],
      customGoals: goals?.customGoals || [],
      overallRating: 5,
      managerComments: '',
      employeeComments: '',
    });
    setShowResultFeedback(true);
  };

  // Save KPI goals
  const handleSaveKPIGoals = () => {
    if (!selectedEmployee || selectedKPIs.length < 2) {
      alert('Please select at least 2 KPIs');
      return;
    }

    const kpiGoals: KPIGoal[] = selectedKPIs.map(kpiKey => {
      const kpiDef = kpiDefinitions.find(kpi => kpi.id === kpiKey);
      const minTarget = getKPITarget(selectedEmployee.divisionId, kpiKey);
      const customTarget = kpiTargets[kpiKey] || minTarget;

      return {
        id: `kpi-goal-${Date.now()}-${kpiKey}`,
        kpiKey,
        kpiName: kpiDef?.name || 'Unknown KPI',
        targetValue: customTarget,
        unit: kpiDef?.unit || '',
        progress: 0,
        isAchieved: false,
        notes: '',
      };
    });

    const newGoals: EmployeeGoal = {
      id: `goals-${selectedEmployee.id}-${selectedMonth}-${selectedYear}`,
      employeeId: selectedEmployee.id,
      month: selectedMonth,
      year: selectedYear,
      customGoals,
      kpiGoals,
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedBy: currentUser.id,
      status: 'draft',
      isLocked: false,
    };

    setEmployeeGoals(prev => {
      const filtered = prev.filter(goal => 
        !(goal.employeeId === selectedEmployee.id && 
          goal.month === selectedMonth && 
          goal.year === selectedYear)
      );
      return [...filtered, newGoals];
    });

    setShowKPISelector(false);
    setSelectedKPIs([]);
    setKpiTargets({});
    setCustomGoals([]);
  };

  // Save monthly check-in
  const handleSaveCheckIn = () => {
    if (!selectedEmployee || !checkInForm.checkInData) {
      alert('Please complete the check-in form');
      return;
    }

    const newCheckIn: MonthlyCheckIn = {
      ...checkInForm,
      id: `checkin-${selectedEmployee.id}-${selectedMonth}-${selectedYear}`,
      employeeId: selectedEmployee.id,
      month: selectedMonth,
      year: selectedYear,
      updatedAt: new Date(),
    } as MonthlyCheckIn;

    setMonthlyCheckIns(prev => {
      const filtered = prev.filter(checkIn => 
        !(checkIn.employeeId === selectedEmployee.id && 
          checkIn.month === selectedMonth && 
          checkIn.year === selectedYear)
      );
      return [...filtered, newCheckIn];
    });

    setShowCheckInForm(false);
    setCheckInForm({});
  };

  // Export PDF
  const exportToPDF = async (employee: Employee, type: 'check-in' | 'performance-plan' | 'goals') => {
    const element = document.getElementById(`pdf-content-${type}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const fileName = `${employee.name.replace(' ', '_')}_${type}_${selectedMonth}_${selectedYear}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Get risk level and color
  const getRiskLevel = (score: number): { level: string; color: string; bgColor: string } => {
    if (score >= 100) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 80) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Due Dates */}
      <div className="bg-gradient-to-r from-[#F8708A] to-[#F8708A] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Monthly Employee Check-in</h1>
              <p className="text-white/80 text-lg">Goal setting and performance review system</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Current Period</div>
            <div className="text-xl font-bold">
              {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div className="text-sm text-white/70">
              Day {new Date().getDate()} of {new Date(selectedYear, parseInt(selectedMonth), 0).getDate()}
            </div>
          </div>
        </div>

        {/* Due Dates Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Goals Due Date</h3>
                <div className="text-2xl font-bold text-white mb-1">
                  {goalsDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-sm text-white/70">Last Friday of month</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  {isGoalsLocked ? (
                    <Lock className="w-6 h-6 text-white" />
                  ) : (
                    <Target className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
            </div>
            <div className={`text-sm ${isGoalsLocked ? 'text-red-200' : 'text-green-200'}`}>
              {isGoalsLocked ? 'Goals Locked' : 'Goals Open'}
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Results Due Date</h3>
                <div className="text-2xl font-bold text-white mb-1">
                  {resultsDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-sm text-white/70">First Friday of next month</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  {isResultsLocked ? (
                    <Lock className="w-6 h-6 text-white" />
                  ) : (
                    <MessageSquare className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>
            </div>
            <div className={`text-sm ${isResultsLocked ? 'text-red-200' : 'text-green-200'}`}>
              {isResultsLocked ? 'Results Locked' : 'Results Open'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Employee Overview', icon: Users },
              { id: 'check-ins', label: 'Monthly Check-ins', icon: Calendar },
              { id: 'performance-plans', label: 'Performance Plans', icon: Target },
              { id: 'insights', label: 'Performance Insights', icon: BarChart3 },
              { id: 'annual-tracking', label: 'Annual Goal Tracking', icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-[#F8708A] text-[#F8708A]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F8708A] w-64"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Metrics Manager
              </label>
              <select
                value={selectedMetricsManager}
                onChange={(e) => setSelectedMetricsManager(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F8708A] bg-white"
              >
                <option value="all">All Managers</option>
                {metricsManagers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'cards' ? 'bg-white text-[#F8708A] shadow-sm' : 'text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4 mr-2" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'table' ? 'bg-white text-[#F8708A] shadow-sm' : 'text-gray-600'
                }`}
              >
                <List className="h-4 w-4 mr-2" />
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(employee => {
                const division = divisions.find(d => d.id === employee.divisionId);
                const performanceScore = calculatePerformanceScore(employee.id);
                const riskAssessment = getRiskLevel(performanceScore);
                const goals = getEmployeeGoals(employee.id);
                const checkIn = getEmployeeCheckIn(employee.id);
                const isExpanded = expandedCards[employee.id];

                return (
                  <div 
                    key={employee.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border-l-4 overflow-hidden"
                    style={{ borderLeftColor: division?.color }}
                  >
                    {/* Employee Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center mb-4">
                        <div 
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold mr-4"
                          style={{ backgroundColor: division?.color }}
                        >
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                          <p className="text-xs text-gray-500">{division?.name}</p>
                        </div>
                        <button
                          onClick={() => setExpandedCards(prev => ({ ...prev, [employee.id]: !isExpanded }))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </button>
                      </div>

                      {/* Performance Score */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${riskAssessment.bgColor}`}>
                            <span className={`text-lg font-bold ${riskAssessment.color}`}>
                              {performanceScore}%
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Performance Score</div>
                            <div className={`text-xs font-medium ${riskAssessment.color}`}>
                              {riskAssessment.level} Risk
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            {goals ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="text-xs text-gray-600">
                              {goals ? 'Goals Set' : 'No Goals'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            {checkIn ? (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-xs text-gray-600">
                              {checkIn ? 'Check-in Done' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600">Experience</div>
                          <div className="text-sm font-medium text-gray-900">{employee.experienceLevel}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600">Hire Date</div>
                          <div className="text-sm font-medium text-gray-900">
                            {employee.hireDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="space-y-4 border-t border-gray-100 pt-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="text-xs text-blue-600">Goals Status</div>
                              <div className="text-sm font-medium text-blue-900">
                                {goals ? `${goals.kpiGoals.length} KPI + ${goals.customGoals.length} Custom` : 'Not Set'}
                              </div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3">
                              <div className="text-xs text-purple-600">Check-in Status</div>
                              <div className="text-sm font-medium text-purple-900">
                                {checkIn?.status.replace('-', ' ').toUpperCase() || 'Not Started'}
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">Locations</div>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.locations?.join(', ') || 'Not assigned'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 pb-6 space-y-2">
                      <button
                        onClick={() => handleOpenCheckIn(employee)}
                        disabled={isGoalsLocked && currentUser.role !== 'admin'}
                        className="w-full px-3 py-2 bg-[#F8708A] text-white rounded-lg hover:bg-[#F8708A]/90 text-sm flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Monthly Check-In
                      </button>
                      
                      <button
                        onClick={() => handleOpenGoalSetting(employee)}
                        disabled={isGoalsLocked && currentUser.role !== 'admin'}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Goal Setting
                      </button>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowTrainingRequest(true);
                          }}
                          className="px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs flex items-center justify-center"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          Training
                        </button>
                        
                        <button
                          onClick={() => handleOpenPerformancePlan(employee)}
                          className="px-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs flex items-center justify-center"
                        >
                          <Lightbulb className="h-3 w-3 mr-1" />
                          Plan
                        </button>
                        
                        <button
                          onClick={() => handleOpenResultFeedback(employee)}
                          disabled={isResultsLocked && currentUser.role !== 'admin'}
                          className="px-2 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-xs flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Goals Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.map(employee => {
                      const division = divisions.find(d => d.id === employee.divisionId);
                      const performanceScore = calculatePerformanceScore(employee.id);
                      const riskAssessment = getRiskLevel(performanceScore);
                      const goals = getEmployeeGoals(employee.id);
                      const checkIn = getEmployeeCheckIn(employee.id);

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
                            <div className="flex items-center">
                              <span className={`text-lg font-bold ${riskAssessment.color}`}>
                                {performanceScore}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskAssessment.bgColor} ${riskAssessment.color}`}>
                              {riskAssessment.level} Risk
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {goals ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">Set</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-amber-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">Pending</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {checkIn ? (
                              <div className="flex items-center text-blue-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm capitalize">{checkIn.status.replace('-', ' ')}</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-400">
                                <Clock className="h-4 w-4 mr-1" />
                                <span className="text-sm">Not Started</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleOpenCheckIn(employee)}
                                className="text-[#F8708A] hover:text-[#F8708A]/80"
                              >
                                <Calendar className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOpenGoalSetting(employee)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Target className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOpenResultFeedback(employee)}
                                className="text-orange-600 hover:text-orange-800"
                              >
                                <MessageSquare className="h-4 w-4" />
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

      {/* Check-ins Tab */}
      {activeTab === 'check-ins' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Check-in Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {['draft', 'goals-submitted', 'results-pending', 'completed'].map(status => {
                const count = monthlyCheckIns.filter(checkIn => 
                  checkIn.status === status && 
                  checkIn.month === selectedMonth && 
                  checkIn.year === selectedYear
                ).length;

                return (
                  <div key={status} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Performance Plans Tab */}
      {activeTab === 'performance-plans' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quarterly Performance Plans</h3>
            
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Performance Plans</h4>
              <p className="text-gray-500">
                Quarterly performance planning and review system
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights & Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(employee => {
                const performanceScore = calculatePerformanceScore(employee.id);
                const riskAssessment = getRiskLevel(performanceScore);
                const division = divisions.find(d => d.id === employee.divisionId);

                return (
                  <div key={employee.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-3"
                        style={{ backgroundColor: division?.color }}
                      >
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{employee.name}</h4>
                        <p className="text-sm text-gray-600">{employee.position}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Performance Score:</span>
                        <span className={`text-lg font-bold ${riskAssessment.color}`}>
                          {performanceScore}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Risk Level:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskAssessment.bgColor} ${riskAssessment.color}`}>
                          {riskAssessment.level}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setActiveTab('insights');
                      }}
                      className="w-full mt-4 px-3 py-2 bg-[#F8708A] text-white rounded-lg hover:bg-[#F8708A]/90 text-sm flex items-center justify-center"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Insights
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Annual Tracking Tab */}
      {activeTab === 'annual-tracking' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Annual Goal Tracking</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEmployees.slice(0, 6).map(employee => {
                // Mock yearly achievement data
                const yearlyAchievements = Array.from({ length: 12 }, (_, i) => ({
                  month: (i + 1).toString().padStart(2, '0'),
                  status: Math.random() > 0.7 ? 'achieved' : Math.random() > 0.5 ? 'partial' : Math.random() > 0.3 ? 'missed' : 'no-goals',
                  achievement: Math.round(Math.random() * 100),
                  totalGoals: Math.floor(Math.random() * 5) + 2,
                  achievedGoals: Math.floor(Math.random() * 3) + 1,
                }));

                const successRate = yearlyAchievements.filter(m => m.status === 'achieved').length / 12 * 100;

                return (
                  <div key={employee.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                          style={{ backgroundColor: divisions.find(d => d.id === employee.divisionId)?.color }}
                        >
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{employee.name}</h4>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{successRate.toFixed(0)}%</div>
                        <div className="text-xs text-gray-500">Success Rate</div>
                      </div>
                    </div>

                    {/* 12-Month Grid */}
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      {yearlyAchievements.map((month, index) => (
                        <div
                          key={index}
                          className={`w-8 h-8 rounded flex items-center justify-center ${
                            month.status === 'achieved' ? 'bg-green-500' :
                            month.status === 'partial' ? 'bg-yellow-500' :
                            month.status === 'missed' ? 'bg-red-500' :
                            'bg-gray-300'
                          }`}
                          title={`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][index]} ${selectedYear}: ${month.status}`}
                        >
                          {month.status === 'achieved' ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : month.status === 'partial' ? (
                            <Clock className="h-4 w-4 text-white" />
                          ) : month.status === 'missed' ? (
                            <X className="h-4 w-4 text-white" />
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                      {yearlyAchievements.filter(m => m.status === 'achieved').length} achieved • 
                      {yearlyAchievements.filter(m => m.status === 'partial').length} partial • 
                      {yearlyAchievements.filter(m => m.status === 'missed').length} missed
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Check-In Modal */}
      {showCheckInForm && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-[#F8708A] mr-2" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Monthly Check-In</h3>
                  <p className="text-gray-600">{selectedEmployee.name} - {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => exportToPDF(selectedEmployee, 'check-in')}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </button>
                <button
                  onClick={() => setShowCheckInForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div id="pdf-content-check-in" className="space-y-6">
              {/* Goals Progress */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Goals Progress Review</h4>
                <textarea
                  value={checkInForm.checkInData?.goalsProgress || ''}
                  onChange={(e) => setCheckInForm(prev => ({
                    ...prev,
                    checkInData: {
                      ...prev.checkInData,
                      goalsProgress: e.target.value
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F8708A]"
                  rows={4}
                  placeholder="Describe progress on your monthly goals..."
                />
              </div>

              {/* What's Working */}
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
                  What's Working Well
                </h4>
                <textarea
                  value={checkInForm.checkInData?.whatsWorking || ''}
                  onChange={(e) => setCheckInForm(prev => ({
                    ...prev,
                    checkInData: {
                      ...prev.checkInData,
                      whatsWorking: e.target.value
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="What strategies, processes, or approaches are working well for you?"
                />
              </div>

              {/* What's Not Working */}
              <div className="bg-red-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ThumbsDown className="h-5 w-5 text-red-600 mr-2" />
                  What's Not Working
                </h4>
                <textarea
                  value={checkInForm.checkInData?.whatsNotWorking || ''}
                  onChange={(e) => setCheckInForm(prev => ({
                    ...prev,
                    checkInData: {
                      ...prev.checkInData,
                      whatsNotWorking: e.target.value
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="What challenges or obstacles are you facing?"
                />
              </div>

              {/* Support Needed */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  Support & Resources Needed
                </h4>
                <textarea
                  value={checkInForm.checkInData?.nextSteps || ''}
                  onChange={(e) => setCheckInForm(prev => ({
                    ...prev,
                    checkInData: {
                      ...prev.checkInData,
                      nextSteps: e.target.value
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="What support, resources, or training do you need to hit your goals?"
                />
              </div>

              {/* Manager Notes */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                  Manager Notes & Feedback
                </h4>
                <textarea
                  value={checkInForm.checkInData?.managerNotes || ''}
                  onChange={(e) => setCheckInForm(prev => ({
                    ...prev,
                    checkInData: {
                      ...prev.checkInData,
                      managerNotes: e.target.value
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Manager feedback and notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowCheckInForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCheckIn}
                className="px-4 py-2 bg-[#F8708A] text-white rounded-md hover:bg-[#F8708A]/90 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Check-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Selector Modal */}
      {showKPISelector && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
          <div className="relative top-8 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Target className="h-6 w-6 text-[#F8708A] mr-2" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Goal Setting - {selectedEmployee.name}</h3>
                  <p className="text-gray-600">Select 2-3 KPIs and set custom goals</p>
                </div>
              </div>
              <button
                onClick={() => setShowKPISelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* KPI Selection */}
              <div className="bg-[#F8708A]/10 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Select KPIs (2-3 required)</h4>
                  <div className="text-sm text-gray-600">
                    Selected: {selectedKPIs.length}/3
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getDivisionKPIs(selectedEmployee.divisionId).map(kpi => {
                    const isSelected = selectedKPIs.includes(kpi.id);
                    const minTarget = getKPITarget(selectedEmployee.divisionId, kpi.id);
                    const customTarget = kpiTargets[kpi.id] || minTarget;

                    return (
                      <div 
                        key={kpi.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-[#F8708A] bg-[#F8708A]/10' 
                            : 'border-gray-200 hover:border-blue-300 bg-white'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedKPIs(prev => prev.filter(id => id !== kpi.id));
                            setKpiTargets(prev => {
                              const updated = { ...prev };
                              delete updated[kpi.id];
                              return updated;
                            });
                          } else if (selectedKPIs.length < 3) {
                            setSelectedKPIs(prev => [...prev, kpi.id]);
                            setKpiTargets(prev => ({ ...prev, [kpi.id]: minTarget }));
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{kpi.name}</h5>
                          {isSelected && <CheckCircle className="h-5 w-5 text-[#F8708A]" />}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{kpi.description}</p>
                        
                        {isSelected && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Min Target:</span>
                              <span className="font-medium">{minTarget}{kpi.unit}</span>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Custom Target:</label>
                              <input
                                type="number"
                                step="0.1"
                                min={minTarget}
                                value={customTarget}
                                onChange={(e) => setKpiTargets(prev => ({
                                  ...prev,
                                  [kpi.id]: parseFloat(e.target.value) || minTarget
                                }))}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#F8708A]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Goals */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Custom Goals (up to 3)</h4>
                  <button
                    onClick={() => setShowCustomGoalForm(true)}
                    disabled={customGoals.length >= 3}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                  </button>
                </div>

                <div className="space-y-3">
                  {customGoals.map((goal, index) => (
                    <div key={goal.id} className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{goal.title}</h5>
                        <button
                          onClick={() => setCustomGoals(prev => prev.filter(g => g.id !== goal.id))}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span className="capitalize">{goal.category} • {goal.priority} priority</span>
                        <span>{goal.measurementMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Message */}
              {selectedKPIs.length < 2 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm">Please select at least 2 KPIs to continue</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowKPISelector(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKPIGoals}
                  disabled={selectedKPIs.length < 2}
                  className="px-4 py-2 bg-[#F8708A] text-white rounded-md hover:bg-[#F8708A]/90 disabled:bg-gray-400 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Goals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Goal Form Modal */}
      {showCustomGoalForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-70">
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Custom Goal</h3>
              <button
                onClick={() => setShowCustomGoalForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a clear, specific goal title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the goal in detail"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="performance">Performance</option>
                    <option value="development">Development</option>
                    <option value="behavior">Behavior</option>
                    <option value="project">Project</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How will this be measured?</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Define how success will be measured"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCustomGoalForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add custom goal logic
                  setShowCustomGoalForm(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Plan Modal */}
      {showPerformancePlan && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Lightbulb className="h-6 w-6 text-purple-600 mr-2" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Quarterly Performance Plan</h3>
                  <p className="text-gray-600">{selectedEmployee.name} - Q{Math.ceil(parseInt(selectedMonth) / 3)} {selectedYear}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => exportToPDF(selectedEmployee, 'performance-plan')}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </button>
                <button
                  onClick={() => setShowPerformancePlan(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div id="pdf-content-performance-plan" className="space-y-6">
              {/* Previous Quarter Review */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Previous Quarter Review</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Key Achievements</h5>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="What were the major accomplishments?"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Challenges Faced</h5>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="What obstacles were encountered?"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Lessons Learned</h5>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Key insights and learnings"
                    />
                  </div>
                </div>
              </div>

              {/* Upcoming Quarter Goals */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Quarter Goals</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Performance Objectives</h5>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="What performance goals will be focused on?"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Development Focus</h5>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="What skills or areas will be developed?"
                    />
                  </div>
                </div>
              </div>

              {/* Support & Resources */}
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Support & Resources Plan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Training & Development</h5>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="What training or development is planned?"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Manager Support</h5>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="How will management support these goals?"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPerformancePlan(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Performance Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Feedback Modal */}
      {showResultFeedback && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <MessageSquare className="h-6 w-6 text-orange-600 mr-2" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Result Feedback</h3>
                  <p className="text-gray-600">{selectedEmployee.name} - {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <button
                onClick={() => setShowResultFeedback(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Goal Selection */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Goal to Review</h4>
                <select
                  value={feedbackForm.selectedGoalId || ''}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, selectedGoalId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a goal</option>
                  {feedbackForm.goals?.map((goal: any) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.kpiName} - Target: {goal.targetValue}{goal.unit}
                    </option>
                  ))}
                  {feedbackForm.customGoals?.map((goal: any) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} (Custom Goal)
                    </option>
                  ))}
                </select>
              </div>

              {/* Performance Rating */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Rating (1-10)</h4>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={feedbackForm.overallRating || 5}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, overallRating: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <div className="text-2xl font-bold text-blue-600">
                    {feedbackForm.overallRating || 5}/10
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Needs Improvement</span>
                  <span>Exceeds Expectations</span>
                </div>
              </div>

              {/* Comments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager Comments</label>
                  <textarea
                    value={feedbackForm.managerComments || ''}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, managerComments: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={4}
                    placeholder="Manager feedback on goal achievement..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Comments</label>
                  <textarea
                    value={feedbackForm.employeeComments || ''}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, employeeComments: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={4}
                    placeholder="Employee self-assessment and comments..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowResultFeedback(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Request Modal */}
      {showTrainingRequest && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Training Request</h3>
                  <p className="text-gray-600">{selectedEmployee.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTrainingRequest(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Training Title *</label>
                  <input
                    type="text"
                    value={trainingForm.title || ''}
                    onChange={(e) => setTrainingForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter training title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Training Type</label>
                  <select
                    value={trainingForm.type || ''}
                    onChange={(e) => setTrainingForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Type</option>
                    <option value="product-knowledge">Product Knowledge</option>
                    <option value="service-technique">Service Technique</option>
                    <option value="customer-service">Customer Service</option>
                    <option value="safety">Safety</option>
                    <option value="compliance">Compliance</option>
                    <option value="leadership">Leadership</option>
                    <option value="certification">Certification</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Training Format & Source */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Training Format</h5>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="trainingFormat"
                        value="individual"
                        checked={trainingForm.isGroupTraining === false}
                        onChange={() => setTrainingForm(prev => ({ ...prev, isGroupTraining: false }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Individual Training</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="trainingFormat"
                        value="group"
                        checked={trainingForm.isGroupTraining === true}
                        onChange={() => setTrainingForm(prev => ({ ...prev, isGroupTraining: true }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Group Training</label>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Training Source</h5>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="trainingSource"
                        value="internal"
                        checked={trainingForm.isInternal === true}
                        onChange={() => setTrainingForm(prev => ({ ...prev, isInternal: true }))}
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">Internal Training</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="trainingSource"
                        value="external"
                        checked={trainingForm.isInternal === false}
                        onChange={() => setTrainingForm(prev => ({ ...prev, isInternal: false }))}
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <label className="ml-2 text-sm text-gray-700">External Training</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trainer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trainingForm.isInternal ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trainer Name</label>
                    <input
                      type="text"
                      value={trainingForm.trainerName || ''}
                      onChange={(e) => setTrainingForm(prev => ({ ...prev, trainerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Internal trainer name"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Training Company</label>
                    <input
                      type="text"
                      value={trainingForm.trainingCompany || ''}
                      onChange={(e) => setTrainingForm(prev => ({ ...prev, trainingCompany: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="External training company"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">KPI to Measure</label>
                  <select
                    value={trainingForm.measuredKPI || ''}
                    onChange={(e) => setTrainingForm(prev => ({ ...prev, measuredKPI: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select KPI to track improvement</option>
                    {getDivisionKPIs(selectedEmployee.divisionId).map(kpi => (
                      <option key={kpi.id} value={kpi.key}>
                        {kpi.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                  <input
                    type="date"
                    value={trainingForm.targetCompletionDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setTrainingForm(prev => ({ ...prev, targetCompletionDate: new Date(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date/Time</label>
                  <input
                    type="datetime-local"
                    value={trainingForm.scheduledDate?.toISOString().slice(0, 16) || ''}
                    onChange={(e) => setTrainingForm(prev => ({ ...prev, scheduledDate: new Date(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Cost and Approval */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={trainingForm.estimatedCost || ''}
                    onChange={(e) => setTrainingForm(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                  <input
                    type="number"
                    value={trainingForm.estimatedDuration || ''}
                    onChange={(e) => setTrainingForm(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="8"
                  />
                </div>
              </div>

              {/* Head Office Approval Notice */}
              {(trainingForm.estimatedCost || 0) > 500 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center text-yellow-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">
                      Head Office approval required for training costs over $500
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Training Description & Justification</label>
                <textarea
                  value={trainingForm.description || ''}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Describe the training and justify why it's needed..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowTrainingRequest(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCheckInPage;