export interface Employee {
  id: string;
  name: string;
  divisionId: string;
  position: string;
  email: string;
  hireDate: Date;
  isActive: boolean;
  locations: string[];
  experienceLevel: 'Entry Level' | 'Intermediate' | 'Senior' | 'Expert';
  category: 'laser technician' | 'nurse injector' | 'hormone specialist' | 'nurse practitioner' | 'administrative' | 'marketing' | 'sales' | 'physician' | 'guest care' | 'management';
  // Location and Manager Assignment
  primaryLocation: string;
  secondaryLocations: string[];
  assignedManagerId?: string;
  metricsManagerId?: string; // Manager responsible for inputting their metrics
  // Payroll Information
  hourlyWage?: number;
  serviceCommissionPercent?: number;
  retailCommissionPercent?: number;
  // Additional fields for comprehensive profile
  phoneNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  trainingRequests?: string[]; // Training request IDs
  locationAssignment: {
    primaryLocation: string;
    secondaryLocations: string[];
    locationPercentages: Record<string, number>; // Percentage of time at each location
  };
  reportingStructure?: {
    directManagerId: string;
    seniorManagerId?: string;
    divisionLeadId?: string;
  };
  // Payroll Information
  payrollConfig?: {
    hourlyWage: number;
    serviceCommissionPercent: number;
    retailCommissionPercent: number;
    lastUpdated: Date;
    updatedBy: string;
  };
}

export interface EmployeeKPIData {
  employeeId: string;
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
  // Additional employee-specific metrics
  attendanceRate: number;
  trainingHours: number;
  customerSatisfactionScore: number;
  locationId?: string; // Which location this data belongs to
  enteredBy?: string; // Who entered this data
  enteredAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}

export interface EmployeeTarget {
  employeeId: string;
  divisionId: string;
  month: string;
  year: number;
  scheduledHours: number;
  productivityRate: number;
  serviceSales: number;
  retailSales: number;
  serviceSalesPerHour: number;
  prebookRate: number;
  firstTimeRetentionRate: number;
  repeatRetentionRate: number;
  retailPercentage: number;
  newClients: number;
  averageTicket: number;
  clientsRetailPercentage: number;
  hoursSold: number;
  happinessScore: number;
  netCashPercentage: number;
  attendanceRate: number;
  trainingHours: number;
  customerSatisfactionScore: number;
  locationId?: string;
  setBy?: string;
  setAt?: Date;
}

export interface DivisionTarget {
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
  revenue: number;
  profitMargin: number;
}

export interface EmployeeGoal {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  customGoals: CustomGoal[];
  kpiGoals: KPIGoal[];
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  submittedBy: string;
  status: 'draft' | 'submitted' | 'locked' | 'results-updated';
  isLocked: boolean;
  lockedAt?: Date;
}

export interface CustomGoal {
  id: string;
  title: string;
  description: string;
  targetValue?: string;
  measurementMethod: string;
  priority: 'high' | 'medium' | 'low';
  category: 'performance' | 'development' | 'behavior' | 'project' | 'other';
  progress?: number; // 0-100%
  actualResult?: string;
  notes?: string;
  isAchieved?: boolean;
  performanceRating?: number; // 1-10 scale
  managerComments?: string;
  employeeComments?: string;
  ratedBy?: string;
  ratedAt?: Date;
  actualResult?: string;
}

export interface KPIGoal {
  id: string;
  kpiKey: string;
  kpiName: string;
  targetValue: number;
  actualValue?: number;
  unit: string;
  progress?: number; // 0-100%
  isAchieved?: boolean;
  notes?: string;
  performanceRating?: number; // 1-10 scale
  managerComments?: string;
  employeeComments?: string;
  ratedBy?: string;
  ratedAt?: Date;
  actualValue?: number;
}

export interface MonthlyCheckIn {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  goals: EmployeeGoal;
  checkInData: {
    goalsProgress: string;
    whatsWorking: string;
    whatsNotWorking: string;
    results: string;
    nextSteps: string;
    managerNotes: string;
    employeeComments?: string;
    overallPerformanceRating?: number; // 1-10 scale
    strengthsHighlighted?: string;
    areasForImprovement?: string;
    developmentOpportunities?: string;
    managerRecommendations?: string;
    trainingRequests?: TrainingRequest[];
    trainingPlan?: TrainingPlan;
  };
  submissionDeadline: Date;
  resultsDeadline: Date;
  submittedAt?: Date;
  resultsUpdatedAt?: Date;
  status: 'draft' | 'goals-submitted' | 'results-pending' | 'completed' | 'overdue';
  isLocked: boolean;
  lockedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingRequest {
  id: string;
  employeeId?: string;
  title: string;
  type: 'product-knowledge' | 'service-technique' | 'customer-service' | 'safety' | 'compliance' | 'leadership' | 'certification' | 'other';
  description: string;
  justification: string;
  priority: 'high' | 'medium' | 'low';
  estimatedCost?: number;
  estimatedDuration?: number; // hours
  preferredProvider?: string;
  targetCompletionDate?: Date;
  scheduledDate?: Date; // New field for date/time
  isGroupTraining?: boolean; // Individual vs group training
  isInternal?: boolean; // Internal vs external training
  trainerName?: string; // Name of trainer (for internal)
  trainingCompany?: string; // Training company (for external)
  measuredKPI?: string; // KPI to be measured after training
  relatedGoals: string[]; // Goal IDs this training supports
  status: 'requested' | 'approved' | 'denied' | 'scheduled' | 'completed';
  approvedBy?: string;
  approvedAt?: Date;
  denialReason?: string;
  managerComments?: string;
  employeeComments?: string;
  requiresHeadOfficeApproval?: boolean; // For costs over $500
  headOfficeApprovedBy?: string;
  headOfficeApprovedAt?: Date;
  headOfficeComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingPlan {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  quarterlyFocus: string;
  skillGaps: SkillGap[];
  plannedTraining: PlannedTraining[];
  certificationGoals: CertificationGoal[];
  developmentObjectives: string[];
  managerNotes: string;
  employeeInput: string;
  budgetAllocated?: number;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillGap {
  id: string;
  skillArea: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  priority: 'high' | 'medium' | 'low';
  trainingNeeded: string;
  timeframe: '1-month' | '3-months' | '6-months' | '12-months';
}

export interface PlannedTraining {
  id: string;
  title: string;
  type: 'internal' | 'external' | 'online' | 'certification' | 'mentoring';
  provider?: string;
  estimatedCost?: number;
  estimatedHours?: number;
  targetDate?: Date;
  relatedSkillGaps: string[]; // SkillGap IDs
  relatedGoals: string[]; // Goal IDs
  status: 'planned' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  completedAt?: Date;
  effectiveness?: number; // 1-10 rating after completion
  notes?: string;
}

export interface CertificationGoal {
  id: string;
  certificationName: string;
  issuingOrganization: string;
  targetDate: Date;
  estimatedCost?: number;
  studyHours?: number;
  relatedGoals: string[]; // Goal IDs this certification supports
  status: 'planned' | 'studying' | 'scheduled' | 'completed' | 'expired';
  completedAt?: Date;
  expirationDate?: Date;
  renewalRequired?: boolean;
  notes?: string;
}

export interface TrainingRecord {
  id: string;
  employeeId: string;
  trainingTitle: string;
  trainingType: 'product-knowledge' | 'service-technique' | 'customer-service' | 'safety' | 'compliance' | 'leadership' | 'certification' | 'other';
  provider: string;
  instructor?: string;
  startDate: Date;
  endDate?: Date;
  duration: number; // hours
  cost?: number;
  location: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'failed';
  completionScore?: number; // 0-100%
  certificationEarned?: string;
  expirationDate?: Date;
  renewalRequired?: boolean;
  notes?: string;
  materials?: string[];
  feedback?: {
    rating: number; // 1-10
    comments: string;
    wouldRecommend: boolean;
    learningObjectivesMet: boolean;
  };
  managerApproval?: {
    approvedBy: string;
    approvedAt: Date;
    comments: string;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewPeriod: '30-day' | '60-day' | '90-day' | 'quarterly' | 'semi-annual' | 'annual';
  reviewDate: Date;
  reviewerName: string;
  reviewerId: string;
  overallRating: number; // 1-10
  kpiScores: {
    productivity: number;
    salesPerformance: number;
    customerSatisfaction: number;
    teamwork: number;
    attendance: number;
    professionalDevelopment: number;
    qualityOfWork: number;
    initiative: number;
  };
  strengths: string;
  areasForImprovement: string;
  goals: ReviewGoal[];
  actionPlan: string;
  nextReviewDate: Date;
  employeeComments: string;
  managerSignOff: {
    signedBy: string;
    signedAt: Date;
    approved: boolean;
    comments?: string;
  };
  employeeAcknowledgment: {
    acknowledgedBy: string;
    acknowledgedAt: Date;
    agreedToGoals: boolean;
    employeeSignature?: string;
    comments?: string;
  };
  hrReview?: {
    reviewedBy: string;
    reviewedAt: Date;
    hrComments: string;
    flaggedForFollowUp: boolean;
  };
  status: 'draft' | 'pending-employee' | 'pending-hr' | 'completed' | 'overdue';
  isLocked: boolean;
  lockedAt?: Date;
  attachments?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewGoal {
  id: string;
  title: string;
  description: string;
  category: 'productivity' | 'sales' | 'customer-service' | 'professional-development' | 'teamwork' | 'attendance' | 'quality';
  targetDate: Date;
  measurableOutcome: string;
  progress: number; // 0-100%
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  supportRequired: string;
  checkInDates: Date[];
  notes: string;
  actualOutcome?: string;
  completedAt?: Date;
  managerNotes?: string;
}

export interface EmployeeMetricsAssignment {
  employeeId: string;
  primaryLocation: string;
  secondaryLocations: string[];
  assignedDivision: string;
  metricsManagerId: string; // Manager responsible for inputting metrics
  locationPercentages: Record<string, number>; // How much time spent at each location
  effectiveDate: Date;
  assignedBy: string;
  assignedAt: Date;
  notes?: string;
}