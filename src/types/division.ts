export interface Division {
  id: string;
  name: string;
  color: string;
}

export interface KPIData {
  divisionId: string;
  month: string;
  year: number;
  productivityRate: number;
  prebookRate: number;
  firstTimeRetentionRate: number;
  repeatRetentionRate: number;
  retailPercentage: number;
  newClients: number;
  averageTicket: number;
  serviceSalesPerHour: number;
  clientsRetailPercentage: number;
  hoursSold: number;
  happinessScore: number;
  netCashPercentage: number;
  // New fields from daily scoreboard data
  hoursWorked?: number;
  hoursBooked?: number;
  serviceRevenue?: number;
  retailSales?: number;
  consults?: number;
  consultConverted?: number;
  totalClients?: number;
  prebooks?: number;
}

export interface KPITarget {
  divisionId: string;
  productivityRate: number;
  prebookRate: number;
  firstTimeRetentionRate: number;
  repeatRetentionRate: number;
  retailPercentage: number;
  newClients: number;
  averageTicket: number;
  serviceSalesPerHour: number;
  clientsRetailPercentage: number;
  hoursSold: number;
  happinessScore: number;
  netCashPercentage: number;
}

export type UserRole = 'admin' | 'division-manager' | 'executive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  divisionId?: string;
}

export type ScoreLevel = 'excellent' | 'good' | 'warning' | 'poor';

export interface Alert {
  id: string;
  divisionId: string;
  message: string;
  type: 'warning' | 'success' | 'info';
  createdAt: Date;
}