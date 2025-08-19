import React, { useState, useMemo } from 'react';
import { Employee } from '../types/employee';
import { Division, User } from '../types/division';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatCurrency } from '../utils/scoring';
import { 
  DollarSign, TrendingUp, TrendingDown, Target, BarChart3, Plus, Upload, Download, 
  Calendar, MapPin, Building2, Filter, Eye, Settings, FileText,
  Users, Clock, Award, Activity, CheckCircle, AlertCircle, Zap,
  PieChart, Grid, List, RefreshCw, Save, X, Edit, Brain, Lightbulb
} from 'lucide-react';

interface ExpenseLineItem {
  id: string;
  category: string;
  subcategory?: string;
  name: string;
  amount: number;
  location: string;
  month: string;
  year: number;
  enteredBy: string;
  enteredAt: Date;
  notes?: string;
}

interface RevenueLineItem {
  id: string;
  type: 'service' | 'retail' | 'other';
  name: string;
  amount: number;
  location: string;
  month: string;
  year: number;
  enteredBy: string;
  enteredAt: Date;
  notes?: string;
}

interface MonthlyProjection {
  month: string;
  year: number;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
  projectedMargin: number;
  seasonalMultiplier: number;
  confidence: number;
}

interface AIInsight {
  period: 'next-month' | 'next-quarter' | 'annual';
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
  confidence: number;
  keyFactors: string[];
  recommendations: string[];
  risks: Array<{ level: 'high' | 'medium' | 'low'; description: string }>;
}

// Wellness Location Expense Categories
const WELLNESS_EXPENSE_CATEGORIES = {
  'costs-to-provide-service': {
    name: 'Costs to Provide Service',
    items: [
      'EMR',
      'Back Bar/Pro Use/Retail Cost (2024)',
      'BHRT Testing',
      'Merchant Fees',
      'Phone / RingCentral'
    ]
  },
  'payroll-wages-service': {
    name: 'Payroll & Wages to Provide Service',
    items: [
      'Hormone Specialist',
      'IV Therapy',
      'Nutrition',
      'New Patient Team',
      'Prescribers',
      'Medical Director',
      'Admin (Retention/Client Care/PCC)'
    ]
  },
  'payroll-costs': {
    name: 'Payroll Costs',
    items: [
      'Management + Head Office',
      'Estimated Payroll Tax',
      'Employee Benefits',
      'Travel & Lodging/Training',
      'Staff Appreciation'
    ]
  },
  'general-administrative': {
    name: 'General & Administrative Costs',
    items: [
      'Professional Fees',
      'Bank Fees',
      'Marketing/Advertising',
      'Head Office',
      'Insurance',
      'Equipment Maintenance / Repairs',
      'IT Support',
      'Electronic Purchases',
      'Shipping / Freight',
      'Meals & Entertainment',
      'Office Supplies',
      'Software Subscriptions'
    ]
  },
  'facilities-costs': {
    name: 'Facilities Costs',
    items: [
      'Rent',
      'Building Maintenance / Repairs',
      'Utilities'
    ]
  }
};

// Other Locations Expense Categories
const OTHER_LOCATIONS_EXPENSE_CATEGORIES = {
  'costs-to-provide-service': {
    name: 'Costs to Provide Service',
    items: [
      'Lease Payments',
      'Zenoti',
      'Back Bar/Pro Use',
      'Retail Cost',
      'Consumables/Injectables',
      'Merchant Fees'
    ]
  },
  'payroll-wages-service': {
    name: 'Payroll & Wages to Provide Service',
    items: [
      'Nurse Injector',
      'Laser / Esthetician',
      'Massage',
      'Medical Director'
    ]
  },
  'payroll-costs': {
    name: 'Payroll Costs',
    items: [
      'Guest Care',
      'Management + Head Office',
      'Estimated Payroll Tax',
      'Employee Benefits',
      'Staff Appreciation',
      'Travel & Lodging/Training'
    ]
  },
  'general-administrative': {
    name: 'General & Administrative Costs',
    items: [
      'Marketing/Advertising',
      'Head Office',
      'Professional Fees',
      'Bank Fees',
      'Insurance',
      'Equipment Maintenance / Repairs',
      'IT Support',
      'Electronic Purchases',
      'Shipping / Freight',
      'Meals & Entertainment',
      'Office Supplies',
      'Software Subscriptions',
      'Phone / RingCentral'
    ]
  },
  'facilities-costs': {
    name: 'Facilities Costs',
    items: [
      'Rent',
      'Building Maintenance / Repairs',
      'Utilities'
    ]
  }
};

const REVENUE_CATEGORIES = {
  'service-sales': {
    name: 'Service Sales',
    items: ['Service Sales']
  },
  'retail-sales': {
    name: 'Retail Sales',
    items: ['Retail Sales']
  },
  'other-income': {
    name: 'Other Income',
    items: ['Other Income (Rent)']
  }
};

const LOCATIONS = ['Wellness', 'St. Albert', 'Spruce Grove', 'Sherwood Park'];

interface FinancialsDashboardProps {
  divisions: Division[];
  employees: Employee[];
  currentUser: User;
}

const FinancialsDashboard: React.FC<FinancialsDashboardProps> = ({
  divisions,
  employees,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'manual-data-entry' | 'revenue-projections' | 'profit-analysis'>('overview');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Financial data storage
  const [expenseLineItems, setExpenseLineItems] = useLocalStorage<ExpenseLineItem[]>('expenseLineItems', []);
  const [revenueLineItems, setRevenueLineItems] = useLocalStorage<RevenueLineItem[]>('revenueLineItems', []);
  const [monthlyProjections, setMonthlyProjections] = useLocalStorage<MonthlyProjection[]>('monthlyProjections', []);

  // Manual entry form states
  const [showExpenseForm, setShowExpenseForm] = useState<boolean>(false);
  const [showRevenueForm, setShowRevenueForm] = useState<boolean>(false);
  const [showAIInsights, setShowAIInsights] = useState<boolean>(false);
  const [expenseForm, setExpenseForm] = useState<Partial<ExpenseLineItem>>({
    location: 'Wellness',
    month: selectedMonth,
    year: selectedYear,
    amount: 0,
  });
  const [revenueForm, setRevenueForm] = useState<Partial<RevenueLineItem>>({
    type: 'service',
    location: 'St. Albert',
    month: selectedMonth,
    year: selectedYear,
    amount: 0,
  });

  // Calculate business KPIs
  const businessKPIs = useMemo(() => {
    const currentExpenses = expenseLineItems.filter(item => 
      item.month === selectedMonth && 
      item.year === selectedYear &&
      (selectedLocation === 'all' || item.location === selectedLocation)
    );

    const currentRevenue = revenueLineItems.filter(item => 
      item.month === selectedMonth && 
      item.year === selectedYear &&
      (selectedLocation === 'all' || item.location === selectedLocation)
    );

    const totalExpenses = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalRevenue = currentRevenue.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate by location
    const locationBreakdown = LOCATIONS.map(location => {
      const locationExpenses = currentExpenses.filter(item => item.location === location);
      const locationRevenue = currentRevenue.filter(item => item.location === location);
      
      const expenses = locationExpenses.reduce((sum, item) => sum + item.amount, 0);
      const revenue = locationRevenue.reduce((sum, item) => sum + item.amount, 0);
      const profit = revenue - expenses;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        location,
        revenue,
        expenses,
        profit,
        margin,
        expenseCount: locationExpenses.length,
        revenueCount: locationRevenue.length,
      };
    });

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      netProfitMargin,
      locationBreakdown,
      totalDataPoints: currentExpenses.length + currentRevenue.length,
    };
  }, [expenseLineItems, revenueLineItems, selectedMonth, selectedYear, selectedLocation]);

  // Generate AI insights
  const generateAIInsights = (): AIInsight[] => {
    const currentRevenue = businessKPIs.totalRevenue;
    const currentExpenses = businessKPIs.totalExpenses;
    
    return [
      {
        period: 'next-month',
        projectedRevenue: currentRevenue * 1.08, // 8% growth
        projectedExpenses: currentExpenses * 1.03, // 3% increase
        projectedProfit: (currentRevenue * 1.08) - (currentExpenses * 1.03),
        confidence: 85,
        keyFactors: [
          'Seasonal uptick in laser treatments',
          'New injectable service launch',
          'Marketing campaign impact',
          'Staff productivity improvements'
        ],
        recommendations: [
          'Increase retail inventory for expected demand',
          'Schedule additional staff for peak periods',
          'Monitor new service adoption rates',
          'Optimize booking schedules for efficiency'
        ],
        risks: [
          { level: 'medium', description: 'Staff scheduling conflicts during peak periods' },
          { level: 'low', description: 'Supply chain delays for new products' }
        ]
      },
      {
        period: 'next-quarter',
        projectedRevenue: currentRevenue * 3.15, // 5% quarterly growth
        projectedExpenses: currentExpenses * 3.09, // 3% quarterly increase
        projectedProfit: (currentRevenue * 3.15) - (currentExpenses * 3.09),
        confidence: 78,
        keyFactors: [
          'Spring season demand increase',
          'Wedding season preparation treatments',
          'Q2 marketing initiatives',
          'Staff training completion impact'
        ],
        recommendations: [
          'Launch spring promotion campaigns',
          'Expand weekend availability',
          'Cross-train staff for flexibility',
          'Implement customer retention programs'
        ],
        risks: [
          { level: 'medium', description: 'Economic uncertainty affecting discretionary spending' },
          { level: 'medium', description: 'Competition from new market entrants' },
          { level: 'low', description: 'Regulatory changes in aesthetic industry' }
        ]
      },
      {
        period: 'annual',
        projectedRevenue: currentRevenue * 12.6, // 5% annual growth
        projectedExpenses: currentExpenses * 12.36, // 3% annual increase
        projectedProfit: (currentRevenue * 12.6) - (currentExpenses * 12.36),
        confidence: 72,
        keyFactors: [
          'Market expansion opportunities',
          'New service line development',
          'Technology infrastructure improvements',
          'Brand recognition growth'
        ],
        recommendations: [
          'Consider second location expansion',
          'Invest in advanced equipment upgrades',
          'Develop comprehensive staff retention program',
          'Implement customer loyalty rewards system'
        ],
        risks: [
          { level: 'high', description: 'Economic recession impact on luxury services' },
          { level: 'medium', description: 'Healthcare regulation changes' },
          { level: 'medium', description: 'Key staff retention challenges' },
          { level: 'low', description: 'Technology disruption in aesthetic industry' }
        ]
      }
    ];
  };

  // Handle expense form submission
  const handleSaveExpense = () => {
    if (!expenseForm.category || !expenseForm.name || !expenseForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const newExpense: ExpenseLineItem = {
      id: `expense-${Date.now()}`,
      category: expenseForm.category!,
      subcategory: expenseForm.subcategory,
      name: expenseForm.name!,
      amount: expenseForm.amount!,
      location: expenseForm.location!,
      month: expenseForm.month!,
      year: expenseForm.year!,
      enteredBy: currentUser.id,
      enteredAt: new Date(),
      notes: expenseForm.notes,
    };

    setExpenseLineItems(prev => [...prev, newExpense]);
    setShowExpenseForm(false);
    setExpenseForm({
      location: 'Wellness',
      month: selectedMonth,
      year: selectedYear,
      amount: 0,
    });
  };

  // Handle revenue form submission
  const handleSaveRevenue = () => {
    if (!revenueForm.type || !revenueForm.name || !revenueForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const newRevenue: RevenueLineItem = {
      id: `revenue-${Date.now()}`,
      type: revenueForm.type!,
      name: revenueForm.name!,
      amount: revenueForm.amount!,
      location: revenueForm.location!,
      month: revenueForm.month!,
      year: revenueForm.year!,
      enteredBy: currentUser.id,
      enteredAt: new Date(),
      notes: revenueForm.notes,
    };

    setRevenueLineItems(prev => [...prev, newRevenue]);
    setShowRevenueForm(false);
    setRevenueForm({
      type: 'service',
      location: 'St. Albert',
      month: selectedMonth,
      year: selectedYear,
      amount: 0,
    });
  };

  // Generate yearly projections
  const generateYearlyProjections = () => {
    const projections: MonthlyProjection[] = [];
    const baseRevenue = businessKPIs.totalRevenue || 400000;
    const baseExpenses = businessKPIs.totalExpenses || 300000;
    
    // Seasonal multipliers for each month
    const seasonalMultipliers = [
      0.85, 0.90, 1.05, 1.10, 1.15, 1.20, // Jan-Jun
      1.25, 1.20, 1.10, 1.05, 0.95, 0.90  // Jul-Dec
    ];

    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const seasonalMultiplier = seasonalMultipliers[month - 1];
      const projectedRevenue = baseRevenue * seasonalMultiplier;
      const projectedExpenses = baseExpenses * 1.02; // 2% monthly expense growth
      const projectedProfit = projectedRevenue - projectedExpenses;
      const projectedMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;

      projections.push({
        month: monthStr,
        year: selectedYear,
        projectedRevenue,
        projectedExpenses,
        projectedProfit,
        projectedMargin,
        seasonalMultiplier,
        confidence: month <= parseInt(selectedMonth) + 3 ? 85 : 70, // Higher confidence for near-term
      });
    }

    return projections;
  };

  const yearlyProjections = generateYearlyProjections();
  const aiInsights = generateAIInsights();

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Business KPIs */}
      <div className="bg-gradient-to-r from-[#f4647d] to-[#fd8585] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Business KPIs</h1>
              <p className="text-white/80 text-lg">Financial performance and profitability tracking</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowExpenseForm(true)}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white hover:bg-white/30 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </button>
            <button 
              onClick={() => setShowRevenueForm(true)}
              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white hover:bg-white/30 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Revenue
            </button>
          </div>
        </div>

        {/* Business KPI Cards in Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Revenue</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(businessKPIs.totalRevenue)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">
              Monthly Target: {formatCurrency(500000)}
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Expenses</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(businessKPIs.totalExpenses)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">
              {businessKPIs.totalDataPoints} line items
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Net Profit</h3>
                <div className={`text-3xl font-bold mb-1 ${
                  businessKPIs.netProfit >= 0 ? 'text-white' : 'text-red-200'
                }`}>
                  {formatCurrency(businessKPIs.netProfit)}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">
              Margin: {businessKPIs.netProfitMargin.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Locations</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {businessKPIs.locationBreakdown.filter(loc => loc.revenue > 0 || loc.expenses > 0).length}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">
              Active locations
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Financial Overview', icon: BarChart3, description: 'High-level financial metrics and insights' },
              { id: 'manual-data-entry', label: 'Manual Data Entry', icon: Plus, description: 'Enter expenses and revenue by line item' },
              { id: 'revenue-projections', label: 'Revenue Projections', icon: TrendingUp, description: 'Full year revenue and expense projections' },
              { id: 'profit-analysis', label: 'Profit Analysis', icon: Target, description: 'Profitability analysis with AI insights' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#f4647d] text-[#f4647d]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-500 font-normal">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] bg-white"
              >
                <option value="all">All Locations</option>
                {LOCATIONS.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                    {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4647d] bg-white"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Location Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessKPIs.locationBreakdown.map(location => (
              <div 
                key={location.location}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{location.location}</h4>
                    <p className="text-sm text-gray-600">{location.expenseCount + location.revenueCount} entries</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Revenue:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(location.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expenses:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(location.expenses)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="text-sm font-medium text-gray-900">Net Profit:</span>
                    <span className={`font-bold ${location.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(location.profit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Margin:</span>
                    <span className={`font-semibold ${location.margin >= 15 ? 'text-green-600' : location.margin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {location.margin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Activity className="h-3 w-3 mr-1" />
                      <span>{location.expenseCount} expenses</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>{location.revenueCount} revenue</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Data Entry Tab */}
      {activeTab === 'manual-data-entry' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Manual Data Entry</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </button>
                <button
                  onClick={() => setShowRevenueForm(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Revenue
                </button>
              </div>
            </div>

            {/* Recent Entries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Expenses */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="text-lg font-semibold text-red-900 mb-4">Recent Expenses</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {expenseLineItems
                    .filter(item => item.month === selectedMonth && item.year === selectedYear)
                    .slice(-10)
                    .map(item => (
                      <div key={item.id} className="bg-white rounded p-3 border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-600">{item.location} • {item.category}</div>
                          </div>
                          <div className="text-sm font-bold text-red-600">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  {expenseLineItems.filter(item => item.month === selectedMonth && item.year === selectedYear).length === 0 && (
                    <p className="text-red-700 text-center py-4">No expenses entered for this month</p>
                  )}
                </div>
              </div>

              {/* Recent Revenue */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-lg font-semibold text-green-900 mb-4">Recent Revenue</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {revenueLineItems
                    .filter(item => item.month === selectedMonth && item.year === selectedYear)
                    .slice(-10)
                    .map(item => (
                      <div key={item.id} className="bg-white rounded p-3 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-600">{item.location} • {item.type}</div>
                          </div>
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  {revenueLineItems.filter(item => item.month === selectedMonth && item.year === selectedYear).length === 0 && (
                    <p className="text-green-700 text-center py-4">No revenue entered for this month</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Projections Tab */}
      {activeTab === 'revenue-projections' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Full Year Revenue Projections</h3>
              <div className="text-sm text-gray-600">
                Annual Projected Revenue: {formatCurrency(yearlyProjections.reduce((sum, p) => sum + p.projectedRevenue, 0))}
              </div>
            </div>

            {/* Monthly Projection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {yearlyProjections.map(projection => {
                const monthName = new Date(projection.year, parseInt(projection.month) - 1).toLocaleDateString('en-US', { month: 'long' });
                const isCurrentMonth = projection.month === selectedMonth;
                const isPastMonth = parseInt(projection.month) < parseInt(selectedMonth);
                const isFutureMonth = parseInt(projection.month) > parseInt(selectedMonth);

                return (
                  <div 
                    key={projection.month}
                    className={`rounded-lg p-4 border-2 transition-all duration-200 hover:shadow-md ${
                      isCurrentMonth ? 'border-[#f4647d] bg-gradient-to-br from-pink-50 to-red-50' :
                      isPastMonth ? 'border-gray-300 bg-gray-50' :
                      'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{monthName}</h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isCurrentMonth ? 'bg-[#f4647d] text-white' :
                        isPastMonth ? 'bg-gray-400 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {isCurrentMonth ? 'Current' : isPastMonth ? 'Past' : 'Future'}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">{formatCurrency(projection.projectedRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expenses:</span>
                        <span className="font-medium">{formatCurrency(projection.projectedExpenses)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="font-medium text-gray-900">Profit:</span>
                        <span className={`font-bold ${projection.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(projection.projectedProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Margin:</span>
                        <span className={`font-medium ${
                          projection.projectedMargin >= 15 ? 'text-green-600' :
                          projection.projectedMargin >= 10 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {projection.projectedMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium">{projection.confidence}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Annual Summary */}
            <div className="mt-8 bg-gradient-to-r from-[#0c5b63] to-[#0f6b73] rounded-xl p-6 text-white">
              <h4 className="text-xl font-bold mb-4">Annual Projection Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(yearlyProjections.reduce((sum, p) => sum + p.projectedRevenue, 0))}</div>
                  <div className="text-sm text-white/80">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(yearlyProjections.reduce((sum, p) => sum + p.projectedExpenses, 0))}</div>
                  <div className="text-sm text-white/80">Total Expenses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatCurrency(yearlyProjections.reduce((sum, p) => sum + p.projectedProfit, 0))}</div>
                  <div className="text-sm text-white/80">Total Profit</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {(yearlyProjections.reduce((sum, p) => sum + p.projectedMargin, 0) / yearlyProjections.length).toFixed(1)}%
                  </div>
                  <div className="text-sm text-white/80">Avg Margin</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profit Analysis Tab */}
      {activeTab === 'profit-analysis' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Profit Analysis with AI Insights</h3>
              <button
                onClick={() => setShowAIInsights(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors"
              >
                <Brain className="h-4 w-4 mr-2" />
                View AI Insights
              </button>
            </div>

            {/* Current Month Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                  <h4 className="text-lg font-semibold text-green-900">Revenue Analysis</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">Current Month:</span>
                    <span className="font-bold">{formatCurrency(businessKPIs.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Target:</span>
                    <span className="font-medium">{formatCurrency(500000)}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-300 pt-2">
                    <span className="text-green-900 font-semibold">Performance:</span>
                    <span className={`font-bold ${
                      businessKPIs.totalRevenue >= 500000 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {((businessKPIs.totalRevenue / 500000) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="flex items-center mb-4">
                  <TrendingDown className="h-6 w-6 text-red-600 mr-3" />
                  <h4 className="text-lg font-semibold text-red-900">Expense Analysis</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-red-700">Current Month:</span>
                    <span className="font-bold">{formatCurrency(businessKPIs.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Budget:</span>
                    <span className="font-medium">{formatCurrency(350000)}</span>
                  </div>
                  <div className="flex justify-between border-t border-red-300 pt-2">
                    <span className="text-red-900 font-semibold">vs Budget:</span>
                    <span className={`font-bold ${
                      businessKPIs.totalExpenses <= 350000 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {((businessKPIs.totalExpenses / 350000) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center mb-4">
                  <Target className="h-6 w-6 text-purple-600 mr-3" />
                  <h4 className="text-lg font-semibold text-purple-900">Profitability</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Net Profit:</span>
                    <span className={`font-bold ${businessKPIs.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(businessKPIs.netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Margin:</span>
                    <span className={`font-bold ${
                      businessKPIs.netProfitMargin >= 15 ? 'text-green-600' :
                      businessKPIs.netProfitMargin >= 10 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {businessKPIs.netProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-purple-300 pt-2">
                    <span className="text-purple-900 font-semibold">Target Margin:</span>
                    <span className="font-medium">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Entry Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Expense Entry</h3>
              <button
                onClick={() => setShowExpenseForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <select
                    value={expenseForm.location}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, location: e.target.value, category: '', name: '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  >
                    {LOCATIONS.map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value, name: '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  >
                    <option value="">Select Category</option>
                    {Object.entries(expenseForm.location === 'Wellness' ? WELLNESS_EXPENSE_CATEGORIES : OTHER_LOCATIONS_EXPENSE_CATEGORIES).map(([key, category]) => (
                      <option key={key} value={key}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {expenseForm.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expense Item *</label>
                  <select
                    value={expenseForm.name}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  >
                    <option value="">Select Item</option>
                    {(expenseForm.location === 'Wellness' ? WELLNESS_EXPENSE_CATEGORIES : OTHER_LOCATIONS_EXPENSE_CATEGORIES)[expenseForm.category as keyof typeof WELLNESS_EXPENSE_CATEGORIES]?.items.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month/Year</label>
                  <div className="flex space-x-2">
                    <select
                      value={expenseForm.month}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, month: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={expenseForm.year}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    >
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={expenseForm.notes || ''}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExpenseForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveExpense}
                  className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Entry Modal */}
      {showRevenueForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Revenue Entry</h3>
              <button
                onClick={() => setShowRevenueForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <select
                    value={revenueForm.location}
                    onChange={(e) => setRevenueForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  >
                    {LOCATIONS.map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Type *</label>
                  <select
                    value={revenueForm.type}
                    onChange={(e) => setRevenueForm(prev => ({ ...prev, type: e.target.value as any, name: '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  >
                    {Object.entries(REVENUE_CATEGORIES).map(([key, category]) => (
                      <option key={key} value={key.replace('-sales', '').replace('-income', '')}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Item *</label>
                <select
                  value={revenueForm.name}
                  onChange={(e) => setRevenueForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                >
                  <option value="">Select Item</option>
                  {REVENUE_CATEGORIES[`${revenueForm.type}-sales` as keyof typeof REVENUE_CATEGORIES]?.items.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  )) || REVENUE_CATEGORIES['other-income']?.items.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={revenueForm.amount}
                    onChange={(e) => setRevenueForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month/Year</label>
                  <div className="flex space-x-2">
                    <select
                      value={revenueForm.month}
                      onChange={(e) => setRevenueForm(prev => ({ ...prev, month: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      value={revenueForm.year}
                      onChange={(e) => setRevenueForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                    >
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={revenueForm.notes || ''}
                  onChange={(e) => setRevenueForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f4647d]"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRevenueForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRevenue}
                  className="px-4 py-2 bg-[#f4647d] text-white rounded-md hover:bg-[#fd8585] flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Revenue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      {showAIInsights && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="text-2xl font-bold text-gray-900">AI-Powered Financial Insights</h3>
              </div>
              <button
                onClick={() => setShowAIInsights(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {aiInsights.map(insight => (
                <div key={insight.period} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-purple-900 capitalize">
                      {insight.period.replace('-', ' ')} Projection
                    </h4>
                    <div className="text-right">
                      <div className="text-sm text-purple-700">Confidence</div>
                      <div className="text-xl font-bold text-purple-900">{insight.confidence}%</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Revenue:</span>
                      <span className="font-bold text-green-600">{formatCurrency(insight.projectedRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Expenses:</span>
                      <span className="font-bold text-red-600">{formatCurrency(insight.projectedExpenses)}</span>
                    </div>
                    <div className="flex justify-between border-t border-purple-300 pt-2">
                      <span className="font-semibold text-purple-900">Profit:</span>
                      <span className={`font-bold ${insight.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(insight.projectedProfit)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-purple-900 mb-2">Key Factors</h5>
                    <ul className="text-xs text-purple-800 space-y-1">
                      {insight.keyFactors.map((factor, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-purple-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-purple-900 mb-2">Recommendations</h5>
                    <ul className="text-xs text-purple-800 space-y-1">
                      {insight.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <Lightbulb className="h-3 w-3 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-purple-900 mb-2">Risk Assessment</h5>
                    <div className="space-y-1">
                      {insight.risks.map((risk, index) => (
                        <div key={index} className={`text-xs p-2 rounded ${
                          risk.level === 'high' ? 'bg-red-100 text-red-800' :
                          risk.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          <span className="font-medium uppercase">{risk.level} RISK:</span> {risk.description}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Strategic Recommendations */}
            <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Strategic Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-lg font-semibold text-gray-900 mb-3">Revenue Optimization</h5>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Focus on high-margin services (injectables, laser treatments)
                    </li>
                    <li className="flex items-start">
                      <Target className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      Increase retail percentage from 25% to 30% across all locations
                    </li>
                    <li className="flex items-start">
                      <Users className="h-4 w-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                      Implement customer retention programs to increase repeat visits
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-lg font-semibold text-gray-900 mb-3">Cost Management</h5>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <DollarSign className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      Review payroll ratios - target 25% of revenue maximum
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                      Optimize inventory management to reduce carrying costs
                    </li>
                    <li className="flex items-start">
                      <Settings className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                      Negotiate better rates with suppliers and service providers
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialsDashboard;