export interface BusinessKPIData {
  id: string;
  divisionId: string;
  month: string;
  year: number;
  
  // Revenue Metrics
  serviceSales: number;
  retailSales: number;
  totalRevenue: number;
  
  // Expense Metrics
  payroll: number;
  locationExpenses: number;
  locationRentUtilities: number;
  totalExpenses: number;
  
  // Profit Metrics
  netIncome: number;
  netProfitPercentage: number;
  marginPercentage: number;
  
  // Metadata
  enteredBy: string;
  enteredAt: Date;
  lastUpdatedBy: string;
  lastUpdatedAt: Date;
}

export interface BusinessKPIEntry {
  divisionId: string;
  divisionName: string;
  month: string;
  year: number;
  data: BusinessKPIData;
  isComplete: boolean;
}