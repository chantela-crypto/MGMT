import React, { useState, useMemo } from 'react';
import { Division, KPIData, KPITarget } from '../types/division';
import { Employee, EmployeeKPIData } from '../types/employee';
import { getScoreLevel, getScoreColor, getScorePercentage, formatCurrency, formatPercentage, formatNumber } from '../utils/scoring';
import { Users, TrendingUp, TrendingDown, Target, Award, Calendar, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface DivisionOverviewProps {
  divisions: Division[];
  kpiData: KPIData[];
  targets: KPITarget[];
  employees: Employee[];
  employeeKPIData: EmployeeKPIData[];
  selectedMonth: string;
  selectedYear: number;
}

const DivisionOverview: React.FC<DivisionOverviewProps> = ({
  divisions,
  kpiData,
  targets,
  employees,
  employeeKPIData,
  selectedMonth,
  selectedYear,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>(divisions[0]?.id || '');

  const currentDivision = divisions.find(d => d.id === selectedDivision);
  const divisionEmployees = employees.filter(emp => emp.divisionId === selectedDivision && emp.isActive);
  const divisionData = kpiData.find(data => 
    data.divisionId === selectedDivision && 
    data.month === selectedMonth && 
    data.year === selectedYear
  );
  const divisionTarget = targets.find(target => target.divisionId === selectedDivision);

  // Calculate division metrics
  const divisionMetrics = useMemo(() => {
    if (!divisionData || !divisionTarget) return null;

    const metrics = [
      { key: 'productivityRate', label: 'Productivity Rate', value: divisionData.productivityRate, target: divisionTarget.productivityRate, format: (v: number) => `${v}%` },
      { key: 'prebookRate', label: 'Prebook Rate', value: divisionData.prebookRate, target: divisionTarget.prebookRate, format: (v: number) => `${v}%` },
      { key: 'firstTimeRetentionRate', label: 'First-Time Retention', value: divisionData.firstTimeRetentionRate, target: divisionTarget.firstTimeRetentionRate, format: (v: number) => `${v}%` },
      { key: 'repeatRetentionRate', label: 'Repeat Retention', value: divisionData.repeatRetentionRate, target: divisionTarget.repeatRetentionRate, format: (v: number) => `${v}%` },
      { key: 'retailPercentage', label: 'Retail %', value: divisionData.retailPercentage, target: divisionTarget.retailPercentage, format: (v: number) => `${v}%` },
      { key: 'newClients', label: 'New Clients', value: divisionData.newClients, target: divisionTarget.newClients, format: (v: number) => v.toString() },
      { key: 'averageTicket', label: 'Average Ticket', value: divisionData.averageTicket, target: divisionTarget.averageTicket, format: (v: number) => formatCurrency(v) },
      { key: 'serviceSalesPerHour', label: 'Sales per Hour', value: divisionData.serviceSalesPerHour, target: divisionTarget.serviceSalesPerHour, format: (v: number) => formatCurrency(v) },
      { key: 'clientsRetailPercentage', label: 'Clients Retail %', value: divisionData.clientsRetailPercentage, target: divisionTarget.clientsRetailPercentage, format: (v: number) => `${v}%` },
      { key: 'hoursSold', label: 'Hours Sold', value: divisionData.hoursSold, target: divisionTarget.hoursSold, format: (v: number) => v.toString() },
      { key: 'happinessScore', label: 'Happiness Score', value: divisionData.happinessScore, target: divisionTarget.happinessScore, format: (v: number) => `${v}/10` },
      { key: 'netCashPercentage', label: 'Net Cash %', value: divisionData.netCashPercentage, target: divisionTarget.netCashPercentage, format: (v: number) => `${v}%` },
    ];

    return metrics.map(metric => ({
      ...metric,
      score: getScorePercentage(metric.value, metric.target),
      level: getScoreLevel(metric.value, metric.target),
      color: getScoreColor(getScoreLevel(metric.value, metric.target)),
    }));
  }, [divisionData, divisionTarget]);

  // Calculate employee performance summary
  const employeePerformance = useMemo(() => {
    return divisionEmployees.map(employee => {
      const empData = employeeKPIData.find(data => 
        data.employeeId === employee.id && 
        data.month === selectedMonth && 
        data.year === selectedYear
      );

      if (!empData) return { employee, score: 0, level: 'poor' as const };

      const avgScore = [
        empData.productivityRate,
        empData.retailPercentage,
        empData.happinessScore * 10, // Convert to percentage
        empData.attendanceRate,
      ].reduce((sum, val) => sum + val, 0) / 4;

      return {
        employee,
        score: Math.round(avgScore),
        level: getScoreLevel(avgScore, 100),
        data: empData,
      };
    }).sort((a, b) => b.score - a.score);
  }, [divisionEmployees, employeeKPIData, selectedMonth, selectedYear]);

  // Performance distribution chart data
  const performanceDistribution = useMemo(() => {
    const distribution = { excellent: 0, good: 0, warning: 0, poor: 0 };
    employeePerformance.forEach(emp => {
      distribution[emp.level]++;
    });

    return [
      { name: 'Excellent', value: distribution.excellent, color: '#16a34a' },
      { name: 'Good', value: distribution.good, color: '#84cc16' },
      { name: 'Warning', value: distribution.warning, color: '#d97706' },
      { name: 'Poor', value: distribution.poor, color: '#dc2626' },
    ].filter(item => item.value > 0);
  }, [employeePerformance]);

  // Monthly trend data
  const monthlyTrends = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(selectedYear, parseInt(selectedMonth) - 1 - i);
      return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      };
    }).reverse();

    return months.map(({ month, year, label }) => {
      const data = kpiData.find(d => 
        d.divisionId === selectedDivision && 
        d.month === month.toString().padStart(2, '0') && 
        d.year === year
      );

      return {
        month: label,
        productivity: data?.productivityRate || 0,
        retail: data?.retailPercentage || 0,
        happiness: data?.happinessScore || 0,
        revenue: (data?.averageTicket || 0) * (data?.newClients || 0),
      };
    });
  }, [kpiData, selectedDivision, selectedMonth, selectedYear]);

  if (!currentDivision) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No division selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Division Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Division Overview</h2>
          </div>
          
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
          >
            {divisions.map(division => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </select>
        </div>

        {/* Division Header */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold" style={{ color: currentDivision.color }}>
                {currentDivision.name}
              </h3>
              <p className="text-gray-600 mt-1">
                {divisionEmployees.length} active team members
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Performance Period</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {divisionMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {divisionMetrics.slice(0, 8).map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-[#f4647d]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.label}</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {metric.format(metric.value)}
                  </p>
                </div>
                <div className="p-4 rounded-full bg-gradient-to-br from-[#f4647d] to-[#fd8585]">
                  <Target className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }}></div>
                  <span className="text-sm text-gray-600">{metric.score}% of target</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    metric.level === 'excellent' ? 'bg-green-100 text-green-800' :
                    metric.level === 'good' ? 'bg-yellow-100 text-yellow-800' :
                    metric.level === 'warning' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {metric.level.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics Chart */}
        {divisionMetrics && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance vs Targets</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={divisionMetrics.slice(0, 8)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 120]} />
                  <YAxis type="category" dataKey="label" width={120} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}%`,
                      name === 'score' ? 'Performance Score' : 'Target Score'
                    ]}
                  />
                  <Bar dataKey="score" fill={currentDivision.color} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Team Performance Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Performance Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="productivity" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Productivity %" 
              />
              <Line 
                type="monotone" 
                dataKey="retail" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Retail %" 
              />
              <Line 
                type="monotone" 
                dataKey="happiness" 
                stroke="#f59e0b" 
                strokeWidth={3}
                name="Happiness Score" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      {divisionMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Performance Metrics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {divisionMetrics.map((metric, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.format(metric.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {metric.format(metric.target)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(metric.score, 100)}%`,
                              backgroundColor: metric.color,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium" style={{ color: metric.color }}>
                          {metric.score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        metric.level === 'excellent' ? 'bg-green-100 text-green-800' :
                        metric.level === 'good' ? 'bg-yellow-100 text-yellow-800' :
                        metric.level === 'warning' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {metric.level.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Performance Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Rankings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productivity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retail %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Happiness
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeePerformance.map((emp, index) => (
                <tr key={emp.employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                             style={{ backgroundColor: currentDivision.color }}>
                          {emp.employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{emp.employee.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {emp.employee.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-2" 
                           style={{ backgroundColor: getScoreColor(emp.level) }} />
                      <span className="text-sm font-medium" style={{ color: getScoreColor(emp.level) }}>
                        {emp.score}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {emp.data ? `${emp.data.productivityRate}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {emp.data ? `${emp.data.retailPercentage}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {emp.data ? `${emp.data.happinessScore}/10` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DivisionOverview;