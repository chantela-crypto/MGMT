export interface BusinessExpenseData {
  id: string;
  location: string;
  month: string;
  year: number;
  
  // Expense Categories
  rent: number;
  utilities: number;
  insurance: number;
  supplies: number;
  marketing: number;
  maintenance: number;
  otherExpenses: number;
  totalExpenses: number;
  
  // Division Allocation (optional)
  divisionAllocations?: Record<string, number>;
  
  // Metadata
  enteredBy: string;
  enteredAt: Date;
  lastUpdatedBy: string;
  lastUpdatedAt: Date;
  notes?: string;
}

export interface LocationFinancialSummary {
  location: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  monthlyMargin: number;
  ytdRevenue: number;
  ytdExpenses: number;
  ytdProfit: number;
  ytdMargin: number;
  hasExpenseData: boolean;
}

export interface DivisionFinancialSummary {
  divisionId: string;
  divisionName: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyPayroll: number;
  monthlyPayrollRatio: number;
  monthlyProfit: number;
  monthlyMargin: number;
  ytdRevenue: number;
  ytdExpenses: number;
  ytdPayroll: number;
  ytdPayrollRatio: number;
  ytdProfit: number;
  ytdMargin: number;
  hasExpenseData: boolean;
}