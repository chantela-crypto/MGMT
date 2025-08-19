import React, { useState, useMemo } from 'react';
import { Division, User } from '../types/division';
import { Employee } from '../types/employee';
import { BusinessKPIData } from '../types/businessKPI';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatCurrency } from '../utils/scoring';
import { 
  DollarSign, TrendingUp, BarChart3, Target, Calendar, Building2,
  Plus, Edit, Save, X, Download, Upload, RefreshCw, CheckCircle,
  AlertCircle, Trash2, Filter, Eye, Grid, List, PieChart
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

interface FinancialsDashboardProps {
  divisions: Division[];
  employees: Employee[];
  currentUser: User;
}

const FinancialsDashboard: React.FC<FinancialsDashboardProps> = ({
  divisions,
  employees,
  currentUser,
}) => {
  const [businessKPIData, setBusinessKPIData] = useLocalStorage<BusinessKPIData[]>('businessKPIData', []);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data-entry' | 'analytics'>('dashboard');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('current-month');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  
  // Data Entry Tab State
  const [entrySelectedDivision, setEntrySelectedDivision] = useState<string>(divisions[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form data state for data entry
  const [formData, setFormData] = useState<Partial<BusinessKPIData>>({
    serviceSales: 0,
    retailSales: 0,
    totalRevenue: 0,
    payroll: 0,
    locationExpenses: 0,
    locationRentUtilities: 0,
    totalExpenses: 0,
    netIncome: 0,
    netProfitPercentage: 0,
    marginPercentage: 0,
  });

  // Get existing data for selected division/month/year
  const existingData = useMemo(() => {
    return businessKPIData.find(data => 
      data.divisionId === entrySelectedDivision &&
      data.month === selectedMonth &&
      data.year === selectedYear
    );
  }, [businessKPIData, entrySelectedDivision, selectedMonth, selectedYear]);

  // Load existing data when selection changes
  React.useEffect(() => {
    if (existingData) {
      setFormData(existingData);
      setIsEditing(true);
    } else {
      setFormData({
        serviceSales: 0,
        retailSales: 0,
        totalRevenue: 0,
        payroll: 0,
        locationExpenses: 0,
        locationRentUtilities: 0,
        totalExpenses: 0,
        netIncome: 0,
        netProfitPercentage: 0,
        marginPercentage: 0,
      });
      setIsEditing(false);
    }
  }, [existingData]);

  // Auto-calculate derived fields
  React.useEffect(() => {
    const serviceSales = formData.serviceSales || 0;
    const retailSales = formData.retailSales || 0;
    const payroll = formData.payroll || 0;
    const locationExpenses = formData.locationExpenses || 0;
    const locationRentUtilities = formData.locationRentUtilities || 0;

    const totalRevenue = serviceSales + retailSales;
    const totalExpenses = payroll + locationExpenses + locationRentUtilities;
    const netIncome = totalRevenue - totalExpenses;
    const netProfitPercentage = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
    const marginPercentage = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    setFormData(prev => ({
      ...prev,
      totalRevenue,
      totalExpenses,
      netIncome,
      netProfitPercentage: Math.round(netProfitPercentage * 100) / 100,
      marginPercentage: Math.round(marginPercentage * 100) / 100,
    }));
  }, [formData.serviceSales, formData.retailSales, formData.payroll, formData.locationExpenses, formData.locationRentUtilities]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    let filtered = businessKPIData;
    
    if (selectedDivision !== 'all') {
      filtered = filtered.filter(data => data.divisionId === selectedDivision);
    }
    
    // Apply timeframe filter
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear();
    
    switch (selectedTimeframe) {
      case 'current-month':
        filtered = filtered.filter(data => 
          data.month === currentMonth && data.year === currentYear
        );
        break;
      case 'last-month':
        const lastMonth = now.getMonth() === 0 ? '12' : (now.getMonth()).toString().padStart(2, '0');
        const lastMonthYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;
        filtered = filtered.filter(data => 
          data.month === lastMonth && data.year === lastMonthYear
        );
        break;
      case 'quarter':
        const quarterStart = Math.floor((now.getMonth()) / 3) * 3 + 1;
        filtered = filtered.filter(data => 
          parseInt(data.month) >= quarterStart && 
          parseInt(data.month) < quarterStart + 3 && 
          data.year === currentYear
        );
        break;
      case 'year':
        filtered = filtered.filter(data => data.year === currentYear);
        break;
    }
    
    return filtered;
  }, [businessKPIData, selectedDivision, selectedTimeframe]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, data) => sum + data.totalRevenue, 0);
    const totalExpenses = filteredData.reduce((sum, data) => sum + data.totalExpenses, 0);
    const totalNetIncome = filteredData.reduce((sum, data) => sum + data.netIncome, 0);
    const avgMargin = filteredData.length > 0 
      ? filteredData.reduce((sum, data) => sum + data.marginPercentage, 0) / filteredData.length
      : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalNetIncome,
      avgMargin,
      completedDivisions: filteredData.length,
      profitMargin: totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0,
    };
  }, [filteredData]);

  // Generate trend data for charts
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      const monthData = businessKPIData.filter(data => 
        data.month === monthStr && 
        data.year === year &&
        (selectedDivision === 'all' || data.divisionId === selectedDivision)
      );

      const totalRevenue = monthData.reduce((sum, data) => sum + data.totalRevenue, 0);
      const totalExpenses = monthData.reduce((sum, data) => sum + data.totalExpenses, 0);
      const netIncome = monthData.reduce((sum, data) => sum + data.netIncome, 0);
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome,
        margin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
      });
    }
    return months;
  }, [businessKPIData, selectedDivision]);

  // Division breakdown for pie chart
  const divisionBreakdown = useMemo(() => {
    const breakdown = divisions.map(division => {
      const divisionData = filteredData.filter(data => data.divisionId === division.id);
      const totalRevenue = divisionData.reduce((sum, data) => sum + data.totalRevenue, 0);
      
      return {
        name: division.name,
        value: totalRevenue,
        color: division.color,
      };
    }).filter(item => item.value > 0);
    
    return breakdown;
  }, [filteredData, divisions]);

  const handleInputChange = (field: keyof BusinessKPIData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!entrySelectedDivision) {
      alert('Please select a division');
      return;
    }

    const now = new Date();
    const kpiEntry: BusinessKPIData = {
      id: existingData?.id || `bkpi-${Date.now()}`,
      divisionId: entrySelectedDivision,
      month: selectedMonth,
      year: selectedYear,
      serviceSales: formData.serviceSales || 0,
      retailSales: formData.retailSales || 0,
      totalRevenue: formData.totalRevenue || 0,
      payroll: formData.payroll || 0,
      locationExpenses: formData.locationExpenses || 0,
      locationRentUtilities: formData.locationRentUtilities || 0,
      totalExpenses: formData.totalExpenses || 0,
      netIncome: formData.netIncome || 0,
      netProfitPercentage: formData.netProfitPercentage || 0,
      marginPercentage: formData.marginPercentage || 0,
      enteredBy: existingData?.enteredBy || currentUser.id,
      enteredAt: existingData?.enteredAt || now,
      lastUpdatedBy: currentUser.id,
      lastUpdatedAt: now,
    };

    setBusinessKPIData(prev => {
      const filtered = prev.filter(data => 
        !(data.divisionId === entrySelectedDivision && 
          data.month === selectedMonth && 
          data.year === selectedYear)
      );
      return [...filtered, kpiEntry];
    });

    const divisionName = divisions.find(d => d.id === entrySelectedDivision)?.name || 'Division';
    setSuccessMessage(`${divisionName} business KPIs saved successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = () => {
    if (!existingData) return;
    
    const divisionName = divisions.find(d => d.id === entrySelectedDivision)?.name || 'Division';
    if (window.confirm(`Are you sure you want to delete ${divisionName} data for ${new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}?`)) {
      setBusinessKPIData(prev => prev.filter(data => data.id !== existingData.id));
      setSuccessMessage('Business KPI data deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const exportData = () => {
    const csvData = [
      ['Division', 'Month', 'Year', 'Service Sales', 'Retail Sales', 'Total Revenue', 'Payroll', 'Location Expenses', 'Rent + Utilities', 'Total Expenses', 'Net Income', 'Net Profit %', 'Margin %'],
      ...businessKPIData.map(data => {
        const division = divisions.find(d => d.id === data.divisionId);
        return [
          division?.name || 'Unknown',
          data.month,
          data.year.toString(),
          data.serviceSales.toString(),
          data.retailSales.toString(),
          data.totalRevenue.toString(),
          data.payroll.toString(),
          data.locationExpenses.toString(),
          data.locationRentUtilities.toString(),
          data.totalExpenses.toString(),
          data.netIncome.toString(),
          data.netProfitPercentage.toFixed(2),
          data.marginPercentage.toFixed(2),
        ];
      })
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-kpis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedDivisionData = divisions.find(d => d.id === entrySelectedDivision);
  const completedEntries = businessKPIData.filter(data => 
    data.month === selectedMonth && data.year === selectedYear
  ).length;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#ec4899] to-[#f472b6] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Business KPIs</h1>
              <p className="text-white/80 text-lg">Financial performance tracking and analysis</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Total Revenue</div>
            <div className="text-xl font-bold">
              {formatCurrency(summaryMetrics.totalRevenue)}
            </div>
            <div className="text-sm text-white/70">
              {summaryMetrics.completedDivisions} divisions reporting
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Revenue</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summaryMetrics.totalRevenue)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Across all divisions</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Expenses</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summaryMetrics.totalExpenses)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Total operating costs</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Net Income</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summaryMetrics.totalNetIncome)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
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
                  {summaryMetrics.profitMargin.toFixed(1)}%
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Overall profitability</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'dashboard'
                  ? 'border-[#ec4899] text-[#ec4899]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Financial Dashboard
            </button>
            <button
              onClick={() => setActiveTab('data-entry')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'data-entry'
                  ? 'border-[#ec4899] text-[#ec4899]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Data Entry
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'analytics'
                  ? 'border-[#ec4899] text-[#ec4899]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PieChart className="h-4 w-4 mr-2" />
              Analytics
            </button>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="h-4 w-4 inline mr-1" />
                    Division
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec4899] bg-white"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ec4899] bg-white"
                  >
                    <option value="current-month">Current Month</option>
                    <option value="last-month">Last Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('summary')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                      viewMode === 'summary' ? 'bg-white text-[#ec4899] shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Summary
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                      viewMode === 'detailed' ? 'bg-white text-[#ec4899] shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Detailed
                  </button>
                </div>

                <button
                  onClick={exportData}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trends */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Financial Trends</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'margin' ? `${Number(value).toFixed(1)}%` : formatCurrency(Number(value)),
                        name === 'revenue' ? 'Revenue' : 
                        name === 'expenses' ? 'Expenses' : 
                        name === 'netIncome' ? 'Net Income' : 'Margin %'
                      ]} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={3} name="Revenue" />
                      <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={3} name="Expenses" />
                      <Line type="monotone" dataKey="netIncome" stroke="#10b981" strokeWidth={3} name="Net Income" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Division Revenue Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Division</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={divisionBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      >
                        {divisionBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Financial Data Overview</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Division
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Expenses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Income
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margin %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData
                      .sort((a, b) => {
                        if (a.year !== b.year) return b.year - a.year;
                        if (a.month !== b.month) return parseInt(b.month) - parseInt(a.month);
                        return a.divisionId.localeCompare(b.divisionId);
                      })
                      .map(data => {
                        const division = divisions.find(d => d.id === data.divisionId);
                        
                        return (
                          <tr key={data.id} className="hover:bg-gray-50">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(data.year, parseInt(data.month) - 1).toLocaleDateString('en-US', { 
                                month: 'long', 
                                year: 'numeric' 
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(data.totalRevenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(data.totalExpenses)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <span className={data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(data.netIncome)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <span className={data.marginPercentage >= 20 ? 'text-green-600' : data.marginPercentage >= 10 ? 'text-yellow-600' : 'text-red-600'}>
                                {data.marginPercentage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    {filteredData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No financial data available for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Data Entry Tab */}
        {activeTab === 'data-entry' && (
          <div className="space-y-6">
            {/* Selection Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                <select
                  value={entrySelectedDivision}
                  onChange={(e) => setEntrySelectedDivision(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec4899] focus:border-transparent"
                >
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
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec4899] focus:border-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec4899] focus:border-transparent"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>

            {/* Current Selection Info */}
            {selectedDivisionData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3"
                    style={{ backgroundColor: selectedDivisionData.color }}
                  >
                    {selectedDivisionData.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Entering data for {selectedDivisionData.name}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })} • {isEditing ? 'Editing existing data' : 'Creating new entry'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-800">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">{successMessage}</span>
                </div>
              </div>
            )}

            {/* Revenue Section */}
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                Revenue Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Sales ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.serviceSales || ''}
                    onChange={(e) => handleInputChange('serviceSales', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retail Sales ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.retailSales || ''}
                    onChange={(e) => handleInputChange('retailSales', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Revenue ($)</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    {formatCurrency(formData.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated: Service + Retail</p>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="bg-red-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 text-red-600 mr-2" />
                Expense Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payroll ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.payroll || ''}
                    onChange={(e) => handleInputChange('payroll', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Expenses ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.locationExpenses || ''}
                    onChange={(e) => handleInputChange('locationExpenses', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rent + Utilities ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.locationRentUtilities || ''}
                    onChange={(e) => handleInputChange('locationRentUtilities', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Expenses ($)</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    {formatCurrency(formData.totalExpenses || 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated: Sum of all expenses</p>
                </div>
              </div>
            </div>

            {/* Profit Section */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 text-blue-600 mr-2" />
                Profit Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Net Income ($)</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    {formatCurrency(formData.netIncome || 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated: Revenue - Expenses</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Net Profit % (%)</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    {(formData.netProfitPercentage || 0).toFixed(2)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated: (Net Income / Revenue) × 100</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Margin % (%)</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                    {(formData.marginPercentage || 0).toFixed(2)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated: (Net Income / Revenue) × 100</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div>
                {existingData && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Entry
                  </button>
                )}
              </div>
              
              <button
                onClick={handleSave}
                className="flex items-center px-6 py-3 bg-[#ec4899] text-white rounded-lg hover:bg-[#f472b6] transition-colors"
              >
                <Save className="h-5 w-5 mr-2" />
                {isEditing ? 'Update Business KPIs' : 'Save Business KPIs'}
              </button>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Financial Analytics</h3>
            
            {/* Profit Margin Analysis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Profit Margin Analysis</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="margin" fill="#ec4899" name="Profit Margin %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Division Performance Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {divisions.map(division => {
                const divisionData = filteredData.filter(data => data.divisionId === division.id);
                const totalRevenue = divisionData.reduce((sum, data) => sum + data.totalRevenue, 0);
                const totalExpenses = divisionData.reduce((sum, data) => sum + data.totalExpenses, 0);
                const netIncome = divisionData.reduce((sum, data) => sum + data.netIncome, 0);
                const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

                if (divisionData.length === 0) return null;

                return (
                  <div key={division.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-4"
                        style={{ backgroundColor: division.color }}
                      >
                        {division.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{division.name}</h4>
                        <p className="text-sm text-gray-600">{divisionData.length} entries</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Revenue:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(totalRevenue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Expenses:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(totalExpenses)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                        <span className="text-sm font-medium text-gray-900">Net Income:</span>
                        <span className={`text-lg font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(netIncome)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Profit Margin:</span>
                        <span className={`font-semibold ${profitMargin >= 20 ? 'text-green-600' : profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialsDashboard;