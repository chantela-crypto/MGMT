import React, { useState, useMemo } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division, KPIData } from '../types/division';
import { HormoneUnit } from '../types/hormoneUnit';
import { formatCurrency } from '../utils/scoring';
import { BarChart3, TrendingUp, Clock, Target, Users, Calendar, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

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

interface SchedulingPerformanceDashboardProps {
  employees: Employee[];
  divisions: Division[];
  hormoneUnits: HormoneUnit[];
  kpiData: KPIData[];
  employeeKPIData: EmployeeKPIData[];
  shifts: ShiftEntry[];
  selectedMonth: string;
  selectedYear: number;
  scheduledHours: Record<string, number>;
  getEmployeeScheduledHours: (employeeId: string, month?: string, year?: number) => number;
}

const SchedulingPerformanceDashboard: React.FC<SchedulingPerformanceDashboardProps> = ({
  employees,
  divisions,
  hormoneUnits,
  kpiData,
  employeeKPIData,
  shifts,
  selectedMonth,
  selectedYear,
  scheduledHours,
  getEmployeeScheduledHours,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('productivity');

  // Calculate scheduling performance metrics
  const performanceMetrics = useMemo(() => {
    const metrics: Record<string, any> = {};

    // Filter employees by division and location
    let filteredEmployees = employees.filter(emp => emp.isActive);
    if (selectedDivision !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => emp.divisionId === selectedDivision);
    }
    if (selectedLocation !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => emp.locations?.includes(selectedLocation));
    }

    filteredEmployees.forEach(employee => {
      // Get scheduled hours from calendar system
      const totalScheduledHours = getEmployeeScheduledHours(employee.id, selectedMonth, selectedYear);

      // Get actual performance data
      const empKPIData = employeeKPIData.find(data => 
        data.employeeId === employee.id && 
        data.month === selectedMonth && 
        data.year === selectedYear
      );

      // Mock booked hours (in real system, this would come from booking system)
      const bookedHours = empKPIData?.hoursSold || 0;
      const serviceRevenue = empKPIData ? empKPIData.serviceSalesPerHour * bookedHours : 0;

      metrics[employee.id] = {
        employee,
        division: divisions.find(d => d.id === employee.divisionId),
        scheduledHours: totalScheduledHours,
        bookedHours,
        percentHoursSold: totalScheduledHours > 0 ? Math.round((bookedHours / totalScheduledHours) * 100) : 0,
        serviceRevenue,
        productivity: empKPIData?.productivityRate || 0,
        kpiData: empKPIData,
      };
    });

    return metrics;
  }, [employees, divisions, shifts, employeeKPIData, selectedDivision, selectedLocation, selectedMonth, selectedYear]);

  // Calculate division-level aggregates
  const divisionMetrics = useMemo(() => {
    const divisionData: Record<string, any> = {};

    divisions.forEach(division => {
      const divisionEmployees = Object.values(performanceMetrics).filter((metric: any) => 
        metric.division?.id === division.id
      );

      const totalScheduled = divisionEmployees.reduce((sum: number, metric: any) => sum + metric.scheduledHours, 0);
      const totalBooked = divisionEmployees.reduce((sum: number, metric: any) => sum + metric.bookedHours, 0);
      const totalRevenue = divisionEmployees.reduce((sum: number, metric: any) => sum + metric.serviceRevenue, 0);
      const avgProductivity = divisionEmployees.length > 0 
        ? Math.round(divisionEmployees.reduce((sum: number, metric: any) => sum + metric.productivity, 0) / divisionEmployees.length)
        : 0;

      divisionData[division.id] = {
        division,
        employeeCount: divisionEmployees.length,
        totalScheduled,
        totalBooked,
        percentHoursSold: totalScheduled > 0 ? Math.round((totalBooked / totalScheduled) * 100) : 0,
        totalRevenue,
        avgProductivity,
      };
    });

    return divisionData;
  }, [performanceMetrics, divisions]);

  // Generate trend data for past 3 months
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date(selectedYear, parseInt(selectedMonth) - 1 - i, 1);
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      // Get KPI data for this month
      const monthKPIData = kpiData.filter(data => 
        data.month === monthStr && 
        data.year === year &&
        (selectedDivision === 'all' || data.divisionId === selectedDivision)
      );

      const totalScheduled = 800; // Mock scheduled hours
      const totalBooked = monthKPIData.reduce((sum, data) => sum + data.hoursSold, 0);
      const totalRevenue = monthKPIData.reduce((sum, data) => sum + (data.averageTicket * data.newClients), 0);
      const avgProductivity = monthKPIData.length > 0 
        ? Math.round(monthKPIData.reduce((sum, data) => sum + data.productivityRate, 0) / monthKPIData.length)
        : 0;

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        scheduledHours: totalScheduled,
        bookedHours: totalBooked,
        percentHoursSold: totalScheduled > 0 ? Math.round((totalBooked / totalScheduled) * 100) : 0,
        revenue: totalRevenue,
        productivity: avgProductivity,
      });
    }
    return months;
  }, [kpiData, selectedDivision, selectedMonth, selectedYear]);

  const chartData = Object.values(performanceMetrics).map((metric: any) => ({
    name: metric.employee.name.split(' ')[0],
    scheduled: metric.scheduledHours,
    booked: metric.bookedHours,
    productivity: metric.productivity,
    revenue: metric.serviceRevenue,
  }));

  const locations = ['St. Albert', 'Spruce Grove', 'Sherwood Park', 'Wellness', 'Remote'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-[#f4647d] mr-2" />
            <h3 className="text-xl font-bold text-gray-900">Scheduling Performance Snapshot</h3>
          </div>
          
          <div className="text-sm text-gray-600">
            {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="productivity">Productivity %</option>
              <option value="hours">Hours (Scheduled vs Booked)</option>
              <option value="revenue">Service Revenue</option>
              <option value="utilization">% Hours Sold</option>
            </select>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Scheduled</p>
                <p className="text-2xl font-bold">
                  {Object.values(performanceMetrics).reduce((sum: number, metric: any) => sum + metric.scheduledHours, 0)}h
                </p>
              </div>
              <Clock className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Booked</p>
                <p className="text-2xl font-bold">
                  {Object.values(performanceMetrics).reduce((sum: number, metric: any) => sum + metric.bookedHours, 0)}h
                </p>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">% Hours Sold</p>
                <p className="text-2xl font-bold">
                  {Object.values(performanceMetrics).length > 0 
                    ? Math.round(Object.values(performanceMetrics).reduce((sum: number, metric: any) => sum + metric.percentHoursSold, 0) / Object.values(performanceMetrics).length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Service Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Object.values(performanceMetrics).reduce((sum: number, metric: any) => sum + metric.serviceRevenue, 0))}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Productivity</p>
                <p className="text-2xl font-bold">
                  {Object.values(performanceMetrics).length > 0 
                    ? Math.round(Object.values(performanceMetrics).reduce((sum: number, metric: any) => sum + metric.productivity, 0) / Object.values(performanceMetrics).length)
                    : 0}%
                </p>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal vs Actual Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Goal vs Actual Performance</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled Hours" />
                <Bar dataKey="booked" fill="#10b981" name="Booked Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3-Month Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">3-Month Trend</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="percentHoursSold" 
                  stroke="#f4647d" 
                  strokeWidth={3}
                  name="% Hours Sold" 
                />
                <Line 
                  type="monotone" 
                  dataKey="productivity" 
                  stroke="#0c5b63" 
                  strokeWidth={3}
                  name="Productivity %" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Division Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900">Division Performance Summary</h4>
        </div>
        
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
                  Scheduled Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booked Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Hours Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Productivity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.values(divisionMetrics).map((divData: any) => (
                <tr key={divData.division.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: divData.division.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {divData.division.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {divData.employeeCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {divData.totalScheduled}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {divData.totalBooked}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{divData.percentHoursSold}%</span>
                      <div className={`ml-2 w-2 h-2 rounded-full ${
                        divData.percentHoursSold >= 90 ? 'bg-green-500' :
                        divData.percentHoursSold >= 80 ? 'bg-yellow-500' :
                        divData.percentHoursSold >= 70 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(divData.totalRevenue)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900">Employee Performance Detail</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booked Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Hours Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productivity %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.values(performanceMetrics)
                .sort((a: any, b: any) => b.serviceRevenue - a.serviceRevenue)
                .map((metric: any) => (
                <tr key={metric.employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                        style={{ backgroundColor: metric.division?.color }}
                      >
                        {metric.employee.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{metric.employee.name}</div>
                        <div className="text-sm text-gray-500">{metric.employee.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${metric.division?.color}20`, 
                        color: metric.division?.color 
                      }}
                    >
                      {metric.division?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.scheduledHours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.bookedHours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{metric.percentHoursSold}%</span>
                      <div className={`ml-2 w-2 h-2 rounded-full ${
                        metric.percentHoursSold >= 90 ? 'bg-green-500' :
                        metric.percentHoursSold >= 80 ? 'bg-yellow-500' :
                        metric.percentHoursSold >= 70 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(metric.serviceRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{metric.productivity}%</span>
                      <div className={`ml-2 w-2 h-2 rounded-full ${
                        metric.productivity >= 90 ? 'bg-green-500' :
                        metric.productivity >= 80 ? 'bg-yellow-500' :
                        metric.productivity >= 70 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`} />
                    </div>
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

export default SchedulingPerformanceDashboard;