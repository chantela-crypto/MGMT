export interface DivisionMetric {
  id: string;
  key: string;
  name: string;
  description: string;
  dataType: 'number' | 'currency' | 'percentage' | 'hours' | 'count';
  unit: string;
  isRequired: boolean;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  placeholder?: string;
  helpText?: string;
  category: 'hours' | 'revenue' | 'clients' | 'performance' | 'other';
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DivisionMetricConfig {
  id: string;
  divisionId: string;
  divisionName: string;
  metrics: DivisionMetric[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Default metrics that all divisions start with
export const DEFAULT_DIVISION_METRICS: Omit<DivisionMetric, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Hours & Time
  {
    key: 'hoursWorked',
    name: 'Hours Worked',
    description: 'Total hours worked by the employee',
    dataType: 'hours',
    unit: 'hours',
    isRequired: true,
    defaultValue: 0,
    minValue: 0,
    maxValue: 24,
    placeholder: '8.0',
    helpText: 'Enter actual hours worked (including breaks)',
    category: 'hours',
    sortOrder: 10,
    isActive: true,
  },
  {
    key: 'hoursBooked',
    name: 'Hours Booked',
    description: 'Hours booked with clients for services',
    dataType: 'hours',
    unit: 'hours',
    isRequired: true,
    defaultValue: 0,
    minValue: 0,
    maxValue: 24,
    placeholder: '7.5',
    helpText: 'Enter hours actually booked with clients',
    category: 'hours',
    sortOrder: 20,
    isActive: true,
  },
  
  // Revenue & Sales
  {
    key: 'serviceRevenue',
    name: 'Service Revenue',
    description: 'Revenue generated from services',
    dataType: 'currency',
    unit: '$',
    isRequired: true,
    defaultValue: 0,
    minValue: 0,
    placeholder: '1500.00',
    helpText: 'Enter total service revenue for the day',
    category: 'revenue',
    sortOrder: 30,
    isActive: true,
  },
  {
    key: 'retailSales',
    name: 'Retail Sales',
    description: 'Revenue from retail product sales',
    dataType: 'currency',
    unit: '$',
    isRequired: true,
    defaultValue: 0,
    minValue: 0,
    placeholder: '300.00',
    helpText: 'Enter total retail sales for the day',
    category: 'revenue',
    sortOrder: 40,
    isActive: true,
  },
  
  // Clients & Bookings
  {
    key: 'newClients',
    name: 'New Clients',
    description: 'Number of first-time clients served',
    dataType: 'count',
    unit: 'clients',
    isRequired: true,
    defaultValue: 0,
    minValue: 0,
    placeholder: '3',
    helpText: 'Count of new clients seen today',
    category: 'clients',
    sortOrder: 50,
    isActive: true,
  },
  {
    key: 'consults',
    name: 'Consultations',
    description: 'Number of consultations performed',
    dataType: 'count',
    unit: 'consults',
    isRequired: true,
    defaultValue: 0,
    minValue: 0,
    placeholder: '5',
    helpText: 'Total consultations completed',
    category: 'clients',
    sortOrder: 60,
    isActive: true,
  },
  {
    key: 'consultConverted',
    name: 'Consultations Converted',
    description: 'Consultations that resulted in bookings',
    dataType: 'count',
    unit: 'conversions',
    isRequired: true,
    defaultValue: 0,
    minValue: 0,
    placeholder: '4',
    helpText: 'Consultations that converted to treatments',
    category: 'clients',
    sortOrder: 70,
    isActive: true,
  },
  {
    key: 'totalClients',
    name: 'Total Clients',
    description: 'Total number of clients served',
    dataType: 'count',
    unit: 'clients',
    isRequired: true,
    defaultValue: 0,
    minValue: 0,
    placeholder: '8',
    helpText: 'Total clients seen (new + existing)',
    category: 'clients',
    sortOrder: 80,
    isActive: true,
  },
  {
    key: 'prebooks',
    name: 'Prebooks',
    description: 'Number of clients who prebooked next appointment',
    dataType: 'count',
    unit: 'prebooks',
    isRequired: true,
    defaultValue: 0,
    minValue: 0,
    placeholder: '6',
    helpText: 'Clients who booked their next appointment',
    category: 'clients',
    sortOrder: 90,
    isActive: true,
  },
];