// Single source of truth for sidebar navigation
// This is the ONLY place where menu items should be defined

export interface MenuItem {
  id: string;
  label: string;
  route: string;
  sortOrder: number;
  isVisible: boolean;
  isFolder: boolean;
  parentId?: string;
  children?: MenuItem[];
}

// MASTER MENU CONFIGURATION - Single Source of Truth
export const MASTER_MENU_ITEMS: MenuItem[] = [
  {
    id: 'manager-dashboard',
    label: 'Dashboard',
    route: 'manager-dashboard',
    sortOrder: 10,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'daily-data',
    label: 'Daily Data',
    route: 'daily-data',
    sortOrder: 20,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'monthly-checkin',
    label: 'Monthly Check-in',
    route: 'monthly-checkin',
    sortOrder: 30,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'separator-1',
    label: '---',
    route: 'separator-1',
    sortOrder: 40,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'scheduling-calendar',
    label: 'Scheduling Calendar',
    route: 'scheduling-calendar',
    sortOrder: 50,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'division-targets',
    label: 'Division Targets',
    route: 'division-targets',
    sortOrder: 55,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'payroll-percentage-2',
    label: 'Payroll %',
    route: 'payroll-percentage-2',
    sortOrder: 58,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'financials',
    label: 'Business KPIs',
    route: 'financials',
    sortOrder: 60,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'business-kpi-entry',
    label: 'Business KPI Entry',
    route: 'business-kpi-entry',
    sortOrder: 65,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'separator-2',
    label: '---',
    route: 'separator-2',
    sortOrder: 80,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'employees',
    label: 'Employee Data',
    route: 'employees',
    sortOrder: 90,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'data-import',
    label: 'Data Import',
    route: 'data-import',
    sortOrder: 100,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'separator-3',
    label: '---',
    route: 'separator-3',
    sortOrder: 110,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'custom-branding',
    label: 'Customizer',
    route: 'custom-branding',
    sortOrder: 120,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'settings',
    label: 'Settings',
    route: 'settings',
    sortOrder: 130,
    isVisible: true,
    isFolder: false,
  },
  {
    id: 'business-snapshot',
    label: 'Business Snapshot',
    route: 'business-snapshot',
    sortOrder: 135,
    isVisible: true,
    isFolder: false,
  },
];

// Validation functions
export const validateMenuItems = (items: MenuItem[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const ids = new Set<string>();
  const routes = new Set<string>();
  const sortOrders = new Set<number>();

  items.forEach((item, index) => {
    // Check for duplicate IDs
    if (ids.has(item.id)) {
      errors.push(`Duplicate ID found: ${item.id}`);
    }
    ids.add(item.id);

    // Check for duplicate routes
    if (routes.has(item.route)) {
      errors.push(`Duplicate route found: ${item.route}`);
    }
    routes.add(item.route);

    // Check for duplicate sort orders
    if (sortOrders.has(item.sortOrder)) {
      errors.push(`Duplicate sort order found: ${item.sortOrder}`);
    }
    sortOrders.add(item.sortOrder);

    // Validate required fields
    if (!item.id || !item.label || !item.route) {
      errors.push(`Item at index ${index} missing required fields`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Get menu items with runtime validation
export const getValidatedMenuItems = (): MenuItem[] => {
  const validation = validateMenuItems(MASTER_MENU_ITEMS);
  
  if (!validation.isValid) {
    console.error('Menu validation failed:', validation.errors);
    throw new Error(`Menu configuration invalid: ${validation.errors.join(', ')}`);
  }

  return MASTER_MENU_ITEMS
    .filter(item => item.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

// Add new menu item (for future use)
export const addMenuItem = (item: Omit<MenuItem, 'sortOrder'>): MenuItem[] => {
  const maxSortOrder = Math.max(...MASTER_MENU_ITEMS.map(item => item.sortOrder));
  const newItem: MenuItem = {
    ...item,
    sortOrder: maxSortOrder + 10,
  };

  const updatedItems = [...MASTER_MENU_ITEMS, newItem];
  const validation = validateMenuItems(updatedItems);
  
  if (!validation.isValid) {
    throw new Error(`Cannot add menu item: ${validation.errors.join(', ')}`);
  }

  return updatedItems;
};

// Remove menu item (for future use)
export const removeMenuItem = (itemId: string): MenuItem[] => {
  return MASTER_MENU_ITEMS.filter(item => item.id !== itemId);
};