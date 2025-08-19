import { useState, useEffect } from 'react';
import { DashboardConfig, PerformancePageConfig, ModuleConfig } from '../types/branding';
import { useLocalStorage } from './useLocalStorage';

const defaultDashboardConfig: DashboardConfig = {
  id: 'default-dashboard',
  name: 'Default Dashboard',
  title: 'Executive Command Centre',
  subtitle: 'Real-time performance overview and key metrics',
  enabledModules: {
    revenueCards: true,
    performanceCharts: true,
    teamOverview: true,
    divisionBreakdown: true,
    topPerformers: true,
    alerts: true,
    quickActions: true,
    trendAnalysis: true,
  },
  dataConnections: {
    kpiDataSource: 'daily-submissions',
    employeeDataSource: 'internal',
    financialDataSource: 'manual-import',
    autoRefreshInterval: 5,
  },
  customKPIs: [
    'productivity-rate',
    'retail-percentage',
    'new-clients',
    'average-ticket',
    'happiness-score',
  ],
  performanceReviewConfig: {
    enabled: true,
    frequency: 'quarterly',
    autoGenerate: false,
    requiredFields: ['strengths', 'improvements', 'goals'],
    approvalWorkflow: true,
  },
  targetManagement: {
    allowEmployeeTargets: true,
    allowDivisionTargets: true,
    autoCalculateFromHistory: false,
    targetPeriods: ['monthly', 'quarterly'],
  },
  headerKPIs: {
    card1: 'totalRevenue',
    card2: 'avgProductivity', 
    card3: 'newClients',
    card4: 'salesPerHour',
  },
  showGoalsInHeader: true,
  layoutStyle: 'cards',
  cardsPerRow: 4,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultPerformanceConfig: PerformancePageConfig = {
  id: 'default-performance',
  name: 'Default Performance Page',
  title: 'Performance Management',
  enabledSections: {
    individualMetrics: true,
    teamComparison: true,
    goalTracking: true,
    performanceHistory: true,
    coachingNotes: true,
    actionPlans: true,
    certifications: false,
    attendanceTracking: true,
  },
  metricDisplayOptions: {
    showTargetComparison: true,
    showTrendIndicators: true,
    showPeerComparison: false,
    defaultTimeRange: '6m',
    chartType: 'line',
  },
  reviewWorkflow: {
    managerApprovalRequired: true,
    employeeAcknowledgmentRequired: true,
    autoScheduleFollowUp: true,
    reminderSettings: {
      enabled: true,
      daysBefore: 7,
      recipients: ['manager', 'hr'],
    },
  },
  customFields: [
    {
      id: 'development-goals',
      name: 'Development Goals',
      type: 'textarea',
      required: true,
    },
    {
      id: 'training-needs',
      name: 'Training Needs',
      type: 'select',
      required: false,
      options: ['Technical Skills', 'Customer Service', 'Leadership', 'Product Knowledge'],
    },
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultModules: ModuleConfig[] = [
  {
    id: 'revenue-tracking',
    name: 'Revenue Tracking',
    description: 'Real-time revenue monitoring and projections',
    category: 'dashboard',
    isEnabled: true,
    dependencies: [],
    settings: {
      updateFrequency: 'real-time',
      showProjections: true,
      includeRetail: true,
    },
    permissions: ['view-revenue', 'edit-revenue'],
  },
  {
    id: 'employee-performance',
    name: 'Employee Performance',
    description: 'Individual and team performance tracking',
    category: 'performance',
    isEnabled: true,
    dependencies: ['revenue-tracking'],
    settings: {
      showComparisons: true,
      enableGoalSetting: true,
      autoGenerateReviews: false,
    },
    permissions: ['view-performance', 'edit-performance'],
  },
  {
    id: 'coaching-tools',
    name: 'Coaching Tools',
    description: 'Performance coaching and development tracking',
    category: 'management',
    isEnabled: true,
    dependencies: ['employee-performance'],
    settings: {
      requireManagerApproval: true,
      enableActionPlans: true,
      trackFollowUps: true,
    },
    permissions: ['manage-coaching'],
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Predictive analytics and trend analysis',
    category: 'analytics',
    isEnabled: false,
    dependencies: ['revenue-tracking', 'employee-performance'],
    settings: {
      predictionHorizon: 90,
      confidenceLevel: 95,
      includeSeasonality: true,
    },
    permissions: ['view-analytics'],
  },
];

export const useDashboardConfig = () => {
  const [dashboardConfig, setDashboardConfig] = useLocalStorage<DashboardConfig>('dashboardConfig', defaultDashboardConfig);
  const [performanceConfig, setPerformanceConfig] = useLocalStorage<PerformancePageConfig>('performanceConfig', defaultPerformanceConfig);
  const [modules, setModules] = useLocalStorage<ModuleConfig[]>('moduleConfigs', defaultModules);

  // Update dashboard configuration
  const updateDashboardConfig = (updates: Partial<DashboardConfig>) => {
    setDashboardConfig(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  };

  // Update performance page configuration
  const updatePerformanceConfig = (updates: Partial<PerformancePageConfig>) => {
    setPerformanceConfig(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  };

  // Toggle module
  const toggleModule = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, isEnabled: !module.isEnabled }
        : module
    ));
  };

  // Update module settings
  const updateModuleSettings = (moduleId: string, settings: Record<string, any>) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, settings: { ...module.settings, ...settings } }
        : module
    ));
  };

  // Add custom field to performance config
  const addCustomField = (field: PerformancePageConfig['customFields'][0]) => {
    setPerformanceConfig(prev => ({
      ...prev,
      customFields: [...prev.customFields, field],
      updatedAt: new Date(),
    }));
  };

  // Remove custom field
  const removeCustomField = (fieldId: string) => {
    setPerformanceConfig(prev => ({
      ...prev,
      customFields: prev.customFields.filter(field => field.id !== fieldId),
      updatedAt: new Date(),
    }));
  };

  // Get enabled modules by category
  const getEnabledModules = (category?: string) => {
    return modules.filter(module => 
      module.isEnabled && (!category || module.category === category)
    );
  };

  // Check if module is enabled
  const isModuleEnabled = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    return module?.isEnabled || false;
  };

  // Reset to defaults
  const resetDashboardConfig = () => {
    setDashboardConfig(defaultDashboardConfig);
  };

  const resetPerformanceConfig = () => {
    setPerformanceConfig(defaultPerformanceConfig);
  };

  const resetModules = () => {
    setModules(defaultModules);
  };

  // Apply configuration changes to the actual dashboard
  const applyDashboardConfig = () => {
    // Force re-render of dashboard components by updating timestamp
    setDashboardConfig(prev => ({
      ...prev,
      updatedAt: new Date(),
    }));
    
    // Trigger any necessary side effects
    if (typeof window !== 'undefined') {
      // Dispatch custom event to notify dashboard components of config changes
      window.dispatchEvent(new CustomEvent('dashboardConfigUpdated', {
        detail: dashboardConfig
      }));
      
      // Also dispatch storage event for broader compatibility
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'dashboardConfig',
        newValue: JSON.stringify(dashboardConfig),
        storageArea: localStorage
      }));
      
      // Force immediate localStorage update
      try {
        localStorage.setItem('dashboardConfig', JSON.stringify(dashboardConfig));
      } catch (error) {
        console.error('Error saving dashboard config:', error);
      }
    }
  };

  const applyPerformanceConfig = () => {
    // Force re-render of performance components by updating timestamp
    setPerformanceConfig(prev => ({
      ...prev,
      updatedAt: new Date(),
    }));
    
    // Trigger any necessary side effects
    if (typeof window !== 'undefined') {
      // Dispatch custom event to notify performance components of config changes
      window.dispatchEvent(new CustomEvent('performanceConfigUpdated', {
        detail: performanceConfig
      }));
      
      // Also dispatch storage event for broader compatibility
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'performanceConfig',
        newValue: JSON.stringify(performanceConfig),
        storageArea: localStorage
      }));
      
      // Force immediate localStorage update
      try {
        localStorage.setItem('performanceConfig', JSON.stringify(performanceConfig));
      } catch (error) {
        console.error('Error saving performance config:', error);
      }
    }
  };

  return {
    dashboardConfig,
    performanceConfig,
    modules,
    updateDashboardConfig,
    updatePerformanceConfig,
    toggleModule,
    updateModuleSettings,
    addCustomField,
    removeCustomField,
    getEnabledModules,
    isModuleEnabled,
    resetDashboardConfig,
    resetPerformanceConfig,
    resetModules,
    applyDashboardConfig,
    applyPerformanceConfig,
  };
};