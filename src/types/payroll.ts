export interface PayrollEntry {
  id: string;
  payPeriodId: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  role: string;
  homeLocation: string;
  hoursScheduled: number;
  hoursWorked: number;
  hourlyRate: number;
  hourlyPay: number;
  commissionPay: number;
  otherEarnings: number;
  deductions: number;
  totalPay: number;
  totalRevenue: number;
  payrollToRevenuePercent: number;
  statusColor: 'red' | 'orange' | 'green' | 'yellow';
  notes: string;
  lastUpdatedBy: string;
  lastUpdatedAt: Date;
}