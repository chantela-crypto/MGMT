import { useState, useEffect, useMemo } from 'react';
import { dataService, DashboardMetrics } from '../services/dataService';
import { KPIData } from '../types/division';
import { EmployeeKPIData, Employee } from '../types/employee';

interface DailySubmission {
  divisionId: string;
  date: string;
  isComplete: boolean;
  entries: any[];
}

interface UseDashboardDataReturn {
  data: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
}

const useDashboardData = (
  selectedMonth,
  selectedYear,
  selectedDivision,
  kpiData,
  employeeKPIData: EmployeeKPIData[],
  dailySubmissions,
  employees
): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const dashboardData = await dataService.fetchDashboardMetrics(
          selectedMonth,
          selectedYear,
          selectedDivision,
          kpiData,
          employeeKPIData,
          dailySubmissions,
          employees
        );
        setData(dashboardData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear, selectedDivision, kpiData, employeeKPIData, dailySubmissions, employees]);

  const returnValue = useMemo(() => ({
    data,
    loading,
    error,
  }), [data, loading, error]);

  return returnValue;
};

export default useDashboardData;
