import React, { useState, useMemo } from 'react';
import { Employee, EmployeeKPIData } from '../types/employee';
import { Division } from '../types/division';
import { HormoneUnit } from '../types/hormoneUnit';
import { formatCurrency } from '../utils/scoring';
import { Calculator, TrendingUp, Clock, Target, Users, Calendar, Filter, Lock, Unlock, Download, AlertTriangle, CheckCircle, AlertCircle, FileText, BarChart3, DollarSign, Save } from 'lucide-react';
import jsPDF from 'jspdf';

interface RevenueProjection {
  employeeId?: string;
  unitId?: string;
  month: string;
  year: number;
  scheduledHours: number;
  estimatedProductivity: number;
  serviceSalesPerHour: number;
  retailPercentage: number;
  effectiveHours: number;
  projectedServiceRevenue: number;
  projectedRetailRevenue: number;
  totalRevenueGoal: number;
  isSubmitted: boolean;
  submittedAt?: Date;
  submittedBy?: string;
}

interface ProjectionsTabProps {
  employees: Employee[];
  divisions: Division[];
  hormoneUnits: HormoneUnit[];
  employeeKPIData: EmployeeKPIData[];
  currentUser: any;
  selectedMonth: string;
  selectedYear: number;
  scheduledHours: Record<string, number>;
  getEmployeeScheduledHours: (employeeId: string, month?: string, year?: number) => number;
  onUpdateProjection: (projection: RevenueProjection) => void;
}

const ProjectionsTab: React.FC<ProjectionsTabProps> = ({
  employees,
  divisions,
  hormoneUnits,
  employeeKPIData,
  currentUser,
  selectedMonth,
  selectedYear,
  scheduledHours,
  getEmployeeScheduledHours,
  onUpdateProjection,
}) => {
  const [viewScope, setViewScope] = useState<'all-employees' | 'division-summary' | 'single-employee'>('all-employees');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [submissionStatus, setSubmissionStatus] = useState<string>('all');
  const [projections, setProjections] = useState<RevenueProjection[]>([]);
  const [showUnderperformanceOnly, setShowUnderperformanceOnly] = useState<boolean>(false);

  // Check if projections are locked (after 25th)
  const isProjectionsLocked = useMemo(() => {
    const now = new Date();
    const lockDate = new Date(now.getFullYear(), now.getMonth(), 25, 23, 59, 59);
    return now > lockDate && currentUser.role !== 'admin'; // COO can always edit
  }, [currentUser.role]);

  // Get last month's KPI data for auto-calculations
  const getLastMonthKPIData = (employeeId: string) => {
    const lastMonth = selectedMonth === '01' ? '12' : (parseInt(selectedMonth) - 1).toString().padStart(2, '0');
    const lastYear = selectedMonth === '01' ? selectedYear - 1 : selectedYear;
    
    return employeeKPIData.find(data => 
      data.employeeId === employeeId && 
      data.month === lastMonth && 
      data.year === lastYear
    );
  };

  // Get two months ago KPI data for coaching PDF
  const getTwoMonthsAgoKPIData = (employeeId: string) => {
    const twoMonthsAgo = selectedMonth === '01' ? '11' : selectedMonth === '02' ? '12' : (parseInt(selectedMonth) - 2).toString().padStart(2, '0');
    const twoMonthsAgoYear = (selectedMonth === '01' || selectedMonth === '02') ? selectedYear - 1 : selectedYear;
    
    return employeeKPIData.find(data => 
      data.employeeId === employeeId && 
      data.month === twoMonthsAgo && 
      data.year === twoMonthsAgoYear
    );
  };

  // Calculate auto-filled values
  const calculateAutoValues = (employeeId: string) => {
    const lastMonthData = getLastMonthKPIData(employeeId);
    const scheduledHours = getEmployeeScheduledHours(employeeId, selectedMonth, selectedYear);
    
    return {
      scheduledHours,
      estimatedProductivity: lastMonthData ? Math.min(lastMonthData.productivityRate + 1, 100) : 85,
      serviceSalesPerHour: lastMonthData?.serviceSalesPerHour || 150,
      retailPercentage: 20, // Default 20%
    };
  };

  // Get or create projection for employee/unit
  const getProjection = (entityId: string, isUnit = false): RevenueProjection => {
    const existing = projections.find(p => 
      (isUnit ? p.unitId === entityId : p.employeeId === entityId) &&
      p.month === selectedMonth && 
      p.year === selectedYear
    );

    if (existing) return existing;

    // Create new projection with auto-calculated values
    const autoValues = isUnit ? {
      scheduledHours: 160, // Default for units
      estimatedProductivity: 85,
      serviceSalesPerHour: 180,
      retailPercentage: 25,
    } : calculateAutoValues(entityId);

    const effectiveHours = Math.round(autoValues.scheduledHours * (autoValues.estimatedProductivity / 100));
    const projectedServiceRevenue = effectiveHours * autoValues.serviceSalesPerHour;
    const projectedRetailRevenue = Math.round(projectedServiceRevenue * (autoValues.retailPercentage / 100));

    return {
      [isUnit ? 'unitId' : 'employeeId']: entityId,
      month: selectedMonth,
      year: selectedYear,
      ...autoValues,
      effectiveHours,
      projectedServiceRevenue,
      projectedRetailRevenue,
      totalRevenueGoal: projectedServiceRevenue + projectedRetailRevenue,
      isSubmitted: false,
    };
  };

  // Update projection
  const updateProjection = (entityId: string, field: keyof RevenueProjection, value: number, isUnit = false) => {
    if (isProjectionsLocked) return;

    const projection = getProjection(entityId, isUnit);
    const updated = { ...projection, [field]: value };

    // Recalculate dependent values
    updated.effectiveHours = Math.round(updated.scheduledHours * (updated.estimatedProductivity / 100));
    updated.projectedServiceRevenue = updated.effectiveHours * updated.serviceSalesPerHour;
    updated.projectedRetailRevenue = Math.round(updated.projectedServiceRevenue * (updated.retailPercentage / 100));
    updated.totalRevenueGoal = updated.projectedServiceRevenue + updated.projectedRetailRevenue;

    setProjections(prev => {
      const filtered = prev.filter(p => 
        !((isUnit ? p.unitId === entityId : p.employeeId === entityId) &&
          p.month === selectedMonth && p.year === selectedYear)
      );
      return [...filtered, updated];
    });

    onUpdateProjection(updated);
  };

  // Submit projection
  const submitProjection = (entityId: string, isUnit = false) => {
    const projection = getProjection(entityId, isUnit);
    const submitted = {
      ...projection,
      isSubmitted: true,
      submittedAt: new Date(),
      submittedBy: currentUser.id,
    };

    setProjections(prev => {
      const filtered = prev.filter(p => 
        !((isUnit ? p.unitId === entityId : p.employeeId === entityId) &&
          p.month === selectedMonth && p.year === selectedYear)
      );
      const updatedProjections = [...filtered, submitted];
      
      // Auto-save to localStorage
      try {
        localStorage.setItem('revenueProjections', JSON.stringify(updatedProjections));
      } catch (error) {
        console.error('Error saving projections:', error);
      }
      
      return updatedProjections;
    });

    onUpdateProjection(submitted);
  };

  // Check for underperformance
  const isUnderperforming = (employeeId: string): boolean => {
    const lastMonthData = getLastMonthKPIData(employeeId);
    if (!lastMonthData) return false;

    return (
      lastMonthData.productivityRate < 80 ||
      lastMonthData.retailPercentage < 10 ||
      lastMonthData.attendanceRate < 90
    );
  };

  // Generate coaching PDF
  const generateCoachingPDF = (employee: Employee) => {
    const projection = getProjection(employee.id);
    const lastMonthData = getLastMonthKPIData(employee.id);
    const twoMonthsAgoData = getTwoMonthsAgoKPIData(employee.id);
    const division = divisions.find(d => d.id === employee.divisionId);

    const pdf = new jsPDF();
    
    // Header with True Balance branding
    pdf.setFillColor(255, 117, 146); // #ff7592
    pdf.rect(0, 0, 210, 20, 'F');
    
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Monthly Goal & Coaching Review', 20, 14);
    
    // Employee Information
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Employee Name: ${employee.name}`, 20, 35);
    pdf.text(`Division: ${division?.name || 'Unknown'}`, 20, 45);
    pdf.text(`Review Period: ${new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, 20, 55);
    pdf.text(`Generated Date: ${new Date().toLocaleDateString()}`, 20, 65);
    pdf.text(`Employee ID: ${employee.id}`, 20, 75);

    // Monthly Snapshot Table
    pdf.setFontSize(14);
    pdf.text('Monthly Snapshot', 20, 95);
    
    const tableData = [
      ['Metric', 'Current Goal', 'Last Month', '2 Months Ago'],
      ['Scheduled Hours', `${projection.scheduledHours}h`, `${lastMonthData?.hoursSold || 'N/A'}h`, `${twoMonthsAgoData?.hoursSold || 'N/A'}h`],
      ['Productivity Goal %', `${projection.estimatedProductivity}%`, `${lastMonthData?.productivityRate || 'N/A'}%`, `${twoMonthsAgoData?.productivityRate || 'N/A'}%`],
      ['Service Sales/Hour', `${formatCurrency(projection.serviceSalesPerHour)}`, `${lastMonthData ? formatCurrency(lastMonthData.serviceSalesPerHour) : 'N/A'}`, `${twoMonthsAgoData ? formatCurrency(twoMonthsAgoData.serviceSalesPerHour) : 'N/A'}`],
      ['Total Revenue Goal', `${formatCurrency(projection.totalRevenueGoal)}`, `${lastMonthData ? formatCurrency(lastMonthData.averageTicket * lastMonthData.newClients) : 'N/A'}`, `${twoMonthsAgoData ? formatCurrency(twoMonthsAgoData.averageTicket * twoMonthsAgoData.newClients) : 'N/A'}`],
      ['Retail % (Target 20%)', `${projection.retailPercentage}%`, `${lastMonthData?.retailPercentage || 'N/A'}%`, `${twoMonthsAgoData?.retailPercentage || 'N/A'}%`],
    ];

    let yPosition = 105;
    tableData.forEach((row, index) => {
      if (index === 0) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
      } else {
        pdf.setFont(undefined, 'normal');
      }
      
      pdf.text(row[0], 20, yPosition);
      pdf.text(row[1], 70, yPosition);
      pdf.text(row[2], 120, yPosition);
      pdf.text(row[3], 170, yPosition);
      yPosition += 10;
    });

    // Coaching Discussion Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Coaching Discussion', 20, yPosition + 20);
    
    yPosition += 35;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    // Performance Reflection
    pdf.text('Performance Reflection (Last Month):', 20, yPosition);
    pdf.rect(20, yPosition + 5, 170, 20);
    yPosition += 30;
    
    // Manager Feedback
    pdf.text('Manager Feedback:', 20, yPosition);
    pdf.rect(20, yPosition + 5, 170, 25);
    yPosition += 35;
    
    // Plan to Reach Goals
    pdf.text('Plan to Reach Goals This Month:', 20, yPosition);
    pdf.rect(20, yPosition + 5, 170, 25);
    yPosition += 35;
    
    // Identified Barriers
    pdf.text('Identified Barriers or Risks:', 20, yPosition);
    pdf.rect(20, yPosition + 5, 170, 20);
    yPosition += 30;
    
    // Support Promised
    pdf.text('Support Promised by Manager:', 20, yPosition);
    pdf.rect(20, yPosition + 5, 170, 20);
    yPosition += 30;

    // Sign-Off Block
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Sign-Off', 20, yPosition + 10);
    
    yPosition += 25;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Employee Name: ${employee.name}`, 20, yPosition);
    pdf.text(`Manager Name: ${currentUser.name || 'Manager'}`, 20, yPosition + 10);
    pdf.text(`Meeting Date: _______________`, 20, yPosition + 20);
    pdf.text(`PDF Version: ${projection.isSubmitted ? 'Submitted & Locked' : 'Draft'}`, 20, yPosition + 30);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated from Revenue Projection Card - ${new Date().toISOString()}`, 20, 285);

    pdf.save(`${employee.name.replace(' ', '_')}_coaching_${selectedMonth}_${selectedYear}.pdf`);
  };

  // Filter employees based on criteria
  const filteredEmployees = useMemo(() => {
    let filtered = employees.filter(emp => emp.isActive);

    if (selectedDivision !== 'all') {
      filtered = filtered.filter(emp => emp.divisionId === selectedDivision);
    }
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(emp => emp.locations?.includes(selectedLocation));
    }
    if (selectedRole !== 'all') {
      filtered = filtered.filter(emp => emp.category === selectedRole);
    }
    if (selectedTier !== 'all') {
      filtered = filtered.filter(emp => emp.experienceLevel === selectedTier);
    }
    if (showUnderperformanceOnly) {
      filtered = filtered.filter(emp => isUnderperforming(emp.id));
    }

    if (submissionStatus !== 'all') {
      filtered = filtered.filter(emp => {
        const projection = getProjection(emp.id);
        if (submissionStatus === 'submitted') return projection.isSubmitted;
        if (submissionStatus === 'pending') return !projection.isSubmitted;
        return true;
      });
    }

    return filtered;
  }, [employees, selectedDivision, selectedLocation, selectedRole, selectedTier, submissionStatus, showUnderperformanceOnly, projections, selectedMonth, selectedYear]);

  // Calculate submission statistics
  const submissionStats = useMemo(() => {
    const totalEmployees = employees.filter(emp => emp.isActive).length;
    const submittedCount = employees.filter(emp => {
      const projection = getProjection(emp.id);
      return projection.isSubmitted;
    }).length;

    const divisionStats = divisions.map(division => {
      const divisionEmployees = employees.filter(emp => emp.divisionId === division.id && emp.isActive);
      const divisionSubmitted = divisionEmployees.filter(emp => {
        const projection = getProjection(emp.id);
        return projection.isSubmitted;
      }).length;

      return {
        division,
        total: divisionEmployees.length,
        submitted: divisionSubmitted,
        percentage: divisionEmployees.length > 0 ? Math.round((divisionSubmitted / divisionEmployees.length) * 100) : 0,
      };
    });

    return {
      totalEmployees,
      submittedCount,
      overallPercentage: totalEmployees > 0 ? Math.round((submittedCount / totalEmployees) * 100) : 0,
      divisionStats,
    };
  }, [employees, divisions, projections, selectedMonth, selectedYear]);

  const locations = ['St. Albert', 'Spruce Grove', 'Sherwood Park'];
  const roles = ['laser technician', 'nurse injector', 'hormone specialist', 'nurse practitioner', 'administrative', 'marketing', 'sales', 'physician', 'guest care', 'management'];
  const tiers = ['Entry Level', 'Intermediate', 'Senior', 'Expert'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Calculator className="h-6 w-6 text-[#f4647d] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Revenue Projections & Coaching</h2>
            {isProjectionsLocked && (
              <div className="ml-4 flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                <Lock className="h-4 w-4 mr-1" />
                Locked (After 25th)
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
             onClick={() => {
               // Test calculation functionality
               console.log('Sales Projector clicked - testing calculations');
               const testEmployee = filteredEmployees[0];
               if (testEmployee) {
                 const testProjection = getProjection(testEmployee.id);
                 console.log('Test projection calculation:', testProjection);
               }
             }}
             className="flex items-center px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
             Sales Projector
            </button>
            
            <select
              value={`${selectedYear}-${selectedMonth}`}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
              disabled
            >
              <option value={`${selectedYear}-${selectedMonth}`}>
                {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </option>
            </select>
          </div>
        </div>

        {/* Scope Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setViewScope('all-employees')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              viewScope === 'all-employees' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
            }`}
          >
            All Employees
          </button>
          <button
            onClick={() => setViewScope('division-summary')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              viewScope === 'division-summary' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
            }`}
          >
            Division Summary
          </button>
          <button
            onClick={() => setViewScope('single-employee')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              viewScope === 'single-employee' ? 'bg-white text-[#f4647d] shadow-sm' : 'text-gray-600'
            }`}
          >
            Single Employee
          </button>
        </div>

        {/* Submission Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Employees</p>
                <p className="text-2xl font-bold">{submissionStats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Submitted</p>
                <p className="text-2xl font-bold">{submissionStats.submittedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Completion Rate</p>
                <p className="text-2xl font-bold">{submissionStats.overallPercentage}%</p>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Underperforming</p>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => emp.isActive && isUnderperforming(emp.id)).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Smart Filtering System */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Levels</option>
              {tiers.map(tier => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={submissionStatus}
              onChange={(e) => setSubmissionStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Performance</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={showUnderperformanceOnly}
                onChange={(e) => setShowUnderperformanceOnly(e.target.checked)}
                className="h-4 w-4 text-[#f4647d] focus:ring-[#f4647d] border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Underperforming Only</label>
            </div>
          </div>
        </div>
      </div>

      {/* Division Summary View */}
      {viewScope === 'division-summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissionStats.divisionStats.map(({ division, total, submitted, percentage }) => {
            const divisionEmployees = employees.filter(emp => emp.divisionId === division.id && emp.isActive);
            const divisionProjections = divisionEmployees.map(emp => getProjection(emp.id));
            const totalRevenue = divisionProjections.reduce((sum, p) => sum + p.totalRevenueGoal, 0);
            const avgProductivity = divisionProjections.length > 0 
              ? Math.round(divisionProjections.reduce((sum, p) => sum + p.estimatedProductivity, 0) / divisionProjections.length)
              : 0;

            return (
              <div key={division.id} className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: division.color }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{division.name}</h3>
                  <div className="flex items-center space-x-2">
                    {percentage === 100 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : percentage > 50 ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Size:</span>
                    <span className="font-medium">{total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-medium">{submitted}/{total} ({percentage}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projected Revenue:</span>
                    <span className="font-medium">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Productivity:</span>
                    <span className="font-medium">{avgProductivity}%</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: percentage === 100 ? '#10b981' : percentage > 50 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single Employee View */}
      {viewScope === 'single-employee' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
            >
              <option value="">Choose an employee</option>
              {filteredEmployees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.position}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (() => {
            const employee = filteredEmployees.find(emp => emp.id === selectedEmployee);
            if (!employee) return null;

            const projection = getProjection(employee.id);
            const division = divisions.find(d => d.id === employee.divisionId);

            return (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-6">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4"
                    style={{ backgroundColor: division?.color }}
                  >
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{employee.name}</h3>
                    <p className="text-lg text-gray-600">{employee.position}</p>
                    <p className="text-sm text-gray-500">{division?.name}</p>
                  </div>
                </div>

                {/* Single Employee Projection Interface */}
                <div className="space-y-6">
                  {/* Projection Form */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Projection</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Input Section */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Scheduled Hours
                          </label>
                          <input
                            type="number"
                            value={projection.scheduledHours || ''}
                            onChange={(e) => updateProjection(employee.id, 'scheduledHours', parseInt(e.target.value) || 0)}
                            disabled={projection.isSubmitted && currentUser.role !== 'admin'}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] disabled:bg-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Productivity %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={projection.estimatedProductivity || ''}
                            onChange={(e) => updateProjection(employee.id, 'estimatedProductivity', parseInt(e.target.value) || 0)}
                            disabled={projection.isSubmitted && currentUser.role !== 'admin'}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] disabled:bg-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Sales per Hour ($)
                          </label>
                          <input
                            type="number"
                            value={projection.serviceSalesPerHour || ''}
                            onChange={(e) => updateProjection(employee.id, 'serviceSalesPerHour', parseInt(e.target.value) || 0)}
                            disabled={projection.isSubmitted && currentUser.role !== 'admin'}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] disabled:bg-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Retail Percentage %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={projection.retailPercentage || ''}
                            onChange={(e) => updateProjection(employee.id, 'retailPercentage', parseInt(e.target.value) || 0)}
                            disabled={projection.isSubmitted && currentUser.role !== 'admin'}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] disabled:bg-gray-100"
                          />
                        </div>
                      </div>

                      {/* Output Section */}
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-700">Effective Hours</p>
                              <p className="text-2xl font-bold text-blue-900">
                                {projection.effectiveHours || 0}h
                              </p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                          </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-700">Projected Service Revenue</p>
                              <p className="text-2xl font-bold text-green-900">
                                {formatCurrency(projection.projectedServiceRevenue || 0)}
                              </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-500" />
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-700">Projected Retail Revenue</p>
                              <p className="text-2xl font-bold text-purple-900">
                                {formatCurrency(projection.projectedRetailRevenue || 0)}
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                          </div>
                        </div>
                        
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-red-700">Total Revenue Goal</p>
                              <p className="text-2xl font-bold text-red-900">
                                {formatCurrency(projection.totalRevenueGoal || 0)}
                              </p>
                            </div>
                            <Target className="h-8 w-8 text-red-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Underperformance Flag */}
                      {projection.effectiveHours && projection.effectiveHours < 120 && (
                        <div className="flex items-center px-3 py-2 bg-amber-100 text-amber-800 rounded-lg">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">Underperformance Flag</span>
                        </div>
                      )}
                      
                      {/* Submission Status */}
                      {projection.isSubmitted && (
                        <div className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">
                            {currentUser.role === 'admin' ? 'Submitted (Editable)' : 'Submitted & Locked'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => generateCoachingPDF(employee)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Coaching PDF
                      </button>
                      
                      {!projection.isSubmitted && (
                        <button
                          onClick={() => submitProjection(employee.id)}
                          className="px-4 py-2 bg-[#f4647d] text-white rounded-lg hover:bg-[#fd8585] flex items-center"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Submit Projection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* All Employees View */}
      {viewScope === 'all-employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map(employee => {
            const division = divisions.find(d => d.id === employee.divisionId);
            const projection = getProjection(employee.id);
            const isUnderperformingEmployee = isUnderperforming(employee.id);

            return (
              <div 
                key={employee.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 p-6"
                style={{ borderLeftColor: division?.color }}
              >
                {/* Employee Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mr-3"
                      style={{ backgroundColor: division?.color }}
                    >
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {isUnderperformingEmployee && (
                      <AlertTriangle className="h-5 w-5 text-red-500" title="Underperformance detected" />
                    )}
                    {projection.isSubmitted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : isProjectionsLocked ? (
                      <Lock className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Revenue Projection Card */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Revenue Projection</h4>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Scheduled Hours</label>
                      <input
                        type="number"
                        value={projection.scheduledHours}
                        onChange={(e) => updateProjection(employee.id, 'scheduledHours', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#f4647d]"
                        disabled={isProjectionsLocked || (projection.isSubmitted && currentUser.role !== 'admin')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Productivity %</label>
                      <input
                        type="number"
                        value={projection.estimatedProductivity}
                        onChange={(e) => updateProjection(employee.id, 'estimatedProductivity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#f4647d]"
                        disabled={isProjectionsLocked || (projection.isSubmitted && currentUser.role !== 'admin')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sales/Hour</label>
                      <input
                        type="number"
                        value={projection.serviceSalesPerHour}
                        onChange={(e) => updateProjection(employee.id, 'serviceSalesPerHour', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#f4647d]"
                        disabled={isProjectionsLocked || (projection.isSubmitted && currentUser.role !== 'admin')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Retail %</label>
                      <input
                        type="number"
                        value={projection.retailPercentage}
                        onChange={(e) => updateProjection(employee.id, 'retailPercentage', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#f4647d]"
                        disabled={isProjectionsLocked || (projection.isSubmitted && currentUser.role !== 'admin')}
                      />
                    </div>
                  </div>

                  {/* Auto-Calculated Outputs */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Effective Hours:</span>
                      <span className="font-medium">{projection.effectiveHours}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Revenue:</span>
                      <span className="font-medium">{formatCurrency(projection.projectedServiceRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Retail Revenue:</span>
                      <span className="font-medium">{formatCurrency(projection.projectedRetailRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                      <span className="text-gray-700 font-medium">Total Goal:</span>
                      <span className="font-bold text-[#f4647d]">{formatCurrency(projection.totalRevenueGoal)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {!projection.isSubmitted && !isProjectionsLocked ? (
                      <button
                        onClick={() => submitProjection(employee.id)}
                        className="flex-1 px-3 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] text-sm"
                      >
                        Submit
                      </button>
                    ) : projection.isSubmitted && currentUser.role !== 'admin' ? (
                      <div className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-sm text-center flex items-center justify-center">
                        <Lock className="h-4 w-4 mr-1" />
                        Submitted
                      </div>
                    ) : null}
                    
                    <button
                      onClick={() => generateCoachingPDF(employee)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </button>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{employee.locations?.join(', ') || 'No location'}</span>
                  </div>
                  <div className="flex items-center">
                    {projection.isSubmitted ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Submitted
                      </span>
                    ) : isProjectionsLocked ? (
                      <span className="text-red-600 flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COO Dashboard (Admin Only) */}
      {currentUser.role === 'admin' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">COO Dashboard - Division KPI Rollup</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projected Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Productivity Goal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Underperformance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissionStats.divisionStats.map(({ division, total, submitted, percentage }) => {
                  const divisionEmployees = employees.filter(emp => emp.divisionId === division.id && emp.isActive);
                  const divisionProjections = divisionEmployees.map(emp => getProjection(emp.id));
                  const totalRevenue = divisionProjections.reduce((sum, p) => sum + p.totalRevenueGoal, 0);
                  const avgProductivity = divisionProjections.length > 0 
                    ? Math.round(divisionProjections.reduce((sum, p) => sum + p.estimatedProductivity, 0) / divisionProjections.length)
                    : 0;
                  const underperformingCount = divisionEmployees.filter(emp => isUnderperforming(emp.id)).length;

                  return (
                    <tr key={division.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: division.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{division.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {avgProductivity}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{percentage}%</span>
                          <div className={`ml-2 w-2 h-2 rounded-full ${
                            percentage === 100 ? 'bg-green-500' :
                            percentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {underperformingCount > 0 ? (
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm text-red-600">{underperformingCount}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-green-600">None</span>
                        )}
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
  );
};

export default ProjectionsTab;