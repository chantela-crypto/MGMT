import { useState, useEffect } from 'react';
import { PageCustomization, CustomPageField, PageMetricConfig, PageFilterConfig, PageActionConfig } from '../types/pageCustomization';
import { useLocalStorage } from './useLocalStorage';

const defaultPageCustomizations: Record<string, PageCustomization> = {
  'manager-dashboard': {
    id: 'manager-dashboard-config',
    pageId: 'manager-dashboard',
    pageName: 'Executive Command Centre',
    title: 'Executive Command Centre',
    subtitle: 'Year-to-date performance vs annual goals',
    description: 'Comprehensive YTD dashboard with annual goal tracking',
    colors: {
      primary: '#0c5b63',
      secondary: '#0c5b63',
      accent: '#0f6b73',
      background: '#f9fafb',
      surface: '#ffffff',
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        muted: '#9ca3af',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    typography: {
      headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    layout: {
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      cardsPerRow: 4,
      layoutStyle: 'cards',
    },
    enabledSections: {
      ytdMetrics: true,
      divisionPerformance: true,
      businessInsights: true,
      managerNotifications: true,
      quickActions: true,
      teamStatus: true,
      goalProgress: true,
    },
    customFields: [],
    metrics: [
      {
        id: 'total-revenue',
        name: 'Total Revenue',
        key: 'totalRevenue',
        description: 'Total revenue across all divisions',
        dataSource: 'kpi-data',
        calculation: 'sum(averageTicket * newClients)',
        displayFormat: 'currency',
        target: 150000,
        thresholds: {
          excellent: 120,
          good: 100,
          warning: 80,
          poor: 60,
        },
        colors: {
          primary: '#ec4899',
          secondary: '#f472b6',
        },
        isVisible: true,
        displayOrder: 1,
        size: 'medium',
        refreshRate: 'real-time',
      },
    ],
    filters: [],
    actions: [],
    dataConnections: {
      primarySource: 'daily-submissions',
      refreshInterval: 5,
      cacheEnabled: true,
    },
    permissions: {
      viewPermissions: ['all'],
      editPermissions: ['admin', 'executive'],
      adminOnly: false,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  'performance-2': {
    id: 'performance-2-config',
    pageId: 'performance-2',
    pageName: 'Performance',
    title: 'Performance Management',
    subtitle: 'Individual and team performance tracking',
    description: 'Comprehensive performance monitoring and goal tracking',
    colors: {
      primary: '#ec4899',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: '#f9fafb',
      surface: '#ffffff',
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        muted: '#9ca3af',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    typography: {
      headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    layout: {
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      cardsPerRow: 3,
      layoutStyle: 'cards',
    },
    enabledSections: {
      individualMetrics: true,
      teamComparison: true,
      goalTracking: true,
      performanceHistory: true,
      coachingNotes: true,
      actionPlans: true,
    },
    customFields: [],
    metrics: [],
    filters: [],
    actions: [],
    dataConnections: {
      primarySource: 'employee-kpi-data',
      refreshInterval: 10,
      cacheEnabled: true,
    },
    permissions: {
      viewPermissions: ['all'],
      editPermissions: ['admin', 'division-manager'],
      adminOnly: false,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  'daily-data': {
    id: 'daily-data-config',
    pageId: 'daily-data',
    pageName: 'Daily Data',
    title: 'Daily Data',
    subtitle: 'Real-time daily submissions and performance tracking',
    description: 'Track 12 key daily performance metrics and team submissions',
    colors: {
      primary: '#f4647d',
      secondary: '#f4647d',
      accent: '#fd8585',
      background: '#f9fafb',
      surface: '#ffffff',
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        muted: '#9ca3af',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    typography: {
      headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    layout: {
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      cardsPerRow: 3,
      layoutStyle: 'cards',
    },
    enabledSections: {
      dailySubmissions: true,
      divisionScoreboard: true,
      submissionProgress: true,
      performanceMetrics: true,
      revenueTracking: true,
      teamPerformance: true,
    },
    customFields: [],
    metrics: [],
    filters: [],
    actions: [],
    dataConnections: {
      primarySource: 'daily-submissions',
      refreshInterval: 1,
      cacheEnabled: true,
    },
    permissions: {
      viewPermissions: ['all'],
      editPermissions: ['admin', 'division-manager'],
      adminOnly: false,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  'monthly-checkin': {
    id: 'monthly-checkin-config',
    pageId: 'monthly-checkin',
    pageName: 'Monthly Check-in',
    title: 'Monthly Employee Check-in',
    subtitle: 'Goal setting and performance review system',
    description: 'Monthly employee check-ins, goal setting, and performance tracking',
    colors: {
      primary: '#F8708A',
      secondary: '#F8708A',
      accent: '#F8708A',
      background: '#f9fafb',
      surface: '#ffffff',
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        muted: '#9ca3af',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    typography: {
      headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    layout: {
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      cardsPerRow: 2,
      layoutStyle: 'cards',
    },
    enabledSections: {
      monthlyGoals: true,
      employeeCheckIns: true,
      goalTracking: true,
      performanceReview: true,
      developmentPlanning: true,
      managerFeedback: true,
      actionPlans: true,
    },
    customFields: [],
    metrics: [],
    filters: [],
    actions: [],
    dataConnections: {
      primarySource: 'employee-goals',
      refreshInterval: 10,
      cacheEnabled: true,
    },
    permissions: {
      viewPermissions: ['all'],
      editPermissions: ['admin', 'division-manager'],
      adminOnly: false,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  'financials': {
    id: 'financials-config',
    pageId: 'financials',
    pageName: 'Financial KPIs',
    title: 'Financial Dashboard',
    subtitle: 'Revenue, expenses, and profitability tracking',
    description: 'Comprehensive financial KPI tracking and analysis',
    colors: {
      primary: '#ec4899',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: '#f9fafb',
      surface: '#ffffff',
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        muted: '#9ca3af',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    typography: {
      headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    layout: {
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      cardsPerRow: 4,
      layoutStyle: 'cards',
    },
    enabledSections: {
      revenueTracking: true,
      expenseManagement: true,
      profitAnalysis: true,
      payrollRatios: true,
      budgetPlanning: true,
      financialReports: true,
      trendAnalysis: true,
    },
    customFields: [],
    metrics: [],
    filters: [],
    actions: [],
    dataConnections: {
      primarySource: 'financial-data',
      refreshInterval: 15,
      cacheEnabled: true,
    },
    permissions: {
      viewPermissions: ['admin', 'executive'],
      editPermissions: ['admin'],
      adminOnly: false,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  'scheduling-calendar': {
    id: 'scheduling-calendar-config',
    pageId: 'scheduling-calendar',
    pageName: 'Scheduling Calendar',
    title: 'Scheduling Calendar',
    subtitle: 'Staff scheduling and calendar management system',
    description: 'Comprehensive scheduling with performance dashboard and auto-reminders',
    colors: {
      primary: '#f4647d',
      secondary: '#f4647d',
      accent: '#fd8585',
      background: '#f9fafb',
      surface: '#ffffff',
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        muted: '#9ca3af',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    typography: {
      headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    layout: {
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      cardsPerRow: 3,
      layoutStyle: 'cards',
    },
    enabledSections: {
      weeklyCalendar: true,
      monthlyCalendar: true,
      employeeScheduling: true,
      hormoneUnitScheduling: true,
      shiftManagement: true,
      performanceDashboard: true,
      autoReminders: true,
      schedulingReports: true,
    },
    customFields: [],
    metrics: [],
    filters: [],
    actions: [],
    dataConnections: {
      primarySource: 'scheduling-data',
      refreshInterval: 5,
      cacheEnabled: true,
    },
    permissions: {
      viewPermissions: ['all'],
      editPermissions: ['admin', 'division-manager'],
      adminOnly: false,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  'data-import': {
    id: 'data-import-config',
    pageId: 'data-import',
    pageName: 'Data Import',
    title: 'Data Import',
    subtitle: 'Manual employee KPI data entry and bulk import system',
    description: 'Comprehensive data import with manual entry and bulk upload',
    colors: {
      primary: '#f4647d',
      secondary: '#f4647d',
      accent: '#fd8585',
      background: '#f9fafb',
      surface: '#ffffff',
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        muted: '#9ca3af',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    typography: {
      headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    layout: {
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      cardsPerRow: 4,
      layoutStyle: 'cards',
    },
    enabledSections: {
      manualEntry: true,
      bulkImport: true,
      dataValidation: true,
      exportTools: true,
      importHistory: true,
    },
    customFields: [],
    metrics: [],
    filters: [],
    actions: [],
    dataConnections: {
      primarySource: 'manual-entry',
      refreshInterval: 10,
      cacheEnabled: true,
    },
    permissions: {
      viewPermissions: ['all'],
      editPermissions: ['admin', 'division-manager'],
      adminOnly: false,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  'custom-branding': {
    id: 'custom-branding-config',
    pageId: 'custom-branding',
    pageName: 'Customizer',
    title: 'Customizer',
    subtitle: 'System customization and branding management',
    description: 'Comprehensive customization system for branding, navigation, and page settings',
    colors: {
      primary: '#0c5b63',
      secondary: '#0c5b63',
      accent: '#0f6b73',
      background: '#f9fafb',
      surface: '#ffffff',
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        muted: '#9ca3af',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    typography: {
      headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    layout: {
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      cardsPerRow: 3,
      layoutStyle: 'cards',
    },
    enabledSections: {
      brandingManagement: true,
      divisionColors: true,
      kpiManagement: true,
      sidebarCustomization: true,
      dashboardCustomization: true,
      performanceCustomization: true,
      pageCustomization: true,
    },
    customFields: [],
    metrics: [],
    filters: [],
    actions: [],
    dataConnections: {
      primarySource: 'configuration',
      refreshInterval: 0,
      cacheEnabled: true,
    },
    permissions: {
      viewPermissions: ['admin'],
      editPermissions: ['admin'],
      adminOnly: true,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const usePageCustomization = () => {
  const [pageCustomizations, setPageCustomizations] = useLocalStorage<Record<string, PageCustomization>>(
    'pageCustomizations',
    defaultPageCustomizations
  );

  // Get customization for a specific page
  const getPageCustomization = (pageId: string): PageCustomization => {
    return pageCustomizations[pageId] || defaultPageCustomizations[pageId] || createDefaultPageConfig(pageId);
  };

  // Update page customization
  const updatePageCustomization = (pageId: string, updates: Partial<PageCustomization>) => {
    setPageCustomizations(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        ...updates,
        updatedAt: new Date(),
      },
    }));
  };

  // Add custom field to page
  const addCustomField = (pageId: string, field: Omit<CustomPageField, 'id'>) => {
    const newField: CustomPageField = {
      ...field,
      id: `field-${Date.now()}`,
    };

    updatePageCustomization(pageId, {
      customFields: [
        ...(getPageCustomization(pageId).customFields || []),
        newField,
      ],
    });
  };

  // Update custom field
  const updateCustomField = (pageId: string, fieldId: string, updates: Partial<CustomPageField>) => {
    const pageConfig = getPageCustomization(pageId);
    const updatedFields = pageConfig.customFields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );

    updatePageCustomization(pageId, { customFields: updatedFields });
  };

  // Remove custom field
  const removeCustomField = (pageId: string, fieldId: string) => {
    const pageConfig = getPageCustomization(pageId);
    const updatedFields = pageConfig.customFields.filter(field => field.id !== fieldId);

    updatePageCustomization(pageId, { customFields: updatedFields });
  };

  // Add metric to page
  const addMetric = (pageId: string, metric: Omit<PageMetricConfig, 'id'>) => {
    const newMetric: PageMetricConfig = {
      ...metric,
      id: `metric-${Date.now()}`,
    };

    updatePageCustomization(pageId, {
      metrics: [
        ...(getPageCustomization(pageId).metrics || []),
        newMetric,
      ],
    });
  };

  // Update metric
  const updateMetric = (pageId: string, metricId: string, updates: Partial<PageMetricConfig>) => {
    const pageConfig = getPageCustomization(pageId);
    const updatedMetrics = pageConfig.metrics.map(metric =>
      metric.id === metricId ? { ...metric, ...updates } : metric
    );

    updatePageCustomization(pageId, { metrics: updatedMetrics });
  };

  // Remove metric
  const removeMetric = (pageId: string, metricId: string) => {
    const pageConfig = getPageCustomization(pageId);
    const updatedMetrics = pageConfig.metrics.filter(metric => metric.id !== metricId);

    updatePageCustomization(pageId, { metrics: updatedMetrics });
  };

  // Add filter to page
  const addFilter = (pageId: string, filter: Omit<PageFilterConfig, 'id'>) => {
    const newFilter: PageFilterConfig = {
      ...filter,
      id: `filter-${Date.now()}`,
    };

    updatePageCustomization(pageId, {
      filters: [
        ...(getPageCustomization(pageId).filters || []),
        newFilter,
      ],
    });
  };

  // Update filter
  const updateFilter = (pageId: string, filterId: string, updates: Partial<PageFilterConfig>) => {
    const pageConfig = getPageCustomization(pageId);
    const updatedFilters = pageConfig.filters.map(filter =>
      filter.id === filterId ? { ...filter, ...updates } : filter
    );

    updatePageCustomization(pageId, { filters: updatedFilters });
  };

  // Remove filter
  const removeFilter = (pageId: string, filterId: string) => {
    const pageConfig = getPageCustomization(pageId);
    const updatedFilters = pageConfig.filters.filter(filter => filter.id !== filterId);

    updatePageCustomization(pageId, { filters: updatedFilters });
  };

  // Add action to page
  const addAction = (pageId: string, action: Omit<PageActionConfig, 'id'>) => {
    const newAction: PageActionConfig = {
      ...action,
      id: `action-${Date.now()}`,
    };

    updatePageCustomization(pageId, {
      actions: [
        ...(getPageCustomization(pageId).actions || []),
        newAction,
      ],
    });
  };

  // Apply page customization to DOM
  const applyPageCustomization = (pageId: string) => {
    const config = getPageCustomization(pageId);
    const root = document.documentElement;

    // Apply page-specific CSS variables
    root.style.setProperty(`--page-${pageId}-primary`, config.colors.primary);
    root.style.setProperty(`--page-${pageId}-secondary`, config.colors.secondary);
    root.style.setProperty(`--page-${pageId}-accent`, config.colors.accent);
    root.style.setProperty(`--page-${pageId}-background`, config.colors.background);
    root.style.setProperty(`--page-${pageId}-surface`, config.colors.surface);
    root.style.setProperty(`--page-${pageId}-text-primary`, config.colors.text.primary);
    root.style.setProperty(`--page-${pageId}-text-secondary`, config.colors.text.secondary);
    root.style.setProperty(`--page-${pageId}-text-muted`, config.colors.text.muted);

    // Apply typography
    root.style.setProperty(`--page-${pageId}-heading-font`, config.typography.headingFont);
    root.style.setProperty(`--page-${pageId}-body-font`, config.typography.bodyFont);

    // Apply layout
    Object.entries(config.layout.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--page-${pageId}-spacing-${key}`, value);
    });

    Object.entries(config.layout.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--page-${pageId}-radius-${key}`, value);
    });

    Object.entries(config.layout.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--page-${pageId}-shadow-${key}`, value);
    });
    
    // Dispatch event to notify page components
    window.dispatchEvent(new CustomEvent('pageCustomizationUpdated', {
      detail: { pageId, config, timestamp: new Date().toISOString() }
    }));
  };

  // Reset page to default
  const resetPageToDefault = (pageId: string) => {
    if (defaultPageCustomizations[pageId]) {
      setPageCustomizations(prev => ({
        ...prev,
        [pageId]: {
          ...defaultPageCustomizations[pageId],
          updatedAt: new Date(),
        },
      }));
    }
  };

  // Export page configuration
  const exportPageConfig = (pageId: string) => {
    const config = getPageCustomization(pageId);
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pageId}-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import page configuration
  const importPageConfig = (pageId: string, configFile: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string) as PageCustomization;
          setPageCustomizations(prev => ({
            ...prev,
            [pageId]: {
              ...importedConfig,
              id: `${pageId}-config`,
              pageId,
              updatedAt: new Date(),
            },
          }));
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(configFile);
    });
  };

  // Get all customizable pages
  const getCustomizablePages = () => {
    return Object.keys(pageCustomizations).map(pageId => ({
      pageId,
      config: pageCustomizations[pageId],
    }));
  };

  // Create default page config
  const createDefaultPageConfig = (pageId: string): PageCustomization => {
    return {
      id: `${pageId}-config`,
      pageId,
      pageName: pageId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      title: pageId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      colors: {
        primary: '#ec4899',
        secondary: '#ec4899',
        accent: '#f472b6',
        background: '#f9fafb',
        surface: '#ffffff',
        text: {
          primary: '#111827',
          secondary: '#4b5563',
          muted: '#9ca3af',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
      },
      typography: {
        headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700',
        },
      },
      layout: {
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
        },
        borderRadius: {
          sm: '0.25rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
        },
        shadows: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
        cardsPerRow: 3,
        layoutStyle: 'cards',
      },
      enabledSections: {},
      customFields: [],
      metrics: [],
      filters: [],
      actions: [],
      dataConnections: {
        primarySource: 'default',
        refreshInterval: 5,
        cacheEnabled: true,
      },
      permissions: {
        viewPermissions: ['all'],
        editPermissions: ['admin'],
        adminOnly: false,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  return {
    pageCustomizations,
    getPageCustomization,
    updatePageCustomization,
    addCustomField,
    updateCustomField,
    removeCustomField,
    addMetric,
    updateMetric,
    removeMetric,
    addFilter,
    updateFilter,
    removeFilter,
    addAction,
    applyPageCustomization,
    resetPageToDefault,
    exportPageConfig,
    importPageConfig,
    getCustomizablePages,
  };
};