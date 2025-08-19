import React, { useState, useMemo } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division, User } from '../types/division';
import { PayrollEntry } from '../types/payroll';
import { formatCurrency } from '../utils/scoring';
import { 
  DollarSign, Users, TrendingUp, TrendingDown, Target, BarChart3, 
  Calendar, Filter, Download, Settings, AlertCircle, CheckCircle,
  Eye, Grid, List, PieChart, Activity, Clock, Award, Upload, X
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

interface PayrollPercentagePage2Props {
  currentUser: User;
  divisions: Division[];
  employees?: Employee[];
  employeeKPIData?: EmployeeKPIData[];
}

const PayrollPercentagePage2: React.FC<PayrollPercentagePage2Props> = ({
  currentUser,
  divisions,
  employees = [],
  employeeKPIData = [],
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('current-month');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed' | 'trends'>('summary');
  const [showTargetSettings, setShowTargetSettings] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importData, setImportData] = useState<string>('');
  const [selectedImportMonth, setSelectedImportMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedImportYear, setSelectedImportYear] = useState<number>(new Date().getFullYear());
  
  // Payroll percentage targets
  const [payrollTargets, setPayrollTargets] = useState({
    excellent: 18, // ≤18%
    good: 25,      // 18-25%
    warning: 30,   // 25-30%
    poor: 30,      // >30%
  });

  // Generate realistic payroll data based on employee categories and performance
  const payrollData = useMemo((): PayrollEntry[] => {
    return employees.map(employee => {
      const division = divisions.find(d => d.id === employee.divisionId);
      const kpiData = employeeKPIData.find(data => 
        data.employeeId === employee.id && 
        data.month === (new Date().getMonth() + 1).toString().padStart(2, '0') && 
        data.year === new Date().getFullYear()
      );

      // Base hourly rates by category
      const baseRates: Record<string, number> = {
        'physician': 85,
        'nurse practitioner': 55,
        'nurse injector': 35,
        'laser technician': 22,
        'hormone specialist': 28,
        'administrative': 18,
        'marketing': 20,
        'sales': 19,
        'guest care': 17,
        'management': 45,
      };

      const baseRate = baseRates[employee.category] || 20;
      
      // Experience level multiplier
      const experienceMultiplier = {
        'Entry Level': 1.0,
        'Intermediate': 1.15,
        'Senior': 1.3,
        'Expert': 1.5,
      }[employee.experienceLevel] || 1.0;

      const hourlyRate = Math.round(baseRate * experienceMultiplier);
      const hoursScheduled = 160; // Standard monthly hours
      const hoursWorked = Math.round(hoursScheduled * 0.95); // 95% attendance
      
      // Calculate pay components
      const hourlyPay = hoursWorked * hourlyRate;
      
      // Commission based on performance and category
      let commissionPay = 0;
      if (kpiData && ['nurse injector', 'laser technician', 'sales'].includes(employee.category)) {
        const serviceRevenue = kpiData.serviceSalesPerHour * kpiData.hoursSold;
        const retailRevenue = serviceRevenue * (kpiData.retailPercentage / 100);
        
        // Service commission (2-8% based on category)
        const serviceCommissionRate = {
          'nurse injector': 0.08,
          'laser technician': 0.05,
          'sales': 0.06,
        }[employee.category] || 0.03;
        
        // Retail commission (5-15% based on category)
        const retailCommissionRate = {
          'nurse injector': 0.15,
          'laser technician': 0.10,
          'sales': 0.12,
        }[employee.category] || 0.08;
        
        commissionPay = Math.round(
          (serviceRevenue * serviceCommissionRate) + 
          (retailRevenue * retailCommissionRate)
        );
      }

      const otherEarnings = Math.round(Math.random() * 200); // Bonuses, etc.
      const deductions = Math.round((hourlyPay + commissionPay) * 0.25); // Taxes, benefits
      const totalPay = hourlyPay + commissionPay + otherEarnings - deductions;
      
      // Calculate revenue attribution
      const totalRevenue = kpiData 
        ? (kpiData.serviceSalesPerHour * kpiData.hoursSold) + 
          (kpiData.serviceSalesPerHour * kpiData.hoursSold * kpiData.retailPercentage / 100)
        : hourlyRate * hoursWorked * 2.5; // Fallback estimate

      const payrollToRevenuePercent = totalRevenue > 0 ? (totalPay / totalRevenue) * 100 : 0;

      // Determine status color
      let statusColor: 'red' | 'orange' | 'green' | 'yellow';
      if (payrollToRevenuePercent <= payrollTargets.excellent) {
        statusColor = 'green';
      } else if (payrollToRevenuePercent <= payrollTargets.good) {
        statusColor = 'yellow';
      } else if (payrollToRevenuePercent <= payrollTargets.warning) {
        statusColor = 'orange';
      } else {
        statusColor = 'red';
      }

      return {
        id: `payroll-${employee.id}`,
        payPeriodId: `period-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`,
        employeeId: employee.id,
        employeeNumber: employee.id.replace('emp-', ''),
        employeeName: employee.name,
        role: employee.position,
        homeLocation: employee.primaryLocation || employee.locations?.[0] || 'St. Albert',
        hoursScheduled,
        hoursWorked,
        hourlyRate,
        hourlyPay,
        commissionPay,
        otherEarnings,
        deductions,
        totalPay,
        totalRevenue,
        payrollToRevenuePercent,
        statusColor,
        notes: '',
        lastUpdatedBy: currentUser.id,
        lastUpdatedAt: new Date(),
      };
    });
  }, [employees, divisions, employeeKPIData, currentUser.id, payrollTargets]);

  // Filter payroll data
  const filteredPayrollData = useMemo(() => {
    let filtered = payrollData;
    
    if (selectedDivision !== 'all') {
      const divisionEmployeeIds = employees
        .filter(emp => emp.divisionId === selectedDivision)
        .map(emp => emp.id);
      filtered = filtered.filter(entry => divisionEmployeeIds.includes(entry.employeeId));
    }
    
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(entry => entry.homeLocation === selectedLocation);
    }
    
    return filtered;
  }, [payrollData, selectedDivision, selectedLocation, employees]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalPayroll = filteredPayrollData.reduce((sum, entry) => sum + entry.totalPay, 0);
    const totalRevenue = filteredPayrollData.reduce((sum, entry) => sum + entry.totalRevenue, 0);
    const overallPayrollPercentage = totalRevenue > 0 ? (totalPayroll / totalRevenue) * 100 : 0;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalPayroll) / totalRevenue) * 100 : 0;
    
    // Performance distribution
    const distribution = {
      excellent: filteredPayrollData.filter(entry => entry.payrollToRevenuePercent <= payrollTargets.excellent).length,
      good: filteredPayrollData.filter(entry => 
        entry.payrollToRevenuePercent > payrollTargets.excellent && 
        entry.payrollToRevenuePercent <= payrollTargets.good
      ).length,
      warning: filteredPayrollData.filter(entry => 
        entry.payrollToRevenuePercent > payrollTargets.good && 
        entry.payrollToRevenuePercent <= payrollTargets.warning
      ).length,
      poor: filteredPayrollData.filter(entry => entry.payrollToRevenuePercent > payrollTargets.warning).length,
    };

    return {
      totalPayroll,
      totalRevenue,
      overallPayrollPercentage,
      profitMargin,
      teamSize: filteredPayrollData.length,
      distribution,
    };
  }, [filteredPayrollData, payrollTargets]);

  // Calculate division summaries
  const divisionSummaries = useMemo(() => {
    return divisions.map(division => {
      const divisionData = filteredPayrollData.filter(entry => {
        const employee = employees.find(emp => emp.id === entry.employeeId);
        return employee?.divisionId === division.id;
      });

      const totalPayroll = divisionData.reduce((sum, entry) => sum + entry.totalPay, 0);
      const totalRevenue = divisionData.reduce((sum, entry) => sum + entry.totalRevenue, 0);
      const payrollPercentage = totalRevenue > 0 ? (totalPayroll / totalRevenue) * 100 : 0;

      return {
        division,
        teamSize: divisionData.length,
        totalPayroll,
        totalRevenue,
        payrollPercentage,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalPayroll) / totalRevenue) * 100 : 0,
      };
    }).filter(summary => summary.teamSize > 0);
  }, [divisions, filteredPayrollData, employees]);

  // Generate trend data (mock 6-month history)
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Mock historical data with slight variations
      const basePayrollPercent = summaryMetrics.overallPayrollPercentage;
      const variation = (Math.random() - 0.5) * 4; // ±2% variation
      const payrollPercent = Math.max(15, Math.min(35, basePayrollPercent + variation));
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        payrollPercentage: Math.round(payrollPercent * 10) / 10,
        profitMargin: Math.round((100 - payrollPercent - 45) * 10) / 10, // Assuming 45% other costs
        revenue: Math.round((summaryMetrics.totalRevenue * (0.8 + Math.random() * 0.4)) / 1000) * 1000,
      });
    }
    return months;
  }, [summaryMetrics]);

  // Pie chart data for performance distribution
  const pieChartData = [
    { name: 'Excellent (≤18%)', value: summaryMetrics.distribution.excellent, color: '#10b981' },
    { name: 'Good (18-25%)', value: summaryMetrics.distribution.good, color: '#3b82f6' },
    { name: 'Warning (25-30%)', value: summaryMetrics.distribution.warning, color: '#f59e0b' },
    { name: 'Poor (>30%)', value: summaryMetrics.distribution.poor, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const locations = ['St. Albert', 'Spruce Grove', 'Sherwood Park', 'Wellness'];

  const getStatusColor = (percentage: number) => {
    if (percentage <= payrollTargets.excellent) return 'text-green-600';
    if (percentage <= payrollTargets.good) return 'text-blue-600';
    if (percentage <= payrollTargets.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBgColor = (percentage: number) => {
    if (percentage <= payrollTargets.excellent) return 'bg-green-100';
    if (percentage <= payrollTargets.good) return 'bg-blue-100';
    if (percentage <= payrollTargets.warning) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const exportPayrollData = () => {
    const csvData = [
      ['Employee', 'Division', 'Location', 'Hours Worked', 'Total Pay', 'Total Revenue', 'Payroll %', 'Status'],
      ...filteredPayrollData.map(entry => {
        const employee = employees.find(emp => emp.id === entry.employeeId);
        const division = divisions.find(d => d.id === employee?.divisionId);
        return [
          entry.employeeName,
          division?.name || 'Unknown',
          entry.homeLocation,
          entry.hoursWorked.toString(),
          entry.totalPay.toString(),
          entry.totalRevenue.toString(),
          entry.payrollToRevenuePercent.toFixed(1),
          entry.statusColor
        ];
      })
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportPayrollData = () => {
    if (!importData.trim()) {
      alert('Please paste CSV data to import');
      return;
    }

    try {
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Expected headers: Employee, Division, Hours Worked, Total Pay, Total Revenue
      const requiredHeaders = ['Employee', 'Division', 'Hours Worked', 'Total Pay', 'Total Revenue'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        alert(`Missing required headers: ${missingHeaders.join(', ')}`);
        return;
      }

      const importedEntries: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;
        
        const employeeName = values[headers.indexOf('Employee')];
        const divisionName = values[headers.indexOf('Division')];
        const hoursWorked = parseFloat(values[headers.indexOf('Hours Worked')]) || 0;
        const totalPay = parseFloat(values[headers.indexOf('Total Pay')]) || 0;
        const totalRevenue = parseFloat(values[headers.indexOf('Total Revenue')]) || 0;
        
        // Find employee and division
        const employee = employees.find(emp => 
          emp.name.toLowerCase() === employeeName.toLowerCase()
        );
        const division = divisions.find(div => 
          div.name.toLowerCase() === divisionName.toLowerCase()
        );
        
        if (employee && division) {
          const payrollToRevenuePercent = totalRevenue > 0 ? (totalPay / totalRevenue) * 100 : 0;
          
          let statusColor: 'red' | 'orange' | 'green' | 'yellow';
          if (payrollToRevenuePercent <= payrollTargets.excellent) {
            statusColor = 'green';
          } else if (payrollToRevenuePercent <= payrollTargets.good) {
            statusColor = 'yellow';
          } else if (payrollToRevenuePercent <= payrollTargets.warning) {
            statusColor = 'orange';
          } else {
            statusColor = 'red';
          }
          
          importedEntries.push({
            id: `imported-${employee.id}-${selectedImportMonth}-${selectedImportYear}`,
            payPeriodId: `period-${selectedImportYear}-${selectedImportMonth}`,
            employeeId: employee.id,
            employeeNumber: employee.id.replace('emp-', ''),
            employeeName: employee.name,
            role: employee.position,
            homeLocation: employee.primaryLocation || employee.locations?.[0] || 'St. Albert',
            hoursScheduled: Math.round(hoursWorked * 1.05), // Estimate scheduled
            hoursWorked,
            hourlyRate: employee.hourlyWage || 20,
            hourlyPay: Math.round(hoursWorked * (employee.hourlyWage || 20)),
            commissionPay: Math.round(totalPay * 0.2), // Estimate commission
            otherEarnings: 0,
            deductions: Math.round(totalPay * 0.25), // Estimate deductions
            totalPay,
            totalRevenue,
            payrollToRevenuePercent,
            statusColor,
            notes: `Imported ${new Date().toLocaleDateString()}`,
            lastUpdatedBy: currentUser.id,
            lastUpdatedAt: new Date(),
          });
        }
      }
      
      if (importedEntries.length > 0) {
        // In a real app, this would save to the payroll data store
        alert(`Successfully imported ${importedEntries.length} payroll entries for ${new Date(selectedImportYear, parseInt(selectedImportMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
        setShowImportModal(false);
        setImportData('');
      } else {
        alert('No valid entries found to import. Please check employee and division names match exactly.');
      }
    } catch (error) {
      alert('Error parsing CSV data. Please check the format and try again.');
    }
  };
  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#0c5b63] to-[#0f6b73] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Payroll %</h1>
              <p className="text-white/80 text-lg">Payroll cost analysis and profitability tracking</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Overall Payroll %</div>
            <div className="text-xl font-bold">
              {summaryMetrics.overallPayrollPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-white/70">
              {summaryMetrics.teamSize} team members
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Payroll</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(summaryMetrics.totalPayroll)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Monthly payroll costs</div>
          </div>

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
            <div className="text-sm text-white/70">Revenue generated</div>
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
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">After payroll costs</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Team Size</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {summaryMetrics.teamSize}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Active employees</div>
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
                Division
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c5b63] bg-white"
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
                  viewMode === 'summary' ? 'bg-white text-[#0c5b63] shadow-sm' : 'text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4 mr-2" />
                Summary
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center ${
                  viewMode === 'detailed' ? 'bg-white text-[#0c5b63] shadow-sm' : 'text-gray-600'
                }`}
              >
                <List className="h-4 w-4 mr-2" />
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
              onClick={() => setShowTargetSettings(true)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Targets
            </button>

            <button
              onClick={exportPayrollData}
              className="flex items-center px-4 py-2 bg-[#0c5b63] text-white rounded-lg hover:bg-[#0f6b73] transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="space-y-6">
          {/* Division Summary Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Division Payroll Summary</h3>
              <p className="text-gray-600">Payroll costs and profitability by division</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {divisionSummaries.map(summary => (
                <div key={summary.division.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-4"
                      style={{ backgroundColor: summary.division.color }}
                    >
                      {summary.division.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{summary.division.name}</h4>
                      <p className="text-sm text-gray-600">{summary.teamSize} team members</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payroll:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(summary.totalPayroll)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Revenue:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(summary.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                      <span className="text-sm font-medium text-gray-900">Payroll %:</span>
                      <span className={`text-xl font-bold ${getStatusColor(summary.payrollPercentage)}`}>
                        {summary.payrollPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Profit Margin:</span>
                      <span className="font-semibold text-gray-900">{summary.profitMargin.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className={`mt-4 p-3 rounded-lg ${getStatusBgColor(summary.payrollPercentage)}`}>
                    <div className="flex items-center">
                      {summary.payrollPercentage <= payrollTargets.excellent ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      ) : summary.payrollPercentage <= payrollTargets.good ? (
                        <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                      ) : summary.payrollPercentage <= payrollTargets.warning ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${getStatusColor(summary.payrollPercentage)}`}>
                        {summary.payrollPercentage <= payrollTargets.excellent ? 'Excellent' :
                         summary.payrollPercentage <= payrollTargets.good ? 'Good' :
                         summary.payrollPercentage <= payrollTargets.warning ? 'Warning' : 'Poor'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Targets</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3" />
                    <span className="text-sm font-medium text-green-900">Excellent</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">≤{payrollTargets.excellent}%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3" />
                    <span className="text-sm font-medium text-blue-900">Good</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{payrollTargets.excellent + 0.1}-{payrollTargets.good}%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3" />
                    <span className="text-sm font-medium text-yellow-900">Warning</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-700">{payrollTargets.good + 0.1}-{payrollTargets.warning}%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-3" />
                    <span className="text-sm font-medium text-red-900">Poor</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">{'>'}{payrollTargets.warning}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Employee Payroll Analysis</h3>
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
                    Hours Worked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payroll %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayrollData
                  .sort((a, b) => a.payrollToRevenuePercent - b.payrollToRevenuePercent)
                  .map(entry => {
                    const employee = employees.find(emp => emp.id === entry.employeeId);
                    const division = divisions.find(d => d.id === employee?.divisionId);
                    
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                              style={{ backgroundColor: division?.color }}
                            >
                              {entry.employeeName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{entry.employeeName}</div>
                              <div className="text-sm text-gray-500">{entry.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${division?.color}20`, 
                              color: division?.color 
                            }}
                          >
                            {division?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.hoursWorked}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(entry.totalPay)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(entry.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-lg font-bold ${getStatusColor(entry.payrollToRevenuePercent)}`}>
                            {entry.payrollToRevenuePercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.statusColor === 'green' ? 'bg-green-100 text-green-800' :
                            entry.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            entry.statusColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {entry.payrollToRevenuePercent <= payrollTargets.excellent ? 'Excellent' :
                             entry.payrollToRevenuePercent <= payrollTargets.good ? 'Good' :
                             entry.payrollToRevenuePercent <= payrollTargets.warning ? 'Warning' : 'Poor'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends View */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Payroll Trends</h3>
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
                    dataKey="payrollPercentage" 
                    stroke="#0c5b63" 
                    strokeWidth={3}
                    name="Payroll %" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profitMargin" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Profit Margin %" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Payroll Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : `${value}%`,
                    name === 'revenue' ? 'Revenue' : 'Payroll %'
                  ]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="payrollPercentage" fill="#f59e0b" name="Payroll %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Target Settings Modal */}
      {showTargetSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Payroll Percentage Targets</h3>
              <button
                onClick={() => setShowTargetSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excellent Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={payrollTargets.excellent}
                  onChange={(e) => setPayrollTargets(prev => ({ 
                    ...prev, 
                    excellent: parseFloat(e.target.value) || 18 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                />
                <p className="text-xs text-gray-500 mt-1">Payroll ≤ this percentage = Excellent</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Good Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={payrollTargets.good}
                  onChange={(e) => setPayrollTargets(prev => ({ 
                    ...prev, 
                    good: parseFloat(e.target.value) || 25 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                />
                <p className="text-xs text-gray-500 mt-1">Payroll ≤ this percentage = Good</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warning Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={payrollTargets.warning}
                  onChange={(e) => setPayrollTargets(prev => ({ 
                    ...prev, 
                    warning: parseFloat(e.target.value) || 30 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                />
                <p className="text-xs text-gray-500 mt-1">Payroll ≤ this percentage = Warning</p>
              </div>

              {/* Target Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Target Preview</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-600">Excellent:</span>
                    <span>≤{payrollTargets.excellent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Good:</span>
                    <span>{payrollTargets.excellent + 0.1}% - {payrollTargets.good}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600">Warning:</span>
                    <span>{payrollTargets.good + 0.1}% - {payrollTargets.warning}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Poor:</span>
                    <span>{'>'}{payrollTargets.warning}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTargetSettings(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTargetSettings(false)}
                className="px-4 py-2 bg-[#0c5b63] text-white rounded-md hover:bg-[#0f6b73]"
              >
                Save Targets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPercentagePage2;