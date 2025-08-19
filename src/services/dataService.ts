import { Employee, EmployeeKPIData, EmployeeTarget } from '../types/employee';
import { Division, KPIData, KPITarget } from '../types/division';
import { HormoneUnit } from '../types/hormoneUnit';

// Types for service responses
export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  avgProductivity: number;
  avgHappiness: number;
  topPerformers: Array<{
    employee: Employee;
    score: number;
    kpiData: EmployeeKPIData;
  }>;
}

export interface SchedulingStats {
  totalScheduledHours: number;
  totalBookedHours: number;
  utilizationRate: number;
  revenueFromScheduling: number;
  employeeUtilization: Array<{
    employeeId: string;
    employeeName: string;
    scheduledHours: number;
    bookedHours: number;
    utilizationRate: number;
  }>;
}

export interface HormoneUnitMetrics {
  totalUnits: number;
  totalStaff: number;
  avgProductivity: number;
  totalRevenue: number;
  unitPerformance: Array<{
    unit: HormoneUnit;
    staffCount: number;
    productivity: number;
    revenue: number;
  }>;
}

export interface DivisionPerformanceData {
  divisionId: string;
  divisionName: string;
  teamSize: number;
  totalRevenue: number;
  productivity: number;
  newClients: number;
  retailPercentage: number;
  happinessScore: number;
  kpiData: KPIData;
}

export interface DailySubmissionStats {
  totalSubmissions: number;
  completedSubmissions: number;
  completionRate: number;
  recentSubmissions: Array<{
    divisionId: string;
    divisionName: string;
    date: string;
    isComplete: boolean;
    entryCount: number;
  }>;
}

export interface DashboardMetrics {
  companySales: number;
  companyProductivity: number;
  hoursWorked: number;
  hoursBooked: number;
  serviceRevenue: number;
  retailSales: number;
  newClients: number;
  consults: number;
  consultConverted: number;
  divisions: Array<{
    id: string;
    name: string;
    color: string;
    teamMembers: number;
    sales: number;
    productivity: number;
    newClients: number;
  }>;
  trendData: Array<{
    month: string;
    [divisionName: string]: any;
  }>;
}

// --- Location color mapping, single source of truth
export const LOCATION_COLORS: Record<string, string> = {
  'St. Albert': '#8b5cf6',    // Purple
  'Spruce Grove': '#14b8a6',  // Teal
  'Sherwood Park': '#f59e0b', // Amber
  'Wellness': '#10b981',      // Emerald
  'Unknown': '#6b7280'        // Slate
};

export function getLocationColor(location: string): string {
  return LOCATION_COLORS[location] ?? LOCATION_COLORS['Unknown'];
}

// Export getDivisionColor for external use
export function getDivisionColor(divisionId: string): string {
  const colorMap: Record<string, string> = {
    'new-patient': '#e6b813',
    'hormone': '#5c6f75',
    'nutrition': '#bfb6d9',
    'iv-therapy': '#91c4ba',
    'laser': '#ff9680',
    'injectables': '#ff6a76',
    'guest-care': '#e6b813',
    'feminine': '#a47d9b',
    'pcos': '#f4647d',
    'biobalance': '#0a868f',
    'membership': '#b04f7e',
    'wellness': '#ff9680',
  };
  return colorMap[divisionId] || '#f4647d';
}

// Data access layer - these would typically connect to your state management or API
class DataService {
  private getStoredData<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item, this.dateReviver) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  private dateReviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
      return new Date(value);
    }
    return value;
  };

  // Fetch employee statistics
  async fetchEmployeeStats(
    selectedMonth: string, 
    selectedYear: number, 
    selectedDivision?: string
  ): Promise<EmployeeStats> {
    const employees: Employee[] = this.getStoredData('employees', []);
    const employeeKPIData: EmployeeKPIData[] = this.getStoredData('employeeKPIData', []);
    
    // Filter employees by division if specified
    let filteredEmployees = employees.filter(emp => emp.isActive);
    if (selectedDivision && selectedDivision !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => emp.divisionId === selectedDivision);
    }

    // Get KPI data for the selected period
    const periodKPIData = employeeKPIData.filter(data => 
      data.month === selectedMonth && 
      data.year === selectedYear &&
      filteredEmployees.some(emp => emp.id === data.employeeId)
    );

    // Calculate averages
    const avgProductivity = periodKPIData.length > 0 
      ? Math.round(periodKPIData.reduce((sum, data) => sum + data.productivityRate, 0) / periodKPIData.length)
      : 0;

    const avgHappiness = periodKPIData.length > 0 
      ? Math.round(periodKPIData.reduce((sum, data) => sum + data.happinessScore, 0) / periodKPIData.length * 10) / 10
      : 0;

    // Calculate top performers
    const topPerformers = periodKPIData
      .map(kpiData => {
        const employee = filteredEmployees.find(emp => emp.id === kpiData.employeeId);
        if (!employee) return null;

        const score = Math.round((
          kpiData.productivityRate + 
          kpiData.retailPercentage + 
          kpiData.happinessScore * 10 + 
          kpiData.attendanceRate
        ) / 4);

        return { employee, score, kpiData };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 5) as Array<{ employee: Employee; score: number; kpiData: EmployeeKPIData; }>;

    return {
      totalEmployees: employees.length,
      activeEmployees: filteredEmployees.length,
      avgProductivity,
      avgHappiness,
      topPerformers,
    };
  }

  // Fetch scheduling data
  async fetchSchedulingData(
    selectedMonth: string, 
    selectedYear: number, 
    selectedDivision?: string
  ): Promise<SchedulingStats> {
    const employees: Employee[] = this.getStoredData('employees', []);
    const scheduledHours: Record<string, number> = this.getStoredData('scheduledHours', {});
    const employeeKPIData: EmployeeKPIData[] = this.getStoredData('employeeKPIData', []);

    // Filter employees by division if specified
    let filteredEmployees = employees.filter(emp => emp.isActive);
    if (selectedDivision && selectedDivision !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => emp.divisionId === selectedDivision);
    }

    // Calculate scheduling metrics
    let totalScheduledHours = 0;
    let totalBookedHours = 0;
    const employeeUtilization: Array<{
      employeeId: string;
      employeeName: string;
      scheduledHours: number;
      bookedHours: number;
      utilizationRate: number;
    }> = [];

    filteredEmployees.forEach(employee => {
      const key = `${employee.id}-${selectedMonth}-${selectedYear}`;
      const scheduled = scheduledHours[key] || 0;
      
      // Get booked hours from KPI data
      const kpiData = employeeKPIData.find(data => 
        data.employeeId === employee.id && 
        data.month === selectedMonth && 
        data.year === selectedYear
      );
      const booked = kpiData?.hoursSold || 0;
      
      totalScheduledHours += scheduled;
      totalBookedHours += booked;

      employeeUtilization.push({
        employeeId: employee.id,
        employeeName: employee.name,
        scheduledHours: scheduled,
        bookedHours: booked,
        utilizationRate: scheduled > 0 ? Math.round((booked / scheduled) * 100) : 0,
      });
    });

    const utilizationRate = totalScheduledHours > 0 
      ? Math.round((totalBookedHours / totalScheduledHours) * 100) 
      : 0;

    // Calculate revenue from scheduling (estimated)
    const avgServiceSalesPerHour = 150; // Default rate
    const revenueFromScheduling = totalBookedHours * avgServiceSalesPerHour;

    return {
      totalScheduledHours,
      totalBookedHours,
      utilizationRate,
      revenueFromScheduling,
      employeeUtilization: employeeUtilization.sort((a, b) => b.utilizationRate - a.utilizationRate),
    };
  }

  // Fetch hormone unit metrics
  async fetchHormoneUnitMetrics(
    selectedMonth: string, 
    selectedYear: number
  ): Promise<HormoneUnitMetrics> {
    const hormoneUnits: HormoneUnit[] = this.getStoredData('hormoneUnits', []);
    const employees: Employee[] = this.getStoredData('employees', []);
    const kpiData: KPIData[] = this.getStoredData('kpiData', []);

    // Get hormone division data
    const hormoneKPIData = kpiData.find(data => 
      data.divisionId === 'hormone' && 
      data.month === selectedMonth && 
      data.year === selectedYear
    );

    const totalStaff = hormoneUnits.reduce((sum, unit) => {
      return sum + unit.npIds.length + unit.specialistIds.length + 
             (unit.patientCareSpecialistId ? 1 : 0) + 
             (unit.adminTeamMemberId ? 1 : 0) + 
             (unit.guestCareId ? 1 : 0);
    }, 0);

    const unitPerformance = hormoneUnits.map(unit => {
      const staffCount = unit.npIds.length + unit.specialistIds.length + 
                        (unit.patientCareSpecialistId ? 1 : 0) + 
                        (unit.adminTeamMemberId ? 1 : 0) + 
                        (unit.guestCareId ? 1 : 0);

      // Estimate performance based on unit size and hormone division performance
      const productivity = hormoneKPIData?.productivityRate || 85;
      const revenue = hormoneKPIData ? (hormoneKPIData.averageTicket * hormoneKPIData.newClients) / hormoneUnits.length : 0;

      return {
        unit,
        staffCount,
        productivity,
        revenue,
      };
    });

    return {
      totalUnits: hormoneUnits.length,
      totalStaff,
      avgProductivity: hormoneKPIData?.productivityRate || 0,
      totalRevenue: hormoneKPIData ? hormoneKPIData.averageTicket * hormoneKPIData.newClients : 0,
      unitPerformance,
    };
  }

  // Fetch division performance data
  async fetchDivisionPerformance(
    selectedMonth: string, 
    selectedYear: number, 
    selectedDivision?: string
  ): Promise<DivisionPerformanceData[]> {
    const divisions: Division[] = this.getStoredData('divisions', []);
    const kpiData: KPIData[] = this.getStoredData('kpiData', []);
    const employees: Employee[] = this.getStoredData('employees', []);

    // Filter divisions if specified
    let filteredDivisions = divisions;
    if (selectedDivision && selectedDivision !== 'all') {
      filteredDivisions = divisions.filter(div => div.id === selectedDivision);
    }

    return filteredDivisions.map(division => {
      const divisionKPIData = kpiData.find(data => 
        data.divisionId === division.id && 
        data.month === selectedMonth && 
        data.year === selectedYear
      );

      const divisionEmployees = employees.filter(emp => 
        emp.divisionId === division.id && emp.isActive
      );

      const totalRevenue = divisionKPIData 
        ? divisionKPIData.averageTicket * divisionKPIData.newClients 
        : 0;

      return {
        divisionId: division.id,
        divisionName: division.name,
        teamSize: divisionEmployees.length,
        totalRevenue,
        productivity: divisionKPIData?.productivityRate || 0,
        newClients: divisionKPIData?.newClients || 0,
        retailPercentage: divisionKPIData?.retailPercentage || 0,
        happinessScore: divisionKPIData?.happinessScore || 0,
        kpiData: divisionKPIData || {
          divisionId: division.id,
          month: selectedMonth,
          year: selectedYear,
          productivityRate: 0,
          prebookRate: 0,
          firstTimeRetentionRate: 0,
          repeatRetentionRate: 0,
          retailPercentage: 0,
          newClients: 0,
          averageTicket: 0,
          serviceSalesPerHour: 0,
          clientsRetailPercentage: 0,
          hoursSold: 0,
          happinessScore: 0,
          netCashPercentage: 0,
        },
      };
    });
  }

  // Fetch daily submission statistics
  async fetchDailySubmissions(
    selectedMonth: string, 
    selectedYear: number, 
    selectedDivision?: string
  ): Promise<DailySubmissionStats> {
    interface DailySubmission {
      divisionId: string;
      date: string;
      isComplete: boolean;
      entries: any[];
    }

    const dailySubmissions: DailySubmission[] = this.getStoredData('dailySubmissions', []);
    const divisions: Division[] = this.getStoredData('divisions', []);

    // Filter submissions by period and division
    const filteredSubmissions = dailySubmissions.filter(submission => {
      const submissionDate = new Date(submission.date);
      const matchesPeriod = submissionDate.getMonth() === parseInt(selectedMonth) - 1 && 
                           submissionDate.getFullYear() === selectedYear;
      const matchesDivision = !selectedDivision || selectedDivision === 'all' || 
                             submission.divisionId === selectedDivision;
      return matchesPeriod && matchesDivision;
    });

    const completedSubmissions = filteredSubmissions.filter(s => s.isComplete);
    const completionRate = filteredSubmissions.length > 0 
      ? Math.round((completedSubmissions.length / filteredSubmissions.length) * 100) 
      : 0;

    const recentSubmissions = filteredSubmissions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(submission => {
        const division = divisions.find(d => d.id === submission.divisionId);
        return {
          divisionId: submission.divisionId,
          divisionName: division?.name || 'Unknown',
          date: submission.date,
          isComplete: submission.isComplete,
          entryCount: submission.entries.length,
        };
      });

    return {
      totalSubmissions: filteredSubmissions.length,
      completedSubmissions: completedSubmissions.length,
      completionRate,
      recentSubmissions,
    };
  }

  // Aggregate all dashboard metrics
  async fetchDashboardMetrics(
    selectedMonth: number,
    selectedYear: number,
    selectedDivision: string,
    kpiData: KPIData[],
    employeeKPIData: EmployeeKPIData[],
    dailySubmissions: DailySubmission[],
    employees: Employee[]
  ): Promise<DashboardMetrics> {
    // Use provided data directly
    const currentKPIData = kpiData;
    const currentEmployeeKPIData = employeeKPIData;
    const currentDailySubmissions = dailySubmissions;
    const activeEmployees = employees.filter(emp => emp.isActive);
    
    const [
      employeeStats,
      schedulingStats,
      hormoneMetrics,
      divisionPerformance,
      dailyStats
    ] = await Promise.all([
      this.fetchEmployeeStatsWithData(selectedMonth.toString().padStart(2, '0'), selectedYear, selectedDivision, currentEmployeeKPIData, employees),
      this.fetchSchedulingDataWithData(selectedMonth.toString().padStart(2, '0'), selectedYear, selectedDivision, currentEmployeeKPIData, employees),
      this.fetchHormoneUnitMetrics(selectedMonth.toString().padStart(2, '0'), selectedYear),
      this.fetchDivisionPerformanceWithData(selectedMonth.toString().padStart(2, '0'), selectedYear, selectedDivision, currentKPIData, employees),
      this.fetchDailySubmissionsWithData(selectedMonth.toString().padStart(2, '0'), selectedYear, selectedDivision, currentDailySubmissions),
    ]);

    // Calculate company-wide metrics
    const dailyMetrics = this.calculateDailyMetrics(currentDailySubmissions, selectedMonth.toString().padStart(2, '0'), selectedYear);
    
    const companySales = dailyMetrics.totalRevenue > 0 ? dailyMetrics.totalRevenue : divisionPerformance.reduce((sum, div) => sum + div.totalRevenue, 0);
    const companyProductivity = divisionPerformance.length > 0 
      ? Math.round(divisionPerformance.reduce((sum, div) => sum + div.productivity, 0) / divisionPerformance.length)
      : 0;

    const serviceRevenue = dailyMetrics.serviceRevenue > 0 ? dailyMetrics.serviceRevenue : Math.round(companySales * 0.7);
    const retailSales = dailyMetrics.retailSales > 0 ? dailyMetrics.retailSales : Math.round(companySales * 0.3);
    const totalNewClients = divisionPerformance.reduce((sum, div) => sum + div.newClients, 0);

    // Estimate consults (1.5x new clients)
    const consults = dailyMetrics.consults > 0 ? dailyMetrics.consults : Math.round(totalNewClients * 1.5);
    const consultConverted = dailyMetrics.consultConverted > 0 ? dailyMetrics.consultConverted : Math.round(consults * 0.75);

    // Generate trend data for past 6 months
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(selectedYear, selectedMonth - 1 - i, 1);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
      const yearNum = date.getFullYear();
      
      // Get actual KPI data for this month
      const monthKPIData = currentKPIData.filter(data => 
        data.month === monthStr && data.year === yearNum
      );
      
      const monthEmployeeKPIData = currentEmployeeKPIData.filter(data => 
        data.month === monthStr && data.year === yearNum
      );
      
      const monthData: any = { month: monthLabel };
      
      divisionPerformance.forEach(division => {
        const divisionKPIData = monthKPIData.find(data => data.divisionId === division.divisionId);
        const divisionEmployeeData = monthEmployeeKPIData.filter(data => 
          employees.some((emp: any) => emp.id === data.employeeId && emp.divisionId === division.divisionId)
        );
        
        // Use actual data if available, otherwise use current values with slight variation
        if (divisionKPIData) {
          monthData[division.divisionName] = divisionKPIData.productivityRate;
        } else if (divisionEmployeeData.length > 0) {
          monthData[division.divisionName] = Math.round(
            divisionEmployeeData.reduce((sum: number, data: any) => sum + data.productivityRate, 0) / divisionEmployeeData.length
          );
        } else {
          // Fallback to variation of current data
          const baseValue = division.productivity;
          const variation = (Math.random() - 0.5) * 10;
          monthData[division.divisionName] = Math.max(0, Math.round(baseValue + variation));
        }
      });
      
      trendData.push(monthData);
    }

    return {
      companySales,
      companyProductivity,
      hoursWorked: dailyMetrics.hoursWorked > 0 ? dailyMetrics.hoursWorked : schedulingStats.totalScheduledHours,
      hoursBooked: dailyMetrics.hoursBooked > 0 ? dailyMetrics.hoursBooked : schedulingStats.totalBookedHours,
      serviceRevenue,
      retailSales,
      newClients: totalNewClients,
      consults,
      consultConverted,
      divisions: divisionPerformance.map(div => ({
        id: div.divisionId,
        name: div.divisionName,
        color: this.getDivisionColor(div.divisionId),
        teamMembers: div.teamSize,
        sales: div.totalRevenue,
        productivity: div.productivity,
        newClients: div.newClients,
      })),
      trendData,
    };
  }

  // Calculate metrics from daily submissions
  private calculateDailyMetrics(dailySubmissions: any[], selectedMonth: string, selectedYear: number) {
    let totalRevenue = 0;
    let serviceRevenue = 0;
    let retailSales = 0;
    let hoursWorked = 0;
    let hoursBooked = 0;
    let consults = 0;
    let consultConverted = 0;
    
    dailySubmissions.forEach(submission => {
      const submissionDate = new Date(submission.date);
      if (submissionDate.getMonth() === parseInt(selectedMonth) - 1 && submissionDate.getFullYear() === selectedYear) {
        submission.entries.forEach((entry: any) => {
          if (entry.status === 'active' && entry.isSubmitted) {
            serviceRevenue += entry.serviceRevenue;
            retailSales += entry.retailSales;
            hoursWorked += entry.hoursWorked;
            hoursBooked += entry.hoursBooked;
            consults += entry.consults;
            consultConverted += entry.consultConverted;
          }
        });
      }
    });
    
    totalRevenue = serviceRevenue + retailSales;
    
    return {
      totalRevenue,
      serviceRevenue,
      retailSales,
      hoursWorked,
      hoursBooked,
      consults,
      consultConverted,
    };
  }

  // Enhanced methods that accept data parameters
  private async fetchEmployeeStatsWithData(
    selectedMonth: string, 
    selectedYear: number, 
    selectedDivision?: string,
    employeeKPIData?: any[],
    employees?: any[]
  ): Promise<EmployeeStats> {
    const employeeList: Employee[] = employees || [];
    const currentEmployeeKPIData = employeeKPIData || this.getStoredData('employeeKPIData', []);
    
    // Filter employees by division if specified
    let filteredEmployees = employeeList.filter(emp => emp.isActive);
    if (selectedDivision && selectedDivision !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => emp.divisionId === selectedDivision);
    }

    // Get KPI data for the selected period
    const periodKPIData = currentEmployeeKPIData.filter(data => 
      data.month === selectedMonth && 
      data.year === selectedYear &&
      filteredEmployees.some(emp => emp.id === data.employeeId)
    );

    // Calculate averages
    const avgProductivity = periodKPIData.length > 0 
      ? Math.round(periodKPIData.reduce((sum, data) => sum + data.productivityRate, 0) / periodKPIData.length)
      : 0;

    const avgHappiness = periodKPIData.length > 0 
      ? Math.round(periodKPIData.reduce((sum, data) => sum + data.happinessScore, 0) / periodKPIData.length * 10) / 10
      : 0;

    // Calculate top performers
    const topPerformers = periodKPIData
      .map(kpiData => {
        const employee = filteredEmployees.find(emp => emp.id === kpiData.employeeId);
        if (!employee) return null;

        const score = Math.round((
          kpiData.productivityRate + 
          kpiData.retailPercentage + 
          kpiData.happinessScore * 10 + 
          kpiData.attendanceRate
        ) / 4);

        return { employee, score, kpiData };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 5) as Array<{ employee: Employee; score: number; kpiData: any; }>;

    return {
      totalEmployees: employeeList.length,
      activeEmployees: filteredEmployees.length,
      avgProductivity,
      avgHappiness,
      topPerformers,
    };
  }

  private async fetchSchedulingDataWithData(
    selectedMonth: string, 
    selectedYear: number, 
    selectedDivision?: string,
    employeeKPIData?: any[],
    employees?: any[]
  ): Promise<SchedulingStats> {
    const employeeList: Employee[] = employees || [];
    const scheduledHours: Record<string, number> = this.getStoredData('scheduledHours', {});
    const currentEmployeeKPIData = employeeKPIData || this.getStoredData('employeeKPIData', []);

    // Filter employees by division if specified
    let filteredEmployees = employeeList.filter(emp => emp.isActive);
    if (selectedDivision && selectedDivision !== 'all') {
      filteredEmployees = filteredEmployees.filter(emp => emp.divisionId === selectedDivision);
    }

    // Calculate scheduling metrics
    let totalScheduledHours = 0;
    let totalBookedHours = 0;
    const employeeUtilization: Array<{
      employeeId: string;
      employeeName: string;
      scheduledHours: number;
      bookedHours: number;
      utilizationRate: number;
    }> = [];

    filteredEmployees.forEach(employee => {
      const key = `${employee.id}-${selectedMonth}-${selectedYear}`;
      const scheduled = scheduledHours[key] || 0;
      
      // Get booked hours from KPI data
      const kpiData = currentEmployeeKPIData.find(data => 
        data.employeeId === employee.id && 
        data.month === selectedMonth && 
        data.year === selectedYear
      );
      const booked = kpiData?.hoursSold || 0;
      
      totalScheduledHours += scheduled;
      totalBookedHours += booked;

      employeeUtilization.push({
        employeeId: employee.id,
        employeeName: employee.name,
        scheduledHours: scheduled,
        bookedHours: booked,
        utilizationRate: scheduled > 0 ? Math.round((booked / scheduled) * 100) : 0,
      });
    });

    const utilizationRate = totalScheduledHours > 0 
      ? Math.round((totalBookedHours / totalScheduledHours) * 100) 
      : 0;

    // Calculate revenue from scheduling (estimated)
    const avgServiceSalesPerHour = 150; // Default rate
    const revenueFromScheduling = totalBookedHours * avgServiceSalesPerHour;

    return {
      totalScheduledHours,
      totalBookedHours,
      utilizationRate,
      revenueFromScheduling,
      employeeUtilization: employeeUtilization.sort((a, b) => b.utilizationRate - a.utilizationRate),
    };
  }

  private async fetchDivisionPerformanceWithData(
    selectedMonth: string, 
    selectedYear: number, 
    selectedDivision?: string,
    kpiData?: any[],
    employees?: any[]
  ): Promise<DivisionPerformanceData[]> {
    const divisions: Division[] = this.getStoredData('divisions', []);
    const currentKPIData = kpiData || [];
    const employeeList: Employee[] = employees || [];

    // Filter divisions if specified
    let filteredDivisions = divisions;
    if (selectedDivision && selectedDivision !== 'all') {
      filteredDivisions = divisions.filter(div => div.id === selectedDivision);
    }

    return filteredDivisions.map(division => {
      const divisionKPIData = currentKPIData.find(data => 
        data.divisionId === division.id && 
        data.month === selectedMonth && 
        data.year === selectedYear
      );

      const divisionEmployees = employeeList.filter(emp => 
        emp.divisionId === division.id && emp.isActive
      );

      const totalRevenue = divisionKPIData 
        ? (divisionKPIData.serviceRevenue || 0) + (divisionKPIData.retailSales || 0) || (divisionKPIData.averageTicket * divisionKPIData.newClients)
        : 0;

      return {
        divisionId: division.id,
        divisionName: division.name,
        teamSize: divisionEmployees.length,
        totalRevenue,
        productivity: divisionKPIData?.productivityRate || 0,
        newClients: divisionKPIData?.newClients || 0,
        retailPercentage: divisionKPIData?.retailPercentage || 0,
        happinessScore: divisionKPIData?.happinessScore || 0,
        kpiData: divisionKPIData || {
          divisionId: division.id,
          month: selectedMonth,
          year: selectedYear,
          productivityRate: 0,
          prebookRate: 0,
          firstTimeRetentionRate: 0,
          repeatRetentionRate: 0,
          retailPercentage: 0,
          newClients: 0,
          averageTicket: 0,
          serviceSalesPerHour: 0,
          clientsRetailPercentage: 0,
          hoursSold: 0,
          happinessScore: 0,
          netCashPercentage: 0,
        },
      };
    });
  }

  private async fetchDailySubmissionsWithData(
    selectedMonth: string, 
    selectedYear: number, 
    selectedDivision?: string,
    dailySubmissions?: any[]
  ): Promise<DailySubmissionStats> {
    const currentDailySubmissions = dailySubmissions || [];
    const divisions: Division[] = this.getStoredData('divisions', []);

    // Filter submissions by period and division
    const filteredSubmissions = currentDailySubmissions.filter(submission => {
      const submissionDate = new Date(submission.date);
      const matchesPeriod = submissionDate.getMonth() === parseInt(selectedMonth) - 1 && 
                           submissionDate.getFullYear() === selectedYear;
      const matchesDivision = !selectedDivision || selectedDivision === 'all' || 
                             submission.divisionId === selectedDivision;
      return matchesPeriod && matchesDivision;
    });

    const completedSubmissions = filteredSubmissions.filter(s => s.isComplete);
    const completionRate = filteredSubmissions.length > 0 
      ? Math.round((completedSubmissions.length / filteredSubmissions.length) * 100) 
      : 0;

    const recentSubmissions = filteredSubmissions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(submission => {
        const division = divisions.find(d => d.id === submission.divisionId);
        return {
          divisionId: submission.divisionId,
          divisionName: division?.name || 'Unknown',
          date: submission.date,
          isComplete: submission.isComplete,
          entryCount: submission.entries.length,
        };
      });

    return {
      totalSubmissions: filteredSubmissions.length,
      completedSubmissions: completedSubmissions.length,
      completionRate,
      recentSubmissions,
    };
  }

  getDivisionColor(divisionId: string): string {
    const colorMap: Record<string, string> = {
      'new-patient': '#e6b813',
      'hormone': '#5c6f75',
      'nutrition': '#bfb6d9',
      'iv-therapy': '#91c4ba',
      'laser': '#ff9680',
      'injectables': '#ff6a76',
      'guest-care': '#e6b813',
      'feminine': '#a47d9b',
    };
    return colorMap[divisionId] || '#f4647d';
  }
}

// Export singleton instance
export const dataService = new DataService();

// Export individual functions for convenience
export const {
  fetchEmployeeStats,
  fetchSchedulingData,
  fetchHormoneUnitMetrics,
  fetchDivisionPerformance,
  fetchDailySubmissions,
  fetchDashboardMetrics,
} = dataService;