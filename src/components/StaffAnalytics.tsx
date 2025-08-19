import React, { useState, useMemo } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division } from '../types/division';
import { getScoreLevel, getScoreColor, getScorePercentage, formatCurrency } from '../utils/scoring';
import { Users, TrendingUp, Calendar, Target, Award, BarChart3, User, Filter } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';

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

interface StaffAnalyticsProps {
  employees: Employee[];
  divisions: Division[];
  dailySubmissions: DailySubmission[];
  employeeKPIData: EmployeeKPIData[];
}

const StaffAnalytics: React.FC<StaffAnalyticsProps> = ({
  employees,
  divisions,
  dailySubmissions,
  employeeKPIData,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('productivity');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Process daily submissions into analytics data
  const processedAnalytics = useMemo(() => {
    const analytics: Record<string, any> = {};

    dailySubmissions.forEach(submission => {
      submission.entries.forEach(entry => {
        if (!analytics[entry.employeeId]) {
          const employee = employees.find(emp => emp.id === entry.employeeId);
          analytics[entry.employeeId] = {
            employee,
            dailyEntries: [],
            monthlyStats: {},
            totalStats: {
              totalHoursWorked: 0,
              totalHoursBooked: 0,
              totalServiceRevenue: 0,
              totalRetailSales: 0,
              totalNewClients: 0,
              totalConsults: 0,
              totalConsultConverted: 0,
              totalClients: 0,
              totalPrebooks: 0,
              activeDays: 0,
            }
          };
        }

        analytics[entry.employeeId].dailyEntries.push({
          ...entry,
          date: new Date(entry.date),
        });

        // Update totals
        if (entry.status === 'active' && entry.isSubmitted) {
          const stats = analytics[entry.employeeId].totalStats;
          stats.totalHoursWorked += entry.hoursWorked;
          stats.totalHoursBooked += entry.hoursBooked;
          stats.totalServiceRevenue += entry.serviceRevenue;
          stats.totalRetailSales += entry.retailSales;
          stats.totalNewClients += entry.newClients;
          stats.totalConsults += entry.consults;
          stats.totalConsultConverted += entry.consultConverted;
          stats.totalClients += entry.totalClients;
          stats.totalPrebooks += entry.prebooks;
          stats.activeDays += 1;
        }
      });
    });

    // Calculate monthly aggregations
    Object.keys(analytics).forEach(employeeId => {
      const employeeData = analytics[employeeId];
      const monthlyStats: Record<string, any> = {};

      employeeData.dailyEntries.forEach((entry: any) => {
        const monthKey = format(entry.date, 'yyyy-MM');
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: monthKey,
            hoursWorked: 0,
            hoursBooked: 0,
            serviceRevenue: 0,
            retailSales: 0,
            newClients: 0,
            consults: 0,
            consultConverted: 0,
            totalClients: 0,
            prebooks: 0,
            activeDays: 0,
          };
        }

        if (entry.status === 'active' && entry.isSubmitted) {
          const monthStats = monthlyStats[monthKey];
          monthStats.hoursWorked += entry.hoursWorked;
          monthStats.hoursBooked += entry.hoursBooked;
          monthStats.serviceRevenue += entry.serviceRevenue;
          monthStats.retailSales += entry.retailSales;
          monthStats.newClients += entry.newClients;
          monthStats.consults += entry.consults;
          monthStats.consultConverted += entry.consultConverted;
          monthStats.totalClients += entry.totalClients;
          monthStats.prebooks += entry.prebooks;
          monthStats.activeDays += 1;
        }
      });

      // Calculate percentages for monthly stats
      Object.keys(monthlyStats).forEach(monthKey => {
        const stats = monthlyStats[monthKey];
        stats.productivityPercentage = stats.hoursWorked > 0 ? Math.round((stats.hoursBooked / stats.hoursWorked) * 100) : 0;
        stats.consultConversionPercentage = stats.consults > 0 ? Math.round((stats.consultConverted / stats.consults) * 100) : 0;
        stats.prebookPercentage = stats.totalClients > 0 ? Math.round((stats.prebooks / stats.totalClients) * 100) : 0;
        stats.retailPercentage = (stats.serviceRevenue + stats.retailSales) > 0 ? Math.round((stats.retailSales / (stats.serviceRevenue + stats.retailSales)) * 100) : 0;
        stats.averageTicket = stats.newClients > 0 ? Math.round((stats.serviceRevenue + stats.retailSales) / stats.newClients) : 0;
      });

      employeeData.monthlyStats = monthlyStats;
    });

    return analytics;
  }, [dailySubmissions, employees]);

  // Filter employees based on division
  const filteredEmployees = selectedDivision === 'all' 
    ? employees.filter(emp => emp.isActive)
    : employees.filter(emp => emp.divisionId === selectedDivision && emp.isActive);

  // Get chart data for selected employee or all employees
  const getChartData = () => {
    if (selectedEmployee === 'all') {
      // Aggregate data for all filtered employees
      const monthlyAggregates: Record<string, any> = {};
      
      filteredEmployees.forEach(employee => {
        const employeeAnalytics = processedAnalytics[employee.id];
        if (employeeAnalytics) {
          Object.entries(employeeAnalytics.monthlyStats).forEach(([month, stats]: [string, any]) => {
            if (!monthlyAggregates[month]) {
              monthlyAggregates[month] = {
                month,
                hoursWorked: 0,
                hoursBooked: 0,
                serviceRevenue: 0,
                retailSales: 0,
                newClients: 0,
                consults: 0,
                consultConverted: 0,
                totalClients: 0,
                prebooks: 0,
                activeDays: 0,
              };
            }
            
            const aggregate = monthlyAggregates[month];
            aggregate.hoursWorked += stats.hoursWorked;
            aggregate.hoursBooked += stats.hoursBooked;
            aggregate.serviceRevenue += stats.serviceRevenue;
            aggregate.retailSales += stats.retailSales;
            aggregate.newClients += stats.newClients;
            aggregate.consults += stats.consults;
            aggregate.consultConverted += stats.consultConverted;
            aggregate.totalClients += stats.totalClients;
            aggregate.prebooks += stats.prebooks;
            aggregate.activeDays += stats.activeDays;
          });
        }
      });

      // Calculate percentages for aggregated data
      return Object.values(monthlyAggregates).map((stats: any) => ({
        ...stats,
        productivityPercentage: stats.hoursWorked > 0 ? Math.round((stats.hoursBooked / stats.hoursWorked) * 100) : 0,
        consultConversionPercentage: stats.consults > 0 ? Math.round((stats.consultConverted / stats.consults) * 100) : 0,
        prebookPercentage: stats.totalClients > 0 ? Math.round((stats.prebooks / stats.totalClients) * 100) : 0,
        retailPercentage: (stats.serviceRevenue + stats.retailSales) > 0 ? Math.round((stats.retailSales / (stats.serviceRevenue + stats.retailSales)) * 100) : 0,
        averageTicket: stats.newClients > 0 ? Math.round((stats.serviceRevenue + stats.retailSales) / stats.newClients) : 0,
      })).sort((a, b) => a.month.localeCompare(b.month));
    } else {
      // Individual employee data
      const employeeAnalytics = processedAnalytics[selectedEmployee];
      if (!employeeAnalytics) return [];
      
      return Object.values(employeeAnalytics.monthlyStats).sort((a: any, b: any) => a.month.localeCompare(b.month));
    }
  };

  const chartData = getChartData();

  // Get top performers
  const getTopPerformers = () => {
    return filteredEmployees.map(employee => {
      const analytics = processedAnalytics[employee.id];
      if (!analytics) return null;

      const stats = analytics.totalStats;
      const avgProductivity = stats.totalHoursWorked > 0 ? Math.round((stats.totalHoursBooked / stats.totalHoursWorked) * 100) : 0;
      const totalRevenue = stats.totalServiceRevenue + stats.totalRetailSales;
      const avgTicket = stats.totalNewClients > 0 ? Math.round(totalRevenue / stats.totalNewClients) : 0;

      return {
        employee,
        avgProductivity,
        totalRevenue,
        avgTicket,
        activeDays: stats.activeDays,
        newClients: stats.totalNewClients,
        division: divisions.find(d => d.id === employee.divisionId),
      };
    }).filter(Boolean).sort((a, b) => b!.totalRevenue - a!.totalRevenue);
  };

  const topPerformers = getTopPerformers();

  const metrics = [
    { key: 'productivity', label: 'Productivity %', dataKey: 'productivityPercentage' },
    { key: 'revenue', label: 'Total Revenue', dataKey: 'serviceRevenue' },
    { key: 'retail', label: 'Retail %', dataKey: 'retailPercentage' },
    { key: 'newClients', label: 'New Clients', dataKey: 'newClients' },
    { key: 'conversion', label: 'Consult Conversion %', dataKey: 'consultConversionPercentage' },
    { key: 'prebook', label: 'Prebook %', dataKey: 'prebookPercentage' },
  ];

  const selectedMetricData = metrics.find(m => m.key === selectedMetric);

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Staff Analytics</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Division
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <User className="h-4 w-4 inline mr-1" />
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Employees</option>
              {filteredEmployees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="h-4 w-4 inline mr-1" />
              Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              {metrics.map(metric => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Staff</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {filteredEmployees.length}
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
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Submissions</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {dailySubmissions.length}
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
              <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Productivity</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {topPerformers.length > 0 
                  ? Math.round(topPerformers.reduce((sum, p) => sum + p!.avgProductivity, 0) / topPerformers.length)
                  : 0}%
              </div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(topPerformers.reduce((sum, p) => sum + p!.totalRevenue, 0))}
              </div>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Award className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedMetricData?.label} Trends - {selectedEmployee === 'all' ? 'All Employees' : employees.find(e => e.id === selectedEmployee)?.name}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value) => format(new Date(value + '-01'), 'MMM yyyy')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value + '-01'), 'MMMM yyyy')}
                formatter={(value, name) => [
                  selectedMetric === 'revenue' ? formatCurrency(Number(value)) : 
                  selectedMetric.includes('Percentage') || selectedMetric.includes('%') ? `${value}%` : 
                  value,
                  selectedMetricData?.label
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedMetricData?.dataKey}
                stroke="#f4647d"
                strokeWidth={3}
                dot={{ r: 6 }}
                name={selectedMetricData?.label}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Rankings</h3>
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
                  Division
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productivity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Clients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Days
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topPerformers.slice(0, 10).map((performer, index) => (
                <tr key={performer!.employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white mr-2 ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div 
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: performer!.division?.color }}
                        >
                          {performer!.employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{performer!.employee.name}</div>
                        <div className="text-sm text-gray-500">{performer!.employee.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${performer!.division?.color}20`, 
                        color: performer!.division?.color 
                      }}
                    >
                      {performer!.division?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="font-medium">{performer!.avgProductivity}%</span>
                      <div className={`ml-2 w-2 h-2 rounded-full ${
                        performer!.avgProductivity >= 90 ? 'bg-green-500' :
                        performer!.avgProductivity >= 80 ? 'bg-yellow-500' :
                        performer!.avgProductivity >= 70 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(performer!.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(performer!.avgTicket)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {performer!.newClients}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {performer!.activeDays}
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

export default StaffAnalytics;