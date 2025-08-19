import React, { useState } from 'react';
import { User, KPIData, Alert } from './types/division';
import { Employee, EmployeeTarget, EmployeeKPIData } from './types/employee';
import { HormoneUnit } from './types/hormoneUnit';
import { divisions, kpiTargets } from './data/divisions';
import { employees, employeeTargets, sampleEmployeeKPIData } from './data/employees';
import { hormoneUnits as initialHormoneUnits } from './data/hormoneUnits';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import useDashboardData from './hooks/useDashboardData';
import DataInput from './components/DataInput';
import EmployeeDataInput from './components/EmployeeDataInput';
import EmployeeManagement from './components/EmployeeManagement';
import EmployeeManagementV2 from './components/EmployeeManagementV2';
import GoalSetting from './components/GoalSetting';
import Login from './components/Login';
import Trends from './components/Trends';
import Reports from './components/Reports';
import DivisionOverview from './components/DivisionOverview';
import Settings from './components/Settings';
import MonthToDateScoreboard from './components/MonthToDateScoreboard';
import StaffAnalytics from './components/StaffAnalytics';
import ManagerKPIs from './components/ManagerKPIs';
import Scheduling from './components/Scheduling';
import SchedulingCalendar from './components/SchedulingCalendar';
import SchedulingPerformanceDashboard from './components/SchedulingPerformanceDashboard';
import AutoReminderSystem from './components/AutoReminderSystem';
import ProjectionsTab from './components/ProjectionsTab';
import SalesProjectionCalculator from './components/SalesProjectionCalculator';
import ManualDataImportSystem from './components/ManualDataImportSystem';
import TeamManagement from './components/TeamManagement';
import LiveClassroom from './components/LiveClassroom';
import GuestCareSchedule from './components/GuestCareSchedule';
import IncidentLog from './components/IncidentLog';
import InventoryOrdering from './components/InventoryOrdering';
import CommunicationHub from './components/CommunicationHub';
import SalesGuestExperience from './components/SalesGuestExperience';
import GuestReengagement from './components/GuestReengagement';
import SOPSpecialProjects from './components/SOPSpecialProjects';
import DivisionTargets from './components/DivisionTargets';
import ManagerDashboard from './components/ManagerDashboard';
import MonthlyCheckInPage from './components/MonthlyCheckInPage';
import BrandingKPISettings from './components/BrandingKPISettings';
import BusinessSnapshot from './components/BusinessSnapshot';
import { useBranding } from './hooks/useBranding';
import { useKPIManagement } from './hooks/useKPIManagement';
import { useDashboardConfig } from './hooks/useDashboardConfig';
import { getValidatedMenuItems } from './data/sidebarConfig';
import PageCustomizationWrapper from './components/PageCustomizationWrapper';

// Sample data for demonstration
const sampleKPIData: KPIData[] = [
  {
    divisionId: 'new-patient',
    month: '01',
    year: 2025,
    productivityRate: 82,
    prebookRate: 78,
    firstTimeRetentionRate: 85,
    repeatRetentionRate: 92,
    retailPercentage: 28,
    newClients: 52,
    averageTicket: 260,
    serviceSalesPerHour: 155,
    clientsRetailPercentage: 65,
    hoursSold: 165,
    happinessScore: 8.7,
    netCashPercentage: 72,
  },
  {
    divisionId: 'hormone',
    month: '01',
    year: 2025,
    productivityRate: 88,
    prebookRate: 85,
    firstTimeRetentionRate: 90,
    repeatRetentionRate: 96,
    retailPercentage: 32,
    newClients: 38,
    averageTicket: 320,
    serviceSalesPerHour: 190,
    clientsRetailPercentage: 75,
    hoursSold: 145,
    happinessScore: 9.1,
    netCashPercentage: 78,
  },
  {
    divisionId: 'laser',
    month: '01',
    year: 2025,
    productivityRate: 95,
    prebookRate: 92,
    firstTimeRetentionRate: 94,
    repeatRetentionRate: 97,
    retailPercentage: 18,
    newClients: 48,
    averageTicket: 420,
    serviceSalesPerHour: 210,
    clientsRetailPercentage: 42,
    hoursSold: 155,
    happinessScore: 9.3,
    netCashPercentage: 82,
  },
];

// Daily submissions storage
interface DailySubmission {
  divisionId: string;
  date: string;
  isComplete: boolean;
  entries: DailyEntry[];
}

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

function App() {
  // Initialize branding and KPI management
  const { brandingConfig } = useBranding();
  const { getDivisionKPIs, getKPITarget } = useKPIManagement();
  const { dashboardConfig, performanceConfig } = useDashboardConfig();
  
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [kpiData, setKpiData] = useLocalStorage<KPIData[]>('kpiData', sampleKPIData);
  const [employeeKPIData, setEmployeeKPIData] = useLocalStorage<EmployeeKPIData[]>('employeeKPIData', sampleEmployeeKPIData);
  const [employeeList, setEmployeeList] = useLocalStorage<Employee[]>('employees', employees);
  const [employeeTargetList, setEmployeeTargetList] = useLocalStorage<EmployeeTarget[]>('employeeTargets', employeeTargets);
  const [hormoneUnitList, setHormoneUnitList] = useLocalStorage<HormoneUnit[]>('hormoneUnits', initialHormoneUnits);
  const [alerts, setAlerts] = useLocalStorage<Alert[]>('alerts', []);
  const [dailySubmissions, setDailySubmissions] = useLocalStorage<DailySubmission[]>('dailySubmissions', []);
  const [scheduledHours, setScheduledHours] = useLocalStorage<Record<string, number>>('scheduledHours', {});
  const [revenueProjections, setRevenueProjections] = useLocalStorage<RevenueProjection[]>('revenueProjections', []);
  const [payrollData, setPayrollData] = useLocalStorage<PayrollEntry[]>('payrollEntries', []);
  const [managedDivisions, setManagedDivisions] = useLocalStorage<Division[]>('divisions', divisions);
  const [activeView, setActiveView] = useState('manager-dashboard');

  // Validate menu configuration on app start
  React.useEffect(() => {
    try {
      getValidatedMenuItems();
      console.log('✅ Menu configuration validated successfully');
    } catch (error) {
      console.error('❌ Menu configuration validation failed:', error);
    }
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Listen for dashboard configuration changes
  React.useEffect(() => {
    const handleConfigUpdate = () => {
      // Force re-render when dashboard config changes
      setActiveView(prev => prev); // Trigger re-render
    };

    const handleForceUpdate = () => {
      // Force complete re-render of the app
      setActiveView(prev => prev);
      
      // Force re-read of all localStorage data
      const updatedDivisions = JSON.parse(localStorage.getItem('divisions') || '[]');
      if (updatedDivisions.length > 0) {
        // Update divisions state if changed
        setEmployeeList(prev => [...prev]); // Force re-render
      }
    };

    const handleDivisionsUpdate = (event: CustomEvent) => {
      // Update divisions immediately when they change
      if (event.detail?.divisions) {
        // Force re-render of all components that use divisions
        setActiveView(prev => prev);
        
        // Force re-read of localStorage
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    };
    window.addEventListener('dashboardConfigUpdated', handleConfigUpdate);
    window.addEventListener('performanceConfigUpdated', handleConfigUpdate);
    window.addEventListener('brandingConfigurationUpdated', handleConfigUpdate);
    window.addEventListener('divisionColorsUpdated', handleConfigUpdate);
    window.addEventListener('sidebarUpdated', handleConfigUpdate);
    window.addEventListener('kpiSystemUpdated', handleConfigUpdate);
    window.addEventListener('configurationUpdated', handleConfigUpdate);
    window.addEventListener('storage', handleConfigUpdate);
    window.addEventListener('forceConfigurationUpdate', handleForceUpdate);
    window.addEventListener('divisionsUpdated', handleDivisionsUpdate as EventListener);
    window.addEventListener('sidebarConfigUpdated', handleConfigUpdate);

    return () => {
      window.removeEventListener('dashboardConfigUpdated', handleConfigUpdate);
      window.removeEventListener('performanceConfigUpdated', handleConfigUpdate);
      window.removeEventListener('brandingConfigurationUpdated', handleConfigUpdate);
      window.removeEventListener('divisionColorsUpdated', handleConfigUpdate);
      window.removeEventListener('sidebarUpdated', handleConfigUpdate);
      window.removeEventListener('kpiSystemUpdated', handleConfigUpdate);
      window.removeEventListener('configurationUpdated', handleConfigUpdate);
      window.removeEventListener('storage', handleConfigUpdate);
      window.removeEventListener('forceConfigurationUpdate', handleForceUpdate);
      window.removeEventListener('divisionsUpdated', handleDivisionsUpdate as EventListener);
      window.removeEventListener('sidebarConfigUpdated', handleConfigUpdate);
    };
  }, []);

  // Use managed divisions throughout the app
  const activeDivisions = managedDivisions.length > 0 ? managedDivisions : divisions;
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleSaveData = (data: KPIData) => {
    setKpiData(prev => {
      const filtered = prev.filter(
        item => !(item.divisionId === data.divisionId && 
                 item.month === data.month && 
                 item.year === data.year)
      );
      return [...filtered, data];
    });
  };

  const handleSaveEmployeeData = (data: EmployeeKPIData) => {
    setEmployeeKPIData(prev => {
      const filtered = prev.filter(
        item => !(item.employeeId === data.employeeId && 
                 item.month === data.month && 
                 item.year === data.year)
      );
      return [...filtered, data];
    });
  };

  const handleUpdateEmployeeTarget = (target: EmployeeTarget) => {
    setEmployeeTargetList(prev => {
      const filtered = prev.filter(item => item.employeeId !== target.employeeId);
      return [...filtered, target];
    });
  };

  const handleUpdateEmployee = (employee: Employee) => {
    setEmployeeList(prev => {
      const filtered = prev.filter(item => item.id !== employee.id);
      return [...filtered, employee];
    });
  };

  const handleAddEmployee = (employee: Employee) => {
    setEmployeeList(prev => [...prev, employee]);
  };

  const handleRemoveEmployee = (employeeId: string) => {
    setEmployeeList(prev => prev.filter(emp => emp.id !== employeeId));
  };

  const handleUpdateHormoneUnit = (unit: HormoneUnit) => {
    setHormoneUnitList(prev => {
      const filtered = prev.filter(item => item.unitId !== unit.unitId);
      return [...filtered, unit];
    });
  };

  const handleAddHormoneUnit = (unit: HormoneUnit) => {
    setHormoneUnitList(prev => [...prev, unit]);
  };

  const handleUpdateUser = (user: User) => {
    if (!user.id) {
      console.error('Cannot update user without ID');
      return;
    }
    setCurrentUser(user);
  };

  const handleUpdateScheduledHours = (employeeId: string, hours: number) => {
    if (!employeeId) {
      console.error('Cannot update scheduled hours without employee ID');
      return;
    }
    const key = `${employeeId}-${selectedMonth}-${selectedYear}`;
    setScheduledHours(prev => ({
      ...prev,
      [key]: hours
    }));
  };

  const getEmployeeScheduledHours = (employeeId: string, month?: string, year?: number) => {
    const monthKey = month || selectedMonth;
    const yearKey = year || selectedYear;
    const key = `${employeeId}-${monthKey}-${yearKey}`;
    return scheduledHours[key] || 0;
  };

  const handleUpdateProjection = (projection: RevenueProjection) => {
    if (!projection.employeeId && !projection.unitId) {
      console.error('Projection must have either employeeId or unitId');
      return;
    }
    setRevenueProjections(prev => {
      const filtered = prev.filter(p => 
        !((p.employeeId === projection.employeeId || p.unitId === projection.unitId) &&
          p.month === projection.month && p.year === projection.year)
      );
      return [...filtered, projection];
    });
  };
  // Process daily submissions into KPI data
  const processDailySubmissions = () => {
    const currentMonth = selectedMonth;
    const currentYear = selectedYear;
    
    // Get all submissions for current month
    const monthlySubmissions = dailySubmissions.filter(submission => {
      const submissionDate = new Date(submission.date);
      return submissionDate.getMonth() === parseInt(currentMonth) - 1 && 
             submissionDate.getFullYear() === currentYear;
    });
    
    // Process by division
    const processedKPIData = divisions.map(division => {
      const divisionSubmissions = monthlySubmissions.filter(s => s.divisionId === division.id);
      
      if (divisionSubmissions.length === 0) {
        // Return existing data if no submissions
        return kpiData.find(d => d.divisionId === division.id && d.month === currentMonth && d.year === currentYear) || {
          divisionId: division.id,
          month: currentMonth,
          year: currentYear,
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
        };
      }
      
      // Aggregate all entries for the division
      let totalHoursWorked = 0;
      let totalHoursBooked = 0;
      let totalServiceRevenue = 0;
      let totalRetailSales = 0;
      let totalNewClients = 0;
      let totalConsults = 0;
      let totalConsultConverted = 0;
      let totalClients = 0;
      let totalPrebooks = 0;
      let activeEntries = 0;
      
      divisionSubmissions.forEach(submission => {
        submission.entries.forEach(entry => {
          if (entry.status === 'active' && entry.isSubmitted) {
            totalHoursWorked += entry.hoursWorked;
            totalHoursBooked += entry.hoursBooked;
            totalServiceRevenue += entry.serviceRevenue;
            totalRetailSales += entry.retailSales;
            totalNewClients += entry.newClients;
            totalConsults += entry.consults;
            totalConsultConverted += entry.consultConverted;
            totalClients += entry.totalClients;
            totalPrebooks += entry.prebooks;
            activeEntries++;
          }
        });
      });
      
      // Calculate averages and percentages
      const avgProductivityRate = totalHoursWorked > 0 ? Math.round((totalHoursBooked / totalHoursWorked) * 100) : 0;
      const avgPrebookRate = totalClients > 0 ? Math.round((totalPrebooks / totalClients) * 100) : 0;
      const avgConsultConversion = totalConsults > 0 ? Math.round((totalConsultConverted / totalConsults) * 100) : 0;
      const totalRevenue = totalServiceRevenue + totalRetailSales;
      const retailPercentage = totalRevenue > 0 ? Math.round((totalRetailSales / totalRevenue) * 100) : 0;
      const avgTicket = totalNewClients > 0 ? Math.round(totalRevenue / totalNewClients) : 0;
      const salesPerHour = totalHoursBooked > 0 ? Math.round(totalServiceRevenue / totalHoursBooked) : 0;
      
      return {
        divisionId: division.id,
        month: currentMonth,
        year: currentYear,
        productivityRate: avgProductivityRate,
        prebookRate: avgPrebookRate,
        firstTimeRetentionRate: avgConsultConversion, // Using consult conversion as retention proxy
        repeatRetentionRate: Math.min(avgConsultConversion + 10, 100), // Estimated
        retailPercentage: retailPercentage,
        newClients: totalNewClients,
        averageTicket: avgTicket,
        serviceSalesPerHour: salesPerHour,
        clientsRetailPercentage: retailPercentage,
        hoursSold: totalHoursBooked,
        happinessScore: 8.5, // Default value, could be calculated from submissions
        netCashPercentage: Math.round((totalRevenue * 0.7)), // Estimated 70% net
      };
    });
    
    return processedKPIData;
  };
  
  // Update KPI data when daily submissions change
  const updatedKPIData = React.useMemo(() => {
    const processed = processDailySubmissions();
    const existing = kpiData.filter(data => 
      !(data.month === selectedMonth && data.year === selectedYear)
    );
    return [...existing, ...processed];
  }, [dailySubmissions, selectedMonth, selectedYear, kpiData]);
  
  // Move useDashboardData hook after updatedKPIData is defined
  const { data: dashboardData, loading: dashboardLoading } = useDashboardData(
    parseInt(selectedMonth),
    selectedYear,
    'all', // Can be made dynamic later
    updatedKPIData,
    employeeKPIData,
    dailySubmissions,
    employeeList
  );

  const handleWeeklyUpdate = (divisionId: string, weeklyData: any) => {
    // Handle weekly updates from scoreboard
    console.log('Weekly update for division:', divisionId, weeklyData);
  };
  
  const handleDailySubmission = (submission: DailySubmission) => {
    setDailySubmissions(prev => {
      const filtered = prev.filter(s => !(s.divisionId === submission.divisionId && s.date === submission.date));
      const updatedSubmissions = [...filtered, submission];
      
      // Process daily submissions into KPI data
      processAndUpdateKPIData(updatedSubmissions);
      
      return updatedSubmissions;
    });
  };

  // Process daily submissions into KPI data
  const processAndUpdateKPIData = (submissions: DailySubmission[]) => {
    const currentMonth = selectedMonth;
    const currentYear = selectedYear;
    
    // Process by division
    const processedDivisionKPIData = divisions.map(division => {
      const divisionSubmissions = submissions.filter(s => 
        s.divisionId === division.id &&
        new Date(s.date).getMonth() === parseInt(currentMonth) - 1 &&
        new Date(s.date).getFullYear() === currentYear
      );
      
      if (divisionSubmissions.length === 0) {
        return kpiData.find(d => d.divisionId === division.id && d.month === currentMonth && d.year === currentYear);
      }
      
      // Aggregate all entries for the division
      let totalHoursWorked = 0;
      let totalHoursBooked = 0;
      let totalServiceRevenue = 0;
      let totalRetailSales = 0;
      let totalNewClients = 0;
      let totalConsults = 0;
      let totalConsultConverted = 0;
      let totalClients = 0;
      let totalPrebooks = 0;
      let activeEntries = 0;
      
      divisionSubmissions.forEach(submission => {
        submission.entries.forEach(entry => {
          if (entry.status === 'active' && entry.isSubmitted) {
            totalHoursWorked += entry.hoursWorked;
            totalHoursBooked += entry.hoursBooked;
            totalServiceRevenue += entry.serviceRevenue;
            totalRetailSales += entry.retailSales;
            totalNewClients += entry.newClients;
            totalConsults += entry.consults;
            totalConsultConverted += entry.consultConverted;
            totalClients += entry.totalClients;
            totalPrebooks += entry.prebooks;
            activeEntries++;
          }
        });
      });
      
      // Calculate averages and percentages
      const avgProductivityRate = totalHoursWorked > 0 ? Math.round((totalHoursBooked / totalHoursWorked) * 100) : 0;
      const avgPrebookRate = totalClients > 0 ? Math.round((totalPrebooks / totalClients) * 100) : 0;
      const avgConsultConversion = totalConsults > 0 ? Math.round((totalConsultConverted / totalConsults) * 100) : 0;
      const totalRevenue = totalServiceRevenue + totalRetailSales;
      const retailPercentage = totalRevenue > 0 ? Math.round((totalRetailSales / totalRevenue) * 100) : 0;
      const avgTicket = totalNewClients > 0 ? Math.round(totalRevenue / totalNewClients) : 0;
      const salesPerHour = totalHoursBooked > 0 ? Math.round(totalServiceRevenue / totalHoursBooked) : 0;
      
      return {
        divisionId: division.id,
        month: currentMonth,
        year: currentYear,
        productivityRate: avgProductivityRate,
        prebookRate: avgPrebookRate,
        firstTimeRetentionRate: avgConsultConversion,
        repeatRetentionRate: Math.min(avgConsultConversion + 10, 100),
        retailPercentage: retailPercentage,
        newClients: totalNewClients,
        averageTicket: avgTicket,
        serviceSalesPerHour: salesPerHour,
        clientsRetailPercentage: retailPercentage,
        hoursSold: totalHoursBooked,
        happinessScore: 8.5, // Default value
        netCashPercentage: Math.round(totalRevenue * 0.7),
        hoursWorked: totalHoursWorked,
        hoursBooked: totalHoursBooked,
        serviceRevenue: totalServiceRevenue,
        retailSales: totalRetailSales,
        consults: totalConsults,
        consultConverted: totalConsultConverted,
        totalClients: totalClients,
        prebooks: totalPrebooks,
      };
    }).filter(Boolean);
    
    // Process by employee
    const processedEmployeeKPIData: EmployeeKPIData[] = [];
    
    submissions.forEach(submission => {
      const submissionDate = new Date(submission.date);
      if (submissionDate.getMonth() === parseInt(currentMonth) - 1 && submissionDate.getFullYear() === currentYear) {
        submission.entries.forEach(entry => {
          if (entry.status === 'active' && entry.isSubmitted) {
            const employee = employeeList.find(emp => emp.id === entry.employeeId);
            if (employee) {
              const existingData = processedEmployeeKPIData.find(data => data.employeeId === entry.employeeId);
              
              if (existingData) {
                // Aggregate with existing data
                existingData.hoursSold += entry.hoursBooked;
                existingData.newClients += entry.newClients;
                existingData.serviceSalesPerHour = existingData.hoursSold > 0 ? 
                  Math.round((existingData.serviceSalesPerHour * existingData.hoursSold + entry.serviceRevenue) / (existingData.hoursSold + entry.hoursBooked)) : 
                  entry.serviceRevenue / Math.max(entry.hoursBooked, 1);
                existingData.productivityRate = entry.productivityPercentage;
                existingData.retailPercentage = entry.serviceRevenue + entry.retailSales > 0 ? 
                  Math.round((entry.retailSales / (entry.serviceRevenue + entry.retailSales)) * 100) : 0;
                existingData.averageTicket = existingData.newClients > 0 ? 
                  Math.round((entry.serviceRevenue + entry.retailSales) / existingData.newClients) : 0;
              } else {
                // Create new employee KPI data
                processedEmployeeKPIData.push({
                  employeeId: entry.employeeId,
                  divisionId: employee.divisionId,
                  month: currentMonth,
                  year: currentYear,
                  productivityRate: entry.productivityPercentage,
                  prebookRate: entry.prebookPercentage,
                  firstTimeRetentionRate: entry.consultConversionPercentage,
                  repeatRetentionRate: Math.min(entry.consultConversionPercentage + 10, 100),
                  retailPercentage: entry.serviceRevenue + entry.retailSales > 0 ? 
                    Math.round((entry.retailSales / (entry.serviceRevenue + entry.retailSales)) * 100) : 0,
                  newClients: entry.newClients,
                  averageTicket: entry.newClients > 0 ? 
                    Math.round((entry.serviceRevenue + entry.retailSales) / entry.newClients) : 0,
                  serviceSalesPerHour: entry.hoursBooked > 0 ? Math.round(entry.serviceRevenue / entry.hoursBooked) : 0,
                  clientsRetailPercentage: entry.retailSales > 0 ? 50 : 0, // Estimated
                  hoursSold: entry.hoursBooked,
                  happinessScore: 8.5, // Default value
                  netCashPercentage: Math.round((entry.serviceRevenue + entry.retailSales) * 0.7),
                  attendanceRate: 95, // Default value
                  trainingHours: 8, // Default value
                  customerSatisfactionScore: 9.0, // Default value
                });
              }
            }
          }
        });
      }
    });
    
    // Update KPI data state
    setKpiData(prev => {
      const filtered = prev.filter(data => 
        !(data.month === currentMonth && data.year === currentYear)
      );
      return [...filtered, ...processedDivisionKPIData];
    });
    
    // Update employee KPI data state
    setEmployeeKPIData(prev => {
      const filtered = prev.filter(data => 
        !(data.month === currentMonth && data.year === currentYear)
      );
      return [...filtered, ...processedEmployeeKPIData];
    });
  };

  // Handle schedule updates from calendar
  const handleScheduleUpdate = (shifts: any[]) => {
    if (!Array.isArray(shifts)) {
      console.error('Invalid shifts data provided');
      return;
    }
    
    // Calculate total scheduled hours per employee from all shifts
    const employeeHours: Record<string, number> = {};
    
    shifts.forEach(shift => {
      if (shift.employeeId) {
        employeeHours[shift.employeeId] = (employeeHours[shift.employeeId] || 0) + shift.scheduledHours;
      }
    });
    
    // Update scheduled hours state with calculated totals
    const updatedScheduledHours = { ...scheduledHours };
    Object.entries(employeeHours).forEach(([employeeId, totalHours]) => {
      const key = `${employeeId}-${selectedMonth}-${selectedYear}`;
      updatedScheduledHours[key] = totalHours;
    });
    
    setScheduledHours(updatedScheduledHours);
    
    // Store shifts data for persistence
    localStorage.setItem('calendarShifts', JSON.stringify(shifts));
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderActiveView = () => {
    try {
      switch (activeView) {
        case 'manager-dashboard':
          return (
            <ManagerDashboard
              employees={employeeList}
              divisions={activeDivisions}
              kpiData={updatedKPIData}
              employeeKPIData={employeeKPIData}
              dailySubmissions={dailySubmissions}
              currentUser={currentUser}
              onViewChange={setActiveView}
            />
          );
        case 'scoreboard':
          // Scoreboard functionality would go here
          return (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Scoreboard</h2>
              <p className="text-gray-600">Scoreboard functionality will be implemented here.</p>
            </div>
          );
        case 'manager-kpis':
          return (
            <ManagerKPIs
              currentUser={currentUser}
              employees={employeeList}
              divisions={activeDivisions}
              kpiData={updatedKPIData}
              employeeKPIData={employeeKPIData}
              dailySubmissions={dailySubmissions}
              targets={kpiTargets}
              employeeTargets={employeeTargetList}
              scheduledHours={scheduledHours}
              getEmployeeScheduledHours={getEmployeeScheduledHours}
              onUpdateDivisionTarget={() => {}}
              onUpdateEmployeeTarget={handleUpdateEmployeeTarget}
            />
          );
        case 'scheduling':
          return (
            <Scheduling
              employees={employeeList}
              divisions={divisions}
            />
          );
        case 'data-import':
          return <ManualDataImportSystem currentUser={currentUser} />;
        case 'daily-data':
          return (
            <MonthToDateScoreboard
              divisions={activeDivisions}
              employees={employeeList}
              kpiData={updatedKPIData}
              employeeKPIData={employeeKPIData}
              onWeeklyUpdate={handleWeeklyUpdate}
              onDailySubmission={handleDailySubmission}
              dailySubmissions={dailySubmissions}
            />
          );
        case 'scheduling-calendar':
          return (
            <div className="space-y-6">
              <SchedulingCalendar
                employees={employeeList}
                divisions={divisions}
                hormoneUnits={hormoneUnitList}
                currentUser={currentUser}
                onUpdateScheduledHours={handleUpdateScheduledHours}
                onUpdateSchedule={(shifts) => {
                  handleScheduleUpdate(shifts);
                }}
              />
              
              <SchedulingPerformanceDashboard
                employees={employeeList}
                divisions={divisions}
                hormoneUnits={hormoneUnitList}
                kpiData={updatedKPIData}
                employeeKPIData={employeeKPIData}
                shifts={Object.entries(scheduledHours).map(([key, hours]) => {
                  const [employeeId, month, year] = key.split('-');
                  return {
                    id: key,
                    employeeId,
                    date: `${year}-${month}-01`,
                    startTime: '09:00',
                    endTime: '17:00',
                    scheduledHours: hours,
                    location: 'St. Albert',
                    divisionId: employeeList.find(emp => emp.id === employeeId)?.divisionId || '',
                    createdBy: currentUser.id,
                    createdAt: new Date(),
                    isLocked: false,
                  };
                })}
                scheduledHours={scheduledHours}
                getEmployeeScheduledHours={getEmployeeScheduledHours}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
              
              {currentUser.role === 'admin' && (
                <AutoReminderSystem
                  currentUser={currentUser}
                  employees={employeeList}
                  onSendReminder={(log) => {
                    console.log('Reminder sent:', log);
                  }}
                />
              )}
            </div>
          );
        case 'employees':
          const useEmployeeManagementV2 = true; // ⛳ Bolt-safe toggle - ENHANCED VERSION
          
          return (
            <>
              {useEmployeeManagementV2 ? (
                <EmployeeManagementV2
                  employees={employeeList}
                  divisions={activeDivisions}
                  currentUser={currentUser}
                  payrollData={payrollData}
                  employeeTargets={employeeTargetList}
                  employeeKPIData={employeeKPIData}
                  hormoneUnits={hormoneUnitList}
                  getEmployeeScheduledHours={getEmployeeScheduledHours}
                  onUpdateTarget={handleUpdateEmployeeTarget}
                  onUpdateEmployee={handleUpdateEmployee}
                  onAddEmployee={handleAddEmployee}
                  onRemoveEmployee={handleRemoveEmployee}
                  onUpdateHormoneUnit={handleUpdateHormoneUnit}
                  onAddHormoneUnit={handleAddHormoneUnit}
                  onUpdateScheduledHours={handleUpdateScheduledHours}
                />
              ) : (
                <EmployeeManagement
                  employees={employeeList}
                  divisions={activeDivisions}
                  currentUser={currentUser}
                  payrollData={payrollData}
                  employeeTargets={employeeTargetList}
                  employeeKPIData={employeeKPIData}
                  hormoneUnits={hormoneUnitList}
                  getEmployeeScheduledHours={getEmployeeScheduledHours}
                  onUpdateTarget={handleUpdateEmployeeTarget}
                  onUpdateEmployee={handleUpdateEmployee}
                  onAddEmployee={handleAddEmployee}
                  onRemoveEmployee={handleRemoveEmployee}
                  onUpdateHormoneUnit={handleUpdateHormoneUnit}
                  onAddHormoneUnit={handleAddHormoneUnit}
                  onUpdateScheduledHours={handleUpdateScheduledHours}
                />
              )}
            </>
          );
        case 'team-management':
          return (
            <TeamManagement
              employees={employeeList}
              divisions={divisions}
              currentUser={currentUser}
              onUpdateEmployee={handleUpdateEmployee}
            />
          );
        case 'performance-2':
          // Performance page has been removed
          return (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance</h2>
              <p className="text-gray-600">Performance functionality has been removed.</p>
            </div>
          );
        case 'monthly-checkin':
          return (
            <MonthlyCheckInPage
              employees={employeeList}
              divisions={divisions}
              currentUser={currentUser}
              employeeKPIData={employeeKPIData}
              employeeTargets={employeeTargetList}
              goals={employeeTargetList}
              divisionTargets={[]} // Add division targets state if needed
              kpiData={updatedKPIData}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onUpdateEmployee={handleUpdateEmployee}
              onUpdateTarget={handleUpdateEmployeeTarget}
              onUpdateDivisionTarget={(target) => {
                // Handle division target updates
                console.log('Division target updated:', target);
              }}
            />
          );
        case 'branding-kpi-settings':
          return (
            <BrandingKPISettings
              currentUser={currentUser}
              divisions={divisions}
            />
          );
        case 'custom-branding':
          return (
            <BrandingKPISettings
              currentUser={currentUser}
              divisions={divisions}
            />
          );
        case 'division-revenue-targets':
          return (
            <DivisionRevenueTargetsPage
              currentUser={currentUser}
              divisions={divisions}
            />
          );
        case 'division-targets':
          return (
            <DivisionTargets
              currentUser={currentUser}
              divisions={divisions}
              kpiData={updatedKPIData}
              dailySubmissions={dailySubmissions}
              targets={kpiTargets}
              onUpdateDivisionTarget={(target) => {
                console.log('Division target updated:', target);
              }}
            />
          );
        case 'settings':
          return (
            <Settings
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              divisions={activeDivisions}
              kpiData={updatedKPIData}
              targets={kpiTargets}
            />
          );
        case 'business-snapshot':
          return (
            <BusinessSnapshot
              divisions={activeDivisions}
              currentUser={currentUser}
            />
          );
        case 'alerts':
          return (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Alerts & Notifications</h2>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-gray-500">No alerts at this time.</p>
                ) : (
                  alerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.type === 'warning'
                          ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                          : alert.type === 'success'
                          ? 'bg-green-50 border-green-400 text-green-800'
                          : 'bg-blue-50 border-blue-400 text-blue-800'
                      }`}
                    >
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm opacity-75 mt-1">
                        {alert.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        default:
          // Default to manager dashboard for unknown routes
          return (
            <ManagerDashboard
              employees={employeeList}
              divisions={divisions}
              kpiData={updatedKPIData}
              employeeKPIData={employeeKPIData}
              dailySubmissions={dailySubmissions}
              currentUser={currentUser}
              onViewChange={setActiveView}
            />
          );
      }
    } catch (error) {
      console.error('Error rendering view:', error);
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">An error occurred while loading this view.</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout}
        alertCount={alerts.length}
        onNotificationsClick={() => setActiveView('alerts')}
      />
      
      <div className="flex">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <PageCustomizationWrapper pageId={activeView}>
              {renderActiveView()}
            </PageCustomizationWrapper>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;