import React, { useState, useMemo } from 'react';
import { Division, User } from '../types/division';
import { BusinessExpenseData } from '../types/businessExpenses';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatCurrency } from '../utils/scoring';
import { 
  Building2, MapPin, DollarSign, TrendingUp, TrendingDown,
  Plus, Save, Calendar, BarChart3, Target, Eye, Filter, X, AlertCircle,
  Grid, List, Download, FileText, Edit, Trash2, PieChart, 
  Activity, Clock, Users, Zap
} from 'lucide-react';
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

interface BusinessSnapshotProps {
  divisions: Division[];
  currentUser: User;
}

const BusinessSnapshot: React.FC<BusinessSnapshotProps> = ({
  divisions,
  currentUser,
}) => {
  const [businessExpenses, setBusinessExpenses] = useLocalStorage<BusinessExpenseData[]>('businessExpenses', []);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'monthly' | 'ytd'>('monthly');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'trends'>('overview');
  const [showImportForm, setShowImportForm] = useState<boolean>(false);
  const [importForm, setImportForm] = useState<Partial<BusinessExpenseData>>({
    month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    year: new Date().getFullYear(),
    location: 'St. Albert',
  });

  const locations = ['St. Albert', 'Spruce Grove', 'Sherwood Park', 'Wellness'];

  // Calculate current month and YTD metrics
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear = new Date().getFullYear();

  // Mock revenue data (in real system, this would come from actual revenue tracking)
  const mockRevenueData = useMemo(() => {
    const revenueByLocation: Record<string, Record<string, number>> = {};
    const revenueByDivision: Record<string, Record<string, number>> = {};

    // Generate realistic revenue data for each location and month
    locations.forEach(location => {
      revenueByLocation[location] = {};
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        // Base revenue varies by location
        const baseRevenue = {
          'St. Albert': 180000,
          'Spruce Grove': 150000,
          'Sherwood Park': 165000,
          'Wellness': 120000,
        }[location] || 100000;
        
        // Add some variation
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        revenueByLocation[location][monthStr] = Math.round(baseRevenue * (1 + variation));
      }
    });

    // Generate division revenue data
    divisions.forEach(division => {
      revenueByDivision[division.id] = {};
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        // Base revenue varies by division
        const baseRevenue = {
          'laser': 200000,
          'injectables': 180000,
          'hormone': 160000,
          'new-patient': 140000,
          'guest-care': 80000,
          'nutrition': 90000,
          'iv-therapy': 70000,
          'feminine': 60000,
        }[division.id] || 50000;
        
        const variation = (Math.random() - 0.5) * 0.15;
        revenueByDivision[division.id][monthStr] = Math.round(baseRevenue * (1 + variation));
      }
    });

    return { revenueByLocation, revenueByDivision };
  }, [locations, divisions]);

  // Calculate location metrics
  const locationMetrics = useMemo(() => {
    return locations.map(location => {
      // Get expenses for this location
      const locationExpenses = businessExpenses.filter(expense => expense.location === location);
      
      // Calculate monthly and YTD totals
      const monthlyExpense = locationExpenses.find(exp => 
        exp.month === currentMonth && exp.year === currentYear
      );
      
      const ytdExpenses = locationExpenses
        .filter(exp => exp.year === currentYear && parseInt(exp.month) <= parseInt(currentMonth))
        .reduce((sum, exp) => sum + exp.totalExpenses, 0);

      // Get revenue data
      const monthlyRevenue = mockRevenueData.revenueByLocation[location]?.[currentMonth] || 0;
      const ytdRevenue = Object.entries(mockRevenueData.revenueByLocation[location] || {})
        .filter(([month]) => parseInt(month) <= parseInt(currentMonth))
        .reduce((sum, [, revenue]) => sum + revenue, 0);

      // Calculate metrics
      const monthlyProfit = monthlyRevenue - (monthlyExpense?.totalExpenses || 0);
      const ytdProfit = ytdRevenue - ytdExpenses;
      const monthlyMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
      const ytdMargin = ytdRevenue > 0 ? (ytdProfit / ytdRevenue) * 100 : 0;

      return {
        location,
        monthlyRevenue,
        monthlyExpenses: monthlyExpense?.totalExpenses || 0,
        monthlyProfit,
        monthlyMargin,
        ytdRevenue,
        ytdExpenses,
        ytdProfit,
        ytdMargin,
        hasData: !!monthlyExpense,
      };
    });
  }, [businessExpenses, currentMonth, currentYear, mockRevenueData]);

  // Calculate division metrics
  const divisionMetrics = useMemo(() => {
    return divisions.map(division => {
      // Get division expenses (allocated from location expenses)
      const divisionExpenses = businessExpenses.filter(expense => 
        expense.divisionAllocations && expense.divisionAllocations[division.id]
      );

      // Calculate monthly and YTD division expenses
      const monthlyDivisionExpense = divisionExpenses
        .filter(exp => exp.month === currentMonth && exp.year === currentYear)
        .reduce((sum, exp) => sum + (exp.divisionAllocations![division.id] || 0), 0);

      const ytdDivisionExpenses = divisionExpenses
        .filter(exp => exp.year === currentYear && parseInt(exp.month) <= parseInt(currentMonth))
        .reduce((sum, exp) => sum + (exp.divisionAllocations![division.id] || 0), 0);

      // Get payroll data for division (mock data)
      const monthlyPayroll = monthlyDivisionExpense * 0.6; // Assume 60% of expenses are payroll
      const ytdPayroll = ytdDivisionExpenses * 0.6;

      // Get revenue data
      const monthlyRevenue = mockRevenueData.revenueByDivision[division.id]?.[currentMonth] || 0;
      const ytdRevenue = Object.entries(mockRevenueData.revenueByDivision[division.id] || {})
        .filter(([month]) => parseInt(month) <= parseInt(currentMonth))
        .reduce((sum, [, revenue]) => sum + revenue, 0);

      // Calculate payroll to revenue ratio
      const monthlyPayrollRatio = monthlyRevenue > 0 ? (monthlyPayroll / monthlyRevenue) * 100 : 0;
      const ytdPayrollRatio = ytdRevenue > 0 ? (ytdPayroll / ytdRevenue) * 100 : 0;

      // Calculate profit metrics
      const monthlyProfit = monthlyRevenue - monthlyDivisionExpense;
      const ytdProfit = ytdRevenue - ytdDivisionExpenses;
      const monthlyMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
      const ytdMargin = ytdRevenue > 0 ? (ytdProfit / ytdRevenue) * 100 : 0;

      return {
        division,
        monthlyRevenue,
        monthlyExpenses: monthlyDivisionExpense,
        monthlyPayroll,
        monthlyPayrollRatio,
        monthlyProfit,
        monthlyMargin,
        ytdRevenue,
        ytdExpenses: ytdDivisionExpenses,
        ytdPayroll,
        ytdPayrollRatio,
        ytdProfit,
        ytdMargin,
        hasData: monthlyDivisionExpense > 0,
      };
    });
  }, [divisions, businessExpenses, currentMonth, currentYear, mockRevenueData]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalMonthlyRevenue = locationMetrics.reduce((sum, loc) => sum + loc.monthlyRevenue, 0);
    const totalMonthlyExpenses = locationMetrics.reduce((sum, loc) => sum + loc.monthlyExpenses, 0);
    const totalYtdRevenue = locationMetrics.reduce((sum, loc) => sum + loc.ytdRevenue, 0);
    const totalYtdExpenses = locationMetrics.reduce((sum, loc) => sum + loc.ytdExpenses, 0);

    const monthlyProfit = totalMonthlyRevenue - totalMonthlyExpenses;
    const ytdProfit = totalYtdRevenue - totalYtdExpenses;
    const monthlyMargin = totalMonthlyRevenue > 0 ? (monthlyProfit / totalMonthlyRevenue) * 100 : 0;
    const ytdMargin = totalYtdRevenue > 0 ? (ytdProfit / totalYtdRevenue) * 100 : 0;

    return {
      totalMonthlyRevenue,
      totalMonthlyExpenses,
      monthlyProfit,
      monthlyMargin,
      totalYtdRevenue,
      totalYtdExpenses,
      ytdProfit,
      ytdMargin,
      locationsWithData: locationMetrics.filter(loc => loc.hasData).length,
      divisionsWithData: divisionMetrics.filter(div => div.hasData).length,
    };
  }, [locationMetrics, divisionMetrics]);

  // Generate trend data for charts
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, parseInt(currentMonth) - 1 - i, 1);
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      // Calculate totals for this month
      const monthExpenses = businessExpenses
        .filter(exp => exp.month === monthStr && exp.year === year)
        .reduce((sum, exp) => sum + exp.totalExpenses, 0);

      const monthRevenue = Object.values(mockRevenueData.revenueByLocation)
        .reduce((sum, locationRevenue) => sum + (locationRevenue[monthStr] || 0), 0);

      const profit = monthRevenue - monthExpenses;
      const margin = monthRevenue > 0 ? (profit / monthRevenue) * 100 : 0;

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit,
        margin,
      });
    }
    return months;
  }, [businessExpenses, currentMonth, currentYear, mockRevenueData]);

  const handleSaveExpense = () => {
    if (!importForm.location || !importForm.month || !importForm.year) {
      alert('Please fill in all required fields');
      return;
    }

    const newExpense: BusinessExpenseData = {
      id: `expense-${Date.now()}`,
      location: importForm.location!,
      month: importForm.month!,
      year: importForm.year!,
      rent: importForm.rent || 0,
      utilities: importForm.utilities || 0,
      insurance: importForm.insurance || 0,
      supplies: importForm.supplies || 0,
      marketing: importForm.marketing || 0,
      maintenance: importForm.maintenance || 0,
      otherExpenses: importForm.otherExpenses || 0,
      totalExpenses: (importForm.rent || 0) + (importForm.utilities || 0) + (importForm.insurance || 0) + 
                    (importForm.supplies || 0) + (importForm.marketing || 0) + (importForm.maintenance || 0) + 
                    (importForm.otherExpenses || 0),
      divisionAllocations: importForm.divisionAllocations || {},
      enteredBy: currentUser.id,
      enteredAt: new Date(),
      lastUpdatedBy: currentUser.id,
      lastUpdatedAt: new Date(),
    };

    setBusinessExpenses(prev => {
      const filtered = prev.filter(exp => 
        !(exp.location === newExpense.location && 
          exp.month === newExpense.month && 
          exp.year === newExpense.year)
      );
      return [...filtered, newExpense];
    });

    setShowImportForm(false);
    setImportForm({
      month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
      year: new Date().getFullYear(),
      location: 'St. Albert',
    });
  };

  const exportData = () => {
    const csvData = [
      ['Location', 'Month', 'Year', 'Rent', 'Utilities', 'Insurance', 'Supplies', 'Marketing', 'Maintenance', 'Other', 'Total Expenses'],
      ...businessExpenses.map(expense => [
        expense.location,
        expense.month,
        expense.year.toString(),
        expense.rent.toString(),
        expense.utilities.toString(),
        expense.insurance.toString(),
        expense.supplies.toString(),
        expense.marketing.toString(),
        expense.maintenance.toString(),
        expense.otherExpenses.toString(),
        expense.totalExpenses.toString(),
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-expenses-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#0c5b63] to-[#0f6b73] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Business Snapshot</h1>
              <p className="text-white/80 text-lg">Financial overview by location and division</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Current Period</div>
            <div className="text-xl font-bold">
              {new Date(currentYear, parseInt(currentMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div className="text-sm text-white/70">
              {summaryMetrics.locationsWithData} of {locations.length} locations with data
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">
                  {selectedTimeframe === 'monthly' ? 'Monthly' : 'YTD'} Revenue
                </h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(selectedTimeframe === 'monthly' ? summaryMetrics.totalMonthlyRevenue : summaryMetrics.totalYtdRevenue)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Total across all locations</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">
                  {selectedTimeframe === 'monthly' ? 'Monthly' : 'YTD'} Expenses
                </h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(selectedTimeframe === 'monthly' ? summaryMetrics.totalMonthlyExpenses : summaryMetrics.totalYtdExpenses)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Operating expenses</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">
                  {selectedTimeframe === 'monthly' ? 'Monthly' : 'YTD'} Profit
                </h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(selectedTimeframe === 'monthly' ? summaryMetrics.monthlyProfit : summaryMetrics.ytdProfit)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Revenue minus expenses</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Profit Margin</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {(selectedTimeframe === 'monthly' ? summaryMetrics.monthlyMargin : summaryMetrics.ytdMargin).toFixed(1)}%
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Profitability percentage</div>
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
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c5b63] bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Frame</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as 'monthly' | 'ytd')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c5b63] bg-white"
              >
                <option value="monthly">Current Month</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'overview' ? 'bg-white text-[#0c5b63] shadow-sm' : 'text-gray-600'
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Overview
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'detailed' ? 'bg-white text-[#0c5b63] shadow-sm' : 'text-gray-600'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Detailed
              </button>
              <button
                onClick={() => setViewMode('trends')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'trends' ? 'bg-white text-[#0c5b63] shadow-sm' : 'text-gray-600'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </button>
            </div>

            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            <button
              onClick={() => setShowImportForm(true)}
              className="flex items-center px-4 py-2 bg-[#0c5b63] text-white rounded-lg hover:bg-[#0f6b73] transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Location Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Location Financial Overview</h3>
              <p className="text-gray-600">Revenue, expenses, and profitability by location</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {locationMetrics.map(location => (
                <div key={location.location} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{location.location}</h4>
                      <p className="text-sm text-gray-600">
                        {selectedTimeframe === 'monthly' ? 'Monthly' : 'YTD'} Performance
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Revenue:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(selectedTimeframe === 'monthly' ? location.monthlyRevenue : location.ytdRevenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expenses:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(selectedTimeframe === 'monthly' ? location.monthlyExpenses : location.ytdExpenses)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                      <span className="text-sm font-medium text-gray-900">Profit:</span>
                      <span className={`font-bold ${
                        (selectedTimeframe === 'monthly' ? location.monthlyProfit : location.ytdProfit) >= 0 
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(selectedTimeframe === 'monthly' ? location.monthlyProfit : location.ytdProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Margin:</span>
                      <span className={`font-semibold ${
                        (selectedTimeframe === 'monthly' ? location.monthlyMargin : location.ytdMargin) >= 20 
                          ? 'text-green-600' : 
                        (selectedTimeframe === 'monthly' ? location.monthlyMargin : location.ytdMargin) >= 10 
                          ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(selectedTimeframe === 'monthly' ? location.monthlyMargin : location.ytdMargin).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className={`mt-4 p-3 rounded-lg ${
                    location.hasData ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center">
                      {location.hasData ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        location.hasData ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {location.hasData ? 'Data Available' : 'No Expense Data'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Division Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Division Financial Overview</h3>
              <p className="text-gray-600">Revenue, expenses, and payroll ratios by division</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {divisionMetrics.map(divData => (
                <div key={divData.division.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-4"
                      style={{ backgroundColor: divData.division.color }}
                    >
                      {divData.division.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{divData.division.name}</h4>
                      <p className="text-sm text-gray-600">
                        {selectedTimeframe === 'monthly' ? 'Monthly' : 'YTD'} Performance
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Revenue:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(selectedTimeframe === 'monthly' ? divData.monthlyRevenue : divData.ytdRevenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payroll:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(selectedTimeframe === 'monthly' ? divData.monthlyPayroll : divData.ytdPayroll)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payroll %:</span>
                      <span className={`font-bold ${
                        (selectedTimeframe === 'monthly' ? divData.monthlyPayrollRatio : divData.ytdPayrollRatio) <= 18 
                          ? 'text-green-600' :
                        (selectedTimeframe === 'monthly' ? divData.monthlyPayrollRatio : divData.ytdPayrollRatio) <= 25 
                          ? 'text-yellow-600' :
                        (selectedTimeframe === 'monthly' ? divData.monthlyPayrollRatio : divData.ytdPayrollRatio) <= 30 
                          ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {(selectedTimeframe === 'monthly' ? divData.monthlyPayrollRatio : divData.ytdPayrollRatio).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                      <span className="text-sm font-medium text-gray-900">Profit:</span>
                      <span className={`font-bold ${
                        (selectedTimeframe === 'monthly' ? divData.monthlyProfit : divData.ytdProfit) >= 0 
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(selectedTimeframe === 'monthly' ? divData.monthlyProfit : divData.ytdProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Margin:</span>
                      <span className={`font-semibold ${
                        (selectedTimeframe === 'monthly' ? divData.monthlyMargin : divData.ytdMargin) >= 20 
                          ? 'text-green-600' : 
                        (selectedTimeframe === 'monthly' ? divData.monthlyMargin : divData.ytdMargin) >= 10 
                          ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(selectedTimeframe === 'monthly' ? divData.monthlyMargin : divData.ytdMargin).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className={`mt-4 p-3 rounded-lg ${
                    divData.hasData ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center">
                      {divData.hasData ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        divData.hasData ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {divData.hasData ? 'Expense Data Available' : 'No Expense Allocation'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Mode */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {/* Location Details Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Location Financial Details</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {selectedTimeframe === 'monthly' ? 'Monthly' : 'YTD'} Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {selectedTimeframe === 'monthly' ? 'Monthly' : 'YTD'} Expenses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margin %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locationMetrics.map(location => (
                    <tr key={location.location} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-blue-500 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{location.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(selectedTimeframe === 'monthly' ? location.monthlyRevenue : location.ytdRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(selectedTimeframe === 'monthly' ? location.monthlyExpenses : location.ytdExpenses)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          (selectedTimeframe === 'monthly' ? location.monthlyProfit : location.ytdProfit) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                        }>
                          {formatCurrency(selectedTimeframe === 'monthly' ? location.monthlyProfit : location.ytdProfit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          (selectedTimeframe === 'monthly' ? location.monthlyMargin : location.ytdMargin) >= 20 
                            ? 'text-green-600' : 
                          (selectedTimeframe === 'monthly' ? location.monthlyMargin : location.ytdMargin) >= 10 
                            ? 'text-yellow-600' : 'text-red-600'
                        }>
                          {(selectedTimeframe === 'monthly' ? location.monthlyMargin : location.ytdMargin).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          location.hasData ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {location.hasData ? 'Complete' : 'Missing Data'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Division Details Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Division Financial Details</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Division
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {selectedTimeframe === 'monthly' ? 'Monthly' : 'YTD'} Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payroll
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payroll %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margin %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {divisionMetrics.map(divData => (
                    <tr key={divData.division.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold mr-3"
                            style={{ backgroundColor: divData.division.color }}
                          >
                            {divData.division.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{divData.division.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(selectedTimeframe === 'monthly' ? divData.monthlyRevenue : divData.ytdRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(selectedTimeframe === 'monthly' ? divData.monthlyPayroll : divData.ytdPayroll)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          (selectedTimeframe === 'monthly' ? divData.monthlyPayrollRatio : divData.ytdPayrollRatio) <= 18 
                            ? 'text-green-600' :
                          (selectedTimeframe === 'monthly' ? divData.monthlyPayrollRatio : divData.ytdPayrollRatio) <= 25 
                            ? 'text-yellow-600' :
                          (selectedTimeframe === 'monthly' ? divData.monthlyPayrollRatio : divData.ytdPayrollRatio) <= 30 
                            ? 'text-orange-600' : 'text-red-600'
                        }>
                          {(selectedTimeframe === 'monthly' ? divData.monthlyPayrollRatio : divData.ytdPayrollRatio).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          (selectedTimeframe === 'monthly' ? divData.monthlyProfit : divData.ytdProfit) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                        }>
                          {formatCurrency(selectedTimeframe === 'monthly' ? divData.monthlyProfit : divData.ytdProfit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={
                          (selectedTimeframe === 'monthly' ? divData.monthlyMargin : divData.ytdMargin) >= 20 
                            ? 'text-green-600' : 
                          (selectedTimeframe === 'monthly' ? divData.monthlyMargin : divData.ytdMargin) >= 10 
                            ? 'text-yellow-600' : 'text-red-600'
                        }>
                          {(selectedTimeframe === 'monthly' ? divData.monthlyMargin : divData.ytdMargin).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          divData.hasData ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {divData.hasData ? 'Complete' : 'No Allocation'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trends Mode */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Financial Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'margin' ? `${Number(value).toFixed(1)}%` : formatCurrency(Number(value)),
                      name === 'revenue' ? 'Revenue' : 
                      name === 'expenses' ? 'Expenses' : 
                      name === 'profit' ? 'Profit' : 'Margin %'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0c5b63" 
                    strokeWidth={3}
                    name="Revenue" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name="Expenses" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Profit" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="margin" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Margin %" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Manual Import Modal */}
      {showImportForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Monthly Expenses</h3>
              <button
                onClick={() => setShowImportForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <select
                    value={importForm.location || ''}
                    onChange={(e) => setImportForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  >
                    {locations.map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month *</label>
                  <select
                    value={importForm.month || ''}
                    onChange={(e) => setImportForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                  <select
                    value={importForm.year || ''}
                    onChange={(e) => setImportForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>

              {/* Expense Categories */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expenses</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rent ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={importForm.rent || ''}
                      onChange={(e) => setImportForm(prev => ({ ...prev, rent: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                      placeholder="15000.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Utilities ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={importForm.utilities || ''}
                      onChange={(e) => setImportForm(prev => ({ ...prev, utilities: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                      placeholder="3500.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Insurance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={importForm.insurance || ''}
                      onChange={(e) => setImportForm(prev => ({ ...prev, insurance: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                      placeholder="2500.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplies ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={importForm.supplies || ''}
                      onChange={(e) => setImportForm(prev => ({ ...prev, supplies: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                      placeholder="5000.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marketing ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={importForm.marketing || ''}
                      onChange={(e) => setImportForm(prev => ({ ...prev, marketing: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                      placeholder="4000.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={importForm.maintenance || ''}
                      onChange={(e) => setImportForm(prev => ({ ...prev, maintenance: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                      placeholder="1500.00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Other Expenses ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={importForm.otherExpenses || ''}
                      onChange={(e) => setImportForm(prev => ({ ...prev, otherExpenses: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                      placeholder="2000.00"
                    />
                  </div>
                </div>

                {/* Total Calculation */}
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Monthly Expenses:</span>
                    <span className="text-2xl font-bold text-[#0c5b63]">
                      {formatCurrency(
                        (importForm.rent || 0) + 
                        (importForm.utilities || 0) + 
                        (importForm.insurance || 0) + 
                        (importForm.supplies || 0) + 
                        (importForm.marketing || 0) + 
                        (importForm.maintenance || 0) + 
                        (importForm.otherExpenses || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Division Allocation (Optional) */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Division Expense Allocation (Optional)</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Allocate expenses to specific divisions for more accurate profitability tracking.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {divisions.map(division => (
                    <div key={division.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {division.name} ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={importForm.divisionAllocations?.[division.id] || ''}
                        onChange={(e) => setImportForm(prev => ({
                          ...prev,
                          divisionAllocations: {
                            ...prev.divisionAllocations,
                            [division.id]: parseFloat(e.target.value) || 0
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowImportForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveExpense}
                  className="px-4 py-2 bg-[#0c5b63] text-white rounded-md hover:bg-[#0f6b73] flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Expenses
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSnapshot;