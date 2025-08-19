import React, { useState, useMemo } from 'react';
import { Division, User } from '../types/division';
import { BusinessKPIData } from '../types/businessKPI';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatCurrency } from '../utils/scoring';
import { 
  DollarSign, Save, Calendar, Building2, TrendingUp, 
  BarChart3, Target, CheckCircle, AlertCircle, Plus,
  Edit, Trash2, Download, Upload, RefreshCw
} from 'lucide-react';

interface BusinessKPIEntryProps {
  divisions: Division[];
  currentUser: User;
}

const BusinessKPIEntry: React.FC<BusinessKPIEntryProps> = ({
  divisions,
  currentUser,
}) => {
  const [businessKPIData, setBusinessKPIData] = useLocalStorage<BusinessKPIData[]>('businessKPIData', []);
  const [selectedDivision, setSelectedDivision] = useState<string>(divisions[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form data state
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
      data.divisionId === selectedDivision &&
      data.month === selectedMonth &&
      data.year === selectedYear
    );
  }, [businessKPIData, selectedDivision, selectedMonth, selectedYear]);

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

  const handleInputChange = (field: keyof BusinessKPIData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!selectedDivision) {
      alert('Please select a division');
      return;
    }

    const now = new Date();
    const kpiEntry: BusinessKPIData = {
      id: existingData?.id || `bkpi-${Date.now()}`,
      divisionId: selectedDivision,
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
        !(data.divisionId === selectedDivision && 
          data.month === selectedMonth && 
          data.year === selectedYear)
      );
      return [...filtered, kpiEntry];
    });

    const divisionName = divisions.find(d => d.id === selectedDivision)?.name || 'Division';
    setSuccessMessage(`${divisionName} business KPIs saved successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = () => {
    if (!existingData) return;
    
    const divisionName = divisions.find(d => d.id === selectedDivision)?.name || 'Division';
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

  const selectedDivisionData = divisions.find(d => d.id === selectedDivision);
  const completedEntries = businessKPIData.filter(data => 
    data.month === selectedMonth && data.year === selectedYear
  ).length;

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const currentMonthData = businessKPIData.filter(data => 
      data.month === selectedMonth && data.year === selectedYear
    );

    const totalRevenue = currentMonthData.reduce((sum, data) => sum + data.totalRevenue, 0);
    const totalExpenses = currentMonthData.reduce((sum, data) => sum + data.totalExpenses, 0);
    const totalNetIncome = currentMonthData.reduce((sum, data) => sum + data.netIncome, 0);
    const avgMargin = currentMonthData.length > 0 
      ? currentMonthData.reduce((sum, data) => sum + data.marginPercentage, 0) / currentMonthData.length
      : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalNetIncome,
      avgMargin,
      completedDivisions: currentMonthData.length,
    };
  }, [businessKPIData, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#ec4899] to-[#f472b6] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Business KPI Entry</h1>
              <p className="text-white/80 text-lg">Manual financial data entry per division</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Current Period</div>
            <div className="text-xl font-bold">
              {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div className="text-sm text-white/70">
              {completedEntries} of {divisions.length} divisions completed
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
                <h3 className="text-sm font-medium text-white/80 mb-2">Avg Margin</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {summaryMetrics.avgMargin.toFixed(1)}%
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Average profit margin</div>
          </div>
        </div>
      </div>

      {/* Data Entry Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-[#ec4899] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Business KPI Data Entry</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Revenue Section */}
        <div className="bg-green-50 rounded-xl p-6 mb-6">
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
        <div className="bg-red-50 rounded-xl p-6 mb-6">
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
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
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

      {/* Data Overview Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Entered Data Overview</h3>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businessKPIData
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedDivision(data.divisionId);
                            setSelectedMonth(data.month);
                            setSelectedYear(data.year);
                          }}
                          className="text-[#ec4899] hover:text-[#f472b6] mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {businessKPIData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No business KPI data entered yet. Start by selecting a division and entering financial data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessKPIEntry;