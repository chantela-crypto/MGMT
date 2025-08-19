import React, { useState, useMemo } from 'react';
import { Employee, EmployeeKPIData, EmployeeTarget } from '../types/employee';
import { Division, User } from '../types/division';
import { PayrollEntry } from '../types/payroll';
import { getScoreLevel, getScoreColor, getScorePercentage, formatCurrency } from '../utils/scoring';
import { 
  User as UserIcon, X, Edit, Save, Target, TrendingUp, TrendingDown, 
  Calendar, Clock, DollarSign, Award, BarChart3, Users, MapPin,
  Activity, AlertCircle, CheckCircle, Star, Download, FileText
} from 'lucide-react';
import PerformanceInsightsTab from './PerformanceInsightsTab';
import YearlyAchievementGrid from './YearlyAchievementGrid';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface AdvancedEmployeeProfileProps {
  employee: Employee;
  division: Division;
  currentUser: User;
  employeeKPIData: EmployeeKPIData[];
  payrollData?: PayrollEntry[];
  employeeTargets: EmployeeTarget[];
  getEmployeeScheduledHours: (employeeId: string, month?: string, year?: number) => number;
  onClose: () => void;
  onUpdateEmployee: (employee: Employee) => void;
  onUpdateTarget: (target: EmployeeTarget) => void;
}

const AdvancedEmployeeProfile: React.FC<AdvancedEmployeeProfileProps> = ({
  employee,
  division,
  currentUser,
  employeeKPIData,
  payrollData = [],
  employeeTargets,
  getEmployeeScheduledHours,
  onClose,
  onUpdateEmployee,
  onUpdateTarget,
}) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'targets' | 'payroll' | 'insights' | 'yearly'>('performance');
  const [editingEmployee, setEditingEmployee] = useState<boolean>(false);
  const [editingTarget, setEditingTarget] = useState<boolean>(false);
  const [employeeForm, setEmployeeForm] = useState<Employee>(employee);
  const [targetForm, setTargetForm] = useState<Partial<EmployeeTarget>>({});

  // Get employee's historical KPI data
  const historicalData = useMemo(() => {
    return employeeKPIData
      .filter(data => data.employeeId === employee.id)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return parseInt(a.month) - parseInt(b.month);
      });
  }, [employeeKPIData, employee.id]);

  // Get current month data
  const currentData = useMemo(() => {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    return employeeKPIData.find(data => 
      data.employeeId === employee.id && 
      data.month === currentMonth && 
      data.year === currentYear
    );
  }, [employeeKPIData, employee.id]);

  // Get employee target
  const employeeTarget = useMemo(() => {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    return employeeTargets.find(target => 
      target.employeeId === employee.id && 
      target.month === currentMonth && 
      target.year === currentYear
    );
  }, [employeeTargets, employee.id]);

  // Get payroll data
  const employeePayroll = useMemo(() => {
    return payrollData.find(data => data.employeeId === employee.id);
  }, [payrollData, employee.id]);

  // Calculate overall performance score
  const overallScore = useMemo(() => {
    if (!currentData || !employeeTarget) return 0;
    
    const metrics = [
      'productivityRate',
      'retailPercentage',
      'happinessScore',
      'attendanceRate',
    ] as const;

    const scores = metrics.map(metric => {
      const actual = currentData[metric];
      const target = employeeTarget[metric];
      return getScorePercentage(actual, target);
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [currentData, employeeTarget]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return historicalData.map(data => ({
      month: new Date(data.year, parseInt(data.month) - 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      }),
      productivity: data.productivityRate,
      retail: data.retailPercentage,
      happiness: data.happinessScore * 10, // Convert to percentage
      attendance: data.attendanceRate,
      revenue: data.averageTicket * data.newClients,
    }));
  }, [historicalData]);

  const handleSaveEmployee = () => {
    if (!employeeForm.name || !employeeForm.divisionId) {
      alert('Please provide required employee information');
      return;
    }
    
    onUpdateEmployee(employeeForm);
    setEditingEmployee(false);
  };

  const handleSaveTarget = () => {
    if (!targetForm.employeeId) {
      alert('Target form is incomplete');
      return;
    }
    
    onUpdateTarget(targetForm as EmployeeTarget);
    setEditingTarget(false);
  };

  const handleInitializeTarget = () => {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    setTargetForm({
      employeeId: employee.id,
      divisionId: employee.divisionId,
      month: currentMonth,
      year: currentYear,
      scheduledHours: 160,
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
    setEditingTarget(true);
  };

  const scoreColor = overallScore > 0 ? getScoreColor(getScoreLevel(overallScore, 100)) : '#6b7280';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4"
              style={{ backgroundColor: division.color }}
            >
              {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
              <p className="text-lg text-gray-600">{employee.position}</p>
              <p className="text-sm text-gray-500">{division.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: scoreColor }}>
                {overallScore}%
              </div>
              <div className="text-xs text-gray-500">Overall Score</div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'performance', label: 'Performance History', icon: BarChart3 },
              { id: 'insights', label: 'Performance Insights', icon: Award },
              { id: 'targets', label: 'Targets & Goals', icon: Target },
              { id: 'yearly', label: 'Yearly Achievement', icon: Calendar },
              { id: 'payroll', label: 'Payroll & Profitability', icon: DollarSign },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-[#f4647d] text-[#f4647d]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                type="button"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance History</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productivity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retail %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Clients</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Happiness</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historicalData.map(data => (
                    <tr key={`${data.month}-${data.year}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(data.year, parseInt(data.month) - 1).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.productivityRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.retailPercentage}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.newClients}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(data.averageTicket)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.happinessScore}/10</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.attendanceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <PerformanceInsightsTab
            employee={employee}
            division={division}
            employeeKPIData={employeeKPIData}
            selectedMonth={(new Date().getMonth() + 1).toString().padStart(2, '0')}
            selectedYear={new Date().getFullYear()}
          />
        )}

        {activeTab === 'yearly' && (
          <YearlyAchievementGrid
            employeeId={employee.id}
            year={new Date().getFullYear()}
            monthlyAchievements={Array.from({ length: 12 }, (_, i) => ({
              month: (i + 1).toString().padStart(2, '0'),
              status: Math.random() > 0.7 ? 'achieved' : Math.random() > 0.5 ? 'partial' : 'missed',
              achievement: Math.round(Math.random() * 100),
              totalGoals: Math.floor(Math.random() * 5) + 2,
              achievedGoals: Math.floor(Math.random() * 3) + 1,
            }))}
          />
        )}

        {activeTab === 'targets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Targets & Goals</h3>
              
              {!employeeTarget && (
                <button
                  onClick={handleInitializeTarget}
                  className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center"
                  type="button"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Set Targets
                </button>
              )}
              
              {employeeTarget && !editingTarget && (
                <button
                  onClick={() => {
                    setTargetForm(employeeTarget);
                    setEditingTarget(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  type="button"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Targets
                </button>
              )}
            </div>

            {employeeTarget && !editingTarget ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(employeeTarget).map(([key, value]) => {
                  if (key === 'employeeId' || key === 'divisionId' || key === 'month' || key === 'year') return null;
                  
                  const actual = currentData?.[key as keyof EmployeeKPIData] as number;
                  const score = actual && value ? getScorePercentage(actual, value) : 0;
                  
                  return (
                    <div key={key} className="bg-white rounded-lg p-4 border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {typeof value === 'number' ? value : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">Target</div>
                        </div>
                        {actual && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{actual}</div>
                            <div className="text-xs text-gray-500">Actual ({score}%)</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : editingTarget ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(targetForm).map(([key, value]) => {
                    if (key === 'employeeId' || key === 'divisionId' || key === 'month' || key === 'year') return null;
                    
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={value || ''}
                          onChange={(e) => setTargetForm(prev => ({
                            ...prev,
                            [key]: parseFloat(e.target.value) || 0
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                        />
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditingTarget(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTarget}
                    className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center"
                    type="button"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Targets
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Targets Set</h3>
                <p className="text-gray-500">Set performance targets to track progress</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payroll & Profitability</h3>
            
            {employeePayroll ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Total Pay</h4>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(employeePayroll.totalPay)}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Total Revenue</h4>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(employeePayroll.totalRevenue)}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Payroll to Revenue %</h4>
                  <div className={`text-2xl font-bold ${
                    employeePayroll.payrollToRevenuePercent <= 18 ? 'text-green-600' :
                    employeePayroll.payrollToRevenuePercent <= 25 ? 'text-yellow-600' :
                    employeePayroll.payrollToRevenuePercent <= 30 ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {employeePayroll.payrollToRevenuePercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Data</h3>
                <p className="text-gray-500">Payroll data will appear here when available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedEmployeeProfile;