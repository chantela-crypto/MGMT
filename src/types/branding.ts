// Core Branding Configuration
export interface BrandingConfig {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    neutral: string;
    background: string;
    surface: string;
    border?: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
  typography: {
    fontFamily: string;
    headingFontFamily: string;
    fontSize: Record<'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl', string>;
    fontWeight: Record<'normal' | 'medium' | 'semibold' | 'bold', string>;
    lineHeight: Record<'tight' | 'normal' | 'relaxed', string>;
  };
  spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', string>;
  borderRadius: Record<'sm' | 'md' | 'lg' | 'xl' | 'full', string>;
  shadows: Record<'sm' | 'md' | 'lg' | 'xl', string>;
  logo: {
    url: string;
    width: string;
    height: string;
    alt: string;
  };
  companyName: string;
  tagline: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Division Theme Configuration
export interface DivisionColorConfig {
  id: string;
  name: string;
  divisionColors: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sidebar and Navigation
export interface SidebarMenuItem {
  id: string;
  label: string;
  originalLabel: string;
  icon?: string;
  parentId?: string;
  children?: Array<string | SidebarMenuItem>;
  route?: string;

  isFolder: boolean;
  isSeparator: boolean;
  isVisible: boolean;
  isCustom: boolean;
  canPromoteToMain: boolean;
  canDemoteToSub: boolean;
  sortOrder: number;
}

export interface SidebarConfig {
  id: string;
  name: string;
  menuItems: SidebarMenuItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// KPI System
export type KPICategory = 'performance' | 'financial' | 'operational' | 'satisfaction' | 'growth' | 'retention';
export type KPIDataType = 'percentage' | 'currency' | 'number' | 'score' | 'hours';

export interface KPIDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  category: KPICategory;
  dataType: KPIDataType;
  unit: string;
  target?: number;
  minValue?: number;
  maxValue?: number;
  formula?: string;
  dependencies?: string[];
  isActive: boolean;
  sortOrder: number;
  divisionSpecific: boolean;
  applicableDivisions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DivisionKPIConfig {
  id: string;
  divisionId: string;
  kpiDefinitions: KPIDefinition[];
  customTargets: Record<string, number>;
  displayOrder: string[];
  isActive: boolean;
  updatedAt: Date;
}

// Dashboard
export interface DashboardConfig {
  id: string;
  name: string;
  title: string;
  subtitle: string;

  enabledModules: {
    revenueCards: boolean;
    performanceCharts: boolean;
    teamOverview: boolean;
    divisionBreakdown: boolean;
    topPerformers: boolean;
    alerts: boolean;
    quickActions: boolean;
    trendAnalysis: boolean;
  };

  dataConnections: {
    kpiDataSource: 'daily-submissions' | 'manual-entry' | 'api-sync';
    employeeDataSource: 'internal' | 'hr-system' | 'manual';
    financialDataSource: 'accounting-system' | 'manual-import' | 'api';
    autoRefreshInterval: number; // in minutes
  };

  customKPIs: string[];

  performanceReviewConfig: {
    enabled: boolean;
    frequency: 'monthly' | 'quarterly' | 'annual';
    autoGenerate: boolean;
    requiredFields: string[];
    approvalWorkflow: boolean;
  };

  targetManagement: {
    allowEmployeeTargets: boolean;
    allowDivisionTargets: boolean;
    autoCalculateFromHistory: boolean;
    targetPeriods: Array<'monthly' | 'quarterly' | 'annual'>;
  };

  headerKPIs?: Record<'card1' | 'card2' | 'card3' | 'card4', string>;
  showGoalsInHeader?: boolean;
  layoutStyle?: 'cards' | 'compact' | 'detailed' | 'grid';
  cardsPerRow?: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Performance Page
export interface PerformancePageConfig {
  id: string;
  name: string;
  title: string;

  enabledSections: {
    individualMetrics: boolean;
    teamComparison: boolean;
    goalTracking: boolean;
    performanceHistory: boolean;
    coachingNotes: boolean;
    actionPlans: boolean;
    certifications: boolean;
    attendanceTracking: boolean;
  };

  metricDisplayOptions: {
    showTargetComparison: boolean;
    showTrendIndicators: boolean;
    showPeerComparison: boolean;
    defaultTimeRange: '1m' | '3m' | '6m' | '12m';
    chartType: 'line' | 'bar' | 'area';
  };

  reviewWorkflow: {
    managerApprovalRequired: boolean;
    employeeAcknowledgmentRequired: boolean;
    autoScheduleFollowUp: boolean;
    reminderSettings: {
      enabled: boolean;
      daysBefore: number;
      recipients: string[];
    };
  };

  customFields: Array<{
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    required: boolean;
    options?: string[];
  }>;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Modules
export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  category: 'dashboard' | 'performance' | 'reporting' | 'analytics' | 'management';
  isEnabled: boolean;
  dependencies: string[];
  settings: Record<string, any>;
  permissions: string[];
}

// Branding Presets
export interface BrandingPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<BrandingConfig>;
  thumbnail?: string;
  isBuiltIn: boolean;
}
