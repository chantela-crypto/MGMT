export interface PageCustomization {
  id: string;
  pageId: string;
  pageName: string;
  title: string;
  subtitle?: string;
  description?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  layout: {
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
    };
    cardsPerRow: number;
    layoutStyle: 'cards' | 'compact' | 'detailed' | 'grid' | 'list';
  };
  enabledSections: Record<string, boolean>;
  customFields: CustomPageField[];
  metrics: PageMetricConfig[];
  filters: PageFilterConfig[];
  actions: PageActionConfig[];
  dataConnections: {
    primarySource: string;
    secondarySource?: string;
    refreshInterval: number;
    cacheEnabled: boolean;
  };
  permissions: {
    viewPermissions: string[];
    editPermissions: string[];
    adminOnly: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomPageField {
  id: string;
  name: string;
  key: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string;
  };
  options?: string[]; // For select fields
  displayOrder: number;
  isVisible: boolean;
  section: string; // Which section of the page this field belongs to
  calculation?: {
    formula: string;
    dependencies: string[];
    autoCalculate: boolean;
  };
  formatting?: {
    prefix?: string;
    suffix?: string;
    decimalPlaces?: number;
    thousandsSeparator?: boolean;
  };
}

export interface PageMetricConfig {
  id: string;
  name: string;
  key: string;
  description: string;
  dataSource: string;
  calculation: string;
  displayFormat: 'number' | 'currency' | 'percentage' | 'chart' | 'progress';
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  target?: number;
  thresholds?: {
    excellent: number;
    good: number;
    warning: number;
    poor: number;
  };
  colors?: {
    primary: string;
    secondary: string;
  };
  isVisible: boolean;
  displayOrder: number;
  size: 'small' | 'medium' | 'large' | 'full-width';
  refreshRate: 'real-time' | 'hourly' | 'daily' | 'manual';
}

export interface PageFilterConfig {
  id: string;
  name: string;
  key: string;
  type: 'select' | 'multiselect' | 'date-range' | 'search' | 'toggle';
  options?: Array<{ value: string; label: string; color?: string }>;
  defaultValue?: any;
  isVisible: boolean;
  displayOrder: number;
  section: 'header' | 'sidebar' | 'inline';
  dependencies?: string[]; // Other filters this depends on
}

export interface PageActionConfig {
  id: string;
  name: string;
  label: string;
  type: 'button' | 'dropdown' | 'modal' | 'link' | 'export';
  icon?: string;
  color: string;
  action: string; // Function name or route
  permissions: string[];
  isVisible: boolean;
  displayOrder: number;
  section: 'header' | 'toolbar' | 'context' | 'floating';
  confirmationRequired?: boolean;
  confirmationMessage?: string;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'dashboard' | 'performance' | 'financial' | 'management' | 'analytics';
  thumbnail?: string;
  config: Partial<PageCustomization>;
  isBuiltIn: boolean;
}

export interface GlobalCustomizationConfig {
  id: string;
  name: string;
  pageCustomizations: Record<string, PageCustomization>;
  globalColors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  };
  globalTypography: {
    fontFamily: string;
    headingFont: string;
  };
  globalLayout: {
    spacing: string;
    borderRadius: string;
    shadows: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}