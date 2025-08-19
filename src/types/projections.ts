export interface RevenueProjection {
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

export interface UnderperformanceFlag {
  employeeId: string;
  divisionId: string;
  flaggedAt: Date;
  criteria: string[];
  severity: 'low' | 'medium' | 'high';
  isResolved: boolean;
  resolvedAt?: Date;
  notes?: string;
}

export interface CoachingPDFData {
  employee: {
    name: string;
    position: string;
    division: string;
    hireDate: Date;
    experienceLevel: string;
    locations: string[];
  };
  monthlyGoals: {
    scheduledHours: number;
    productivityGoal: number;
    salesPerHour: number;
    revenueProjection: number;
  };
  historicalComparison: {
    lastMonthScheduled: number;
    lastMonthBooked: number;
    lastMonthProductivity: number;
    lastMonthSalesPerHour: number;
    lastMonthRevenue: number;
  };
  coachingNotes: {
    performanceSummary: string;
    coachingPlan: string;
    goalPlan: string;
    barriers: string;
    supportCommitted: string;
  };
  signOff: {
    managerName: string;
    employeeName: string;
    date: Date;
  };
}

export interface DivisionKPIRollup {
  divisionId: string;
  divisionName: string;
  totalScheduledHours: number;
  projectedRevenue: number;
  actualRevenue: number;
  revenueVariance: number;
  avgProductivityGoal: number;
  avgActualProductivity: number;
  productivityVariance: number;
  submissionRate: number;
  revenuePerProvider: number;
  underperformanceCount: number;
  teamSize: number;
}

export interface TrendData {
  entityId: string;
  entityType: 'employee' | 'division';
  month: string;
  year: number;
  revenueProjectionAccuracy: number;
  scheduledVsBooked: number;
  productivityTrend: number;
  retailVariability: number;
}

export interface ProjectionFilters {
  division?: string;
  location?: string;
  role?: string;
  experienceLevel?: string;
  submissionStatus?: 'all' | 'submitted' | 'pending' | 'overdue';
  dateRange?: {
    startMonth: string;
    startYear: number;
    endMonth: string;
    endYear: number;
  };
  showUnderperformanceOnly?: boolean;
}