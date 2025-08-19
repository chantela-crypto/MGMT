import React, { useState, useMemo } from 'react';
import { Division, User, KPIData } from '../types/division';
import { Employee } from '../types/employee';
import { 
  Target, TrendingUp, DollarSign, Users, Calendar, BarChart3, 
  Plus, Edit, Save, X, Eye, Building2, AlertCircle, CheckCircle,
  Brain, Lightbulb, Zap, TrendingDown, Award, Activity
} from 'lucide-react';
import { formatCurrency } from '../utils/scoring';

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

interface DivisionTarget {
  id: string;
  divisionId: string;
  month: string;
  year: number;
  revenueTarget: number;
  productivityTarget: number;
  newClientsTarget: number;
  retailPercentageTarget: number;
  happinessTarget: number;
  profitMarginTarget: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DivisionRevenueTargetsPageProps {
  currentUser: User;
  divisions: Division[];
  kpiData?: KPIData[];
  dailySubmissions?: DailySubmission[];
}

const DivisionRevenueTargetsPage: React.FC<DivisionRevenueTargetsPageProps> = ({
  currentUser,
  divisions,
  kpiData = [],
  dailySubmissions = [],
}) => {
  const [activeTab, setActiveTab] = useState<'targets' | 'insights'>('targets');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'monthly' | 'annual'>('monthly');
  const [showTargetForm, setShowTargetForm] = useState<boolean>(false);
  const [editingTarget, setEditingTarget] = useState<DivisionTarget | null>(null);
  const [showAIInsights, setShowAIInsights] = useState<boolean>(false);
  
  const [divisionTargets, setDivisionTargets] = useState<DivisionTarget[]>([
    {
      id: 'target-001',
      divisionId: 'laser',
      month: '01',
      year: 2025,
      revenueTarget: 85000,
      productivityTarget: 88,
      newClientsTarget: 45,
      retailPercentageTarget: 15,
      happinessTarget: 9.0,
      profitMarginTarget: 35,
      createdBy: currentUser.id,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    {
      id: 'target-002',
      divisionId: 'injectables',
      month: '01',
      year: 2025,
      revenueTarget: 75000,
      productivityTarget: 92,
      newClientsTarget: 30,
      retailPercentageTarget: 25,
      happinessTarget: 9.2,
      profitMarginTarget: 40,
      createdBy: currentUser.id,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
  ]);

  const [targetForm, setTargetForm] = useState<Partial<DivisionTarget>>({
    month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    year: new Date().getFullYear(),
    revenueTarget: 50000,
    productivityTarget: 85,
    newClientsTarget: 40,
    retailPercentageTarget: 25,
    happinessTarget: 8.5,
    profitMarginTarget: 30,
  });

  // Calculate current performance from daily submissions
  const calculateCurrentPerformance = (divisionId: string) => {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    const divisionSubmissions = dailySubmissions.filter(s => 
      s.divisionId === divisionId &&
      new Date(s.date).getMonth() === parseInt(currentMonth) - 1 &&
      new Date(s.date).getFullYear() === currentYear
    );

    let totalServiceRevenue = 0;
    let totalRetailSales = 0;
    let totalNewClients = 0;
    let totalHoursWorked = 0;
    let totalHoursBooked = 0;
    let activeEntries = 0;

    divisionSubmissions.forEach(submission => {
      submission.entries.forEach(entry => {
        if (entry.status === 'active' && entry.isSubmitted) {
          totalServiceRevenue += entry.serviceRevenue;
          totalRetailSales += entry.retailSales;
          totalNewClients += entry.newClients;
          totalHoursWorked += entry.hoursWorked;
          totalHoursBooked += entry.hoursBooked;
          activeEntries++;
        }
      });
    });

    const totalRevenue = totalServiceRevenue + totalRetailSales;
    const avgProductivity = totalHoursWorked > 0 ? Math.round((totalHoursBooked / totalHoursWorked) * 100) : 0;
    const retailPercentage = totalRevenue > 0 ? Math.round((totalRetailSales / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      avgProductivity,
      totalNewClients,
      retailPercentage,
      totalServiceRevenue,
      totalRetailSales,
    };
  };

  // Filter targets based on selection
  const filteredTargets = useMemo(() => {
    let filtered = divisionTargets;
    
    if (selectedDivision !== 'all') {
      filtered = filtered.filter(target => target.divisionId === selectedDivision);
    }
    
    return filtered;
  }, [divisionTargets, selectedDivision]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalTargetRevenue = filteredTargets.reduce((sum, target) => sum + target.revenueTarget, 0);
    const avgProductivityTarget = filteredTargets.length > 0 
      ? Math.round(filteredTargets.reduce((sum, target) => sum + target.productivityTarget, 0) / filteredTargets.length)
      : 0;
    
    // Calculate actual performance
    let totalActualRevenue = 0;
    let avgActualProductivity = 0;
    
    if (selectedDivision === 'all') {
      divisions.forEach(division => {
        const performance = calculateCurrentPerformance(division.id);
        totalActualRevenue += performance.totalRevenue;
      });
      avgActualProductivity = divisions.length > 0 
        ? Math.round(divisions.reduce((sum, division) => {
            const performance = calculateCurrentPerformance(division.id);
            return sum + performance.avgProductivity;
          }, 0) / divisions.length)
        : 0;
    } else {
      const performance = calculateCurrentPerformance(selectedDivision);
      totalActualRevenue = performance.totalRevenue;
      avgActualProductivity = performance.avgProductivity;
    }

    const revenueProgress = totalTargetRevenue > 0 ? Math.round((totalActualRevenue / totalTargetRevenue) * 100) : 0;
    const productivityProgress = avgProductivityTarget > 0 ? Math.round((avgActualProductivity / avgProductivityTarget) * 100) : 0;

    return {
      totalTargetRevenue,
      totalActualRevenue,
      revenueProgress,
      avgProductivityTarget,
      avgActualProductivity,
      productivityProgress,
      activeDivisions: selectedDivision === 'all' ? divisions.length : 1,
    };
  }, [filteredTargets, selectedDivision, divisions, dailySubmissions]);

  // Handle save target
  const handleSaveTarget = () => {
    if (!targetForm.divisionId) {
      alert('Please select a division');
      return;
    }

    const newTarget: DivisionTarget = {
      id: editingTarget?.id || `target-${Date.now()}`,
      divisionId: targetForm.divisionId!,
      month: targetForm.month!,
      year: targetForm.year!,
      revenueTarget: targetForm.revenueTarget || 0,
      productivityTarget: targetForm.productivityTarget || 0,
      newClientsTarget: targetForm.newClientsTarget || 0,
      retailPercentageTarget: targetForm.retailPercentageTarget || 0,
      happinessTarget: targetForm.happinessTarget || 0,
      profitMarginTarget: targetForm.profitMarginTarget || 0,
      createdBy: currentUser.id,
      createdAt: editingTarget?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    setDivisionTargets(prev => {
      const filtered = prev.filter(target => target.id !== newTarget.id);
      return [...filtered, newTarget];
    });

    setShowTargetForm(false);
    setEditingTarget(null);
    setTargetForm({
      month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
      year: new Date().getFullYear(),
      revenueTarget: 50000,
      productivityTarget: 85,
      newClientsTarget: 40,
      retailPercentageTarget: 25,
      happinessTarget: 8.5,
      profitMarginTarget: 30,
    });
  };

  // Generate AI insights
  const generateInsights = () => {
    return divisions.map(division => {
      const performance = calculateCurrentPerformance(division.id);
      const target = divisionTargets.find(t => t.divisionId === division.id);
      
      if (!target) return null;

      const revenueProgress = target.revenueTarget > 0 ? (performance.totalRevenue / target.revenueTarget) * 100 : 0;
      const productivityGap = performance.avgProductivity - target.productivityTarget;

      let insight = '';
      let type: 'positive' | 'negative' | 'neutral' = 'neutral';
      let confidence = Math.round(Math.random() * 30 + 70); // 70-100%

      if (revenueProgress > 110) {
        insight = `${division.name} is exceeding revenue targets by ${Math.round(revenueProgress - 100)}%. Consider increasing targets or expanding capacity.`;
        type = 'positive';
      } else if (revenueProgress < 80) {
        insight = `${division.name} is ${Math.round(100 - revenueProgress)}% below revenue target. Focus on client acquisition and retention strategies.`;
        type = 'negative';
      } else if (productivityGap < -10) {
        insight = `${division.name} productivity is ${Math.abs(productivityGap)}% below target. Review scheduling and workflow optimization.`;
        type = 'negative';
      } else {
        insight = `${division.name} is performing within expected ranges. Continue current strategies.`;
        type = 'neutral';
      }

      return {
        divisionId: division.id,
        divisionName: division.name,
        insight,
        type,
        confidence,
        metrics: {
          revenueProgress: Math.round(revenueProgress),
          productivityGap: Math.round(productivityGap),
        }
      };
    }).filter(Boolean);
  };

  const aiInsights = generateInsights();

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#0c5b63] to-[#0f6b73] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Division Targets</h1>
              <p className="text-white/80 text-lg">Revenue targets and performance goals management</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Active Targets</div>
            <div className="text-xl font-bold">{filteredTargets.length}</div>
            <div className="text-sm text-white/70">
              {selectedDivision === 'all' ? 'All divisions' : divisions.find(d => d.id === selectedDivision)?.name}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Target Revenue</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summaryMetrics.totalTargetRevenue)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Monthly target total</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Actual Revenue</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summaryMetrics.totalActualRevenue)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Current performance</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Revenue Progress</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {summaryMetrics.revenueProgress}%
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Of monthly target</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Productivity</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {summaryMetrics.avgActualProductivity}%
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Average across divisions</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('targets')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'targets'
                  ? 'border-[#0c5b63] text-[#0c5b63]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              Division Targets
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'insights'
                  ? 'border-[#0c5b63] text-[#0c5b63]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Insights & Projections
            </button>
          </nav>
        </div>

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c5b63] bg-white"
                >
                  <option value="all">All Divisions</option>
                  {divisions.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as 'monthly' | 'annual')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c5b63] bg-white"
                >
                  <option value="monthly">Monthly Targets</option>
                  <option value="annual">Annual Targets</option>
                </select>
              </div>

              <button
                onClick={() => setShowTargetForm(true)}
                className="flex items-center px-4 py-2 bg-[#0c5b63] text-white rounded-lg hover:bg-[#0f6b73] transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Set New Target
              </button>
            </div>

            {/* Division Target Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {divisions.map(division => {
                const target = divisionTargets.find(t => t.divisionId === division.id);
                const performance = calculateCurrentPerformance(division.id);
                
                if (!target) return null;

                const revenueProgress = target.revenueTarget > 0 ? Math.round((performance.totalRevenue / target.revenueTarget) * 100) : 0;
                const productivityProgress = target.productivityTarget > 0 ? Math.round((performance.avgProductivity / target.productivityTarget) * 100) : 0;

                return (
                  <div key={division.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-3"
                          style={{ backgroundColor: division.color }}
                        >
                          {division.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{division.name}</h3>
                          <p className="text-sm text-gray-600">Monthly Targets</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingTarget(target);
                          setTargetForm(target);
                          setShowTargetForm(true);
                        }}
                        className="text-gray-400 hover:text-[#0c5b63]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Revenue Target</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(target.revenueTarget)}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Actual Revenue</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(performance.totalRevenue)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              revenueProgress >= 100 ? 'bg-green-500' :
                              revenueProgress >= 80 ? 'bg-blue-500' :
                              revenueProgress >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                          />
                        </div>
                        <div className="text-right mt-1">
                          <span className="text-sm font-medium text-gray-700">{revenueProgress}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{performance.avgProductivity}%</div>
                          <div className="text-xs text-gray-600">Productivity</div>
                          <div className="text-xs text-gray-500">Target: {target.productivityTarget}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{performance.totalNewClients}</div>
                          <div className="text-xs text-gray-600">New Clients</div>
                          <div className="text-xs text-gray-500">Target: {target.newClientsTarget}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Targets Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Targets Overview</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Division
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Productivity Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual Productivity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTargets.map(target => {
                      const division = divisions.find(d => d.id === target.divisionId);
                      const performance = calculateCurrentPerformance(target.divisionId);
                      const revenueProgress = target.revenueTarget > 0 ? Math.round((performance.totalRevenue / target.revenueTarget) * 100) : 0;
                      
                      return (
                        <tr key={target.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold mr-3"
                                style={{ backgroundColor: division?.color }}
                              >
                                {division?.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{division?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(target.revenueTarget)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(performance.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    revenueProgress >= 100 ? 'bg-green-500' :
                                    revenueProgress >= 80 ? 'bg-blue-500' :
                                    revenueProgress >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">{revenueProgress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {target.productivityTarget}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {performance.avgProductivity}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingTarget(target);
                                setTargetForm(target);
                                setShowTargetForm(true);
                              }}
                              className="text-[#0c5b63] hover:text-[#0f6b73]"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <Brain className="h-6 w-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">AI-Powered Performance Insights</h3>
              </div>
              <p className="text-gray-700">
                Advanced analytics and recommendations based on current performance data and target analysis.
              </p>
            </div>

            {/* AI Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiInsights.map((insight, index) => (
                <div key={index} className={`rounded-xl p-6 border-l-4 ${
                  insight.type === 'positive' ? 'bg-green-50 border-green-500' :
                  insight.type === 'negative' ? 'bg-red-50 border-red-500' :
                  'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{insight.divisionName}</h4>
                    <div className="flex items-center space-x-2">
                      {insight.type === 'positive' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : insight.type === 'negative' ? (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <Activity className="h-5 w-5 text-blue-600" />
                      )}
                      <span className="text-sm font-medium text-gray-600">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-4 ${
                    insight.type === 'positive' ? 'text-green-800' :
                    insight.type === 'negative' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {insight.insight}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600">Revenue Progress</div>
                      <div className="text-lg font-bold text-gray-900">{insight.metrics.revenueProgress}%</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-600">Productivity Gap</div>
                      <div className={`text-lg font-bold ${
                        insight.metrics.productivityGap >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insight.metrics.productivityGap > 0 ? '+' : ''}{insight.metrics.productivityGap}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Projection Scenarios */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Annual Revenue Projections</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Conservative', multiplier: 0.85, color: 'orange' },
                  { name: 'Realistic', multiplier: 1.0, color: 'blue' },
                  { name: 'Optimistic', multiplier: 1.15, color: 'green' },
                ].map(scenario => {
                  const projectedRevenue = summaryMetrics.totalTargetRevenue * 12 * scenario.multiplier;
                  
                  return (
                    <div key={scenario.name} className={`bg-${scenario.color}-50 rounded-xl p-6 border border-${scenario.color}-200`}>
                      <h4 className={`text-lg font-bold text-${scenario.color}-900 mb-2`}>{scenario.name} Scenario</h4>
                      <div className={`text-3xl font-bold text-${scenario.color}-700 mb-2`}>
                        {formatCurrency(projectedRevenue)}
                      </div>
                      <div className={`text-sm text-${scenario.color}-600`}>
                        Annual projection based on {Math.round(scenario.multiplier * 100)}% of current targets
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Target Form Modal */}
      {showTargetForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTarget ? 'Edit Division Target' : 'Set New Division Target'}
              </h3>
              <button
                onClick={() => setShowTargetForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                  <select
                    value={targetForm.divisionId || ''}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, divisionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                    disabled={!!editingTarget}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={targetForm.month || ''}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Target ($)</label>
                  <input
                    type="number"
                    value={targetForm.revenueTarget || ''}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, revenueTarget: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Productivity Target (%)</label>
                  <input
                    type="number"
                    value={targetForm.productivityTarget || ''}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, productivityTarget: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Clients Target</label>
                  <input
                    type="number"
                    value={targetForm.newClientsTarget || ''}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, newClientsTarget: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retail Percentage Target (%)</label>
                  <input
                    type="number"
                    value={targetForm.retailPercentageTarget || ''}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, retailPercentageTarget: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Happiness Target (1-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={targetForm.happinessTarget || ''}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, happinessTarget: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profit Margin Target (%)</label>
                  <input
                    type="number"
                    value={targetForm.profitMarginTarget || ''}
                    onChange={(e) => setTargetForm(prev => ({ ...prev, profitMarginTarget: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowTargetForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTarget}
                  className="px-4 py-2 bg-[#0c5b63] text-white rounded-md hover:bg-[#0f6b73] flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingTarget ? 'Update Target' : 'Save Target'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DivisionRevenueTargetsPage;