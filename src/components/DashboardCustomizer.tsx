import React, { useState } from 'react';
import { DashboardConfig, PerformancePageConfig, ModuleConfig } from '../types/branding';
import { useDashboardConfig } from '../hooks/useDashboardConfig';
import { useKPIManagement } from '../hooks/useKPIManagement';
import { 
  Monitor, Settings, ToggleLeft, ToggleRight, Save, X, Plus, 
  Edit, Trash2, Eye, EyeOff, Target, BarChart3, Users, 
  TrendingUp, Award, Clock, RefreshCw, CheckCircle
} from 'lucide-react';

interface DashboardCustomizerProps {
  onClose?: () => void;
}

const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({ onClose }) => {
  const {
    dashboardConfig,
    performanceConfig,
    modules,
    updateDashboardConfig,
    updatePerformanceConfig,
    toggleModule,
    updateModuleSettings,
    addCustomField,
    removeCustomField,
    isModuleEnabled,
    applyDashboardConfig,
    applyPerformanceConfig,
  } = useDashboardConfig();

  const { kpiDefinitions, getDivisionKPIs } = useKPIManagement();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'performance' | 'modules'>('dashboard');
  const [showCustomFieldForm, setShowCustomFieldForm] = useState<boolean>(false);
  const [customFieldForm, setCustomFieldForm] = useState<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    required: boolean;
    options: string;
  }>({
    name: '',
    type: 'text',
    required: false,
    options: '',
  });

  const handleToggleModule = (moduleId: string, enabled: boolean) => {
    toggleModule(moduleId);
  };

  const handleAddCustomField = () => {
    if (customFieldForm.name) {
      const newField = {
        id: `custom-${Date.now()}`,
        name: customFieldForm.name,
        type: customFieldForm.type,
        required: customFieldForm.required,
        options: customFieldForm.type === 'select' 
          ? customFieldForm.options.split(',').map(opt => opt.trim()).filter(Boolean)
          : undefined,
      };
      
      addCustomField(newField);
      setShowCustomFieldForm(false);
      setCustomFieldForm({
        name: '',
        type: 'text',
        required: false,
        options: '',
      });
    }
  };

  const moduleCategories = [
    { key: 'dashboard', label: 'Dashboard Modules', icon: Monitor },
    { key: 'performance', label: 'Performance Modules', icon: BarChart3 },
    { key: 'analytics', label: 'Analytics Modules', icon: TrendingUp },
    { key: 'management', label: 'Management Modules', icon: Users },
    { key: 'reporting', label: 'Reporting Modules', icon: Award },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Monitor className="h-6 w-6 text-[var(--color-primary,#f4647d)] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Dashboard & Performance Customization</h2>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'dashboard'
                  ? 'border-[var(--color-primary,#f4647d)] text-[var(--color-primary,#f4647d)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Dashboard Configuration
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'performance'
                  ? 'border-[var(--color-primary,#f4647d)] text-[var(--color-primary,#f4647d)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Page
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'modules'
                  ? 'border-[var(--color-primary,#f4647d)] text-[var(--color-primary,#f4647d)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Modules & Features
            </button>
          </nav>
        </div>

        {/* Dashboard Configuration Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Dashboard Customization</h4>
              <p className="text-sm text-blue-800">
                Configure the main dashboard appearance, enabled modules, data connections, and KPI display.
                Changes will apply to the Manager Dashboard and affect all users.
              </p>
            </div>

            {/* Header KPI Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Header KPI Cards</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 1 - Primary Metric</label>
                    <select
                      value={dashboardConfig.headerKPIs?.card1 || 'totalRevenue'}
                      onChange={(e) => updateDashboardConfig({
                        headerKPIs: {
                          ...dashboardConfig.headerKPIs,
                          card1: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    >
                      <option value="totalRevenue">Total Revenue</option>
                      <option value="avgProductivity">Average Productivity</option>
                      <option value="newClients">New Clients</option>
                      <option value="salesPerHour">Sales Per Hour</option>
                      <option value="retailPercentage">Retail Percentage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 2 - Secondary Metric</label>
                    <select
                      value={dashboardConfig.headerKPIs?.card2 || 'avgProductivity'}
                      onChange={(e) => updateDashboardConfig({
                        headerKPIs: {
                          ...dashboardConfig.headerKPIs,
                          card2: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    >
                      <option value="totalRevenue">Total Revenue</option>
                      <option value="avgProductivity">Average Productivity</option>
                      <option value="newClients">New Clients</option>
                      <option value="salesPerHour">Sales Per Hour</option>
                      <option value="retailPercentage">Retail Percentage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 3 - Tertiary Metric</label>
                    <select
                      value={dashboardConfig.headerKPIs?.card3 || 'newClients'}
                      onChange={(e) => updateDashboardConfig({
                        headerKPIs: {
                          ...dashboardConfig.headerKPIs,
                          card3: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    >
                      <option value="totalRevenue">Total Revenue</option>
                      <option value="avgProductivity">Average Productivity</option>
                      <option value="newClients">New Clients</option>
                      <option value="salesPerHour">Sales Per Hour</option>
                      <option value="retailPercentage">Retail Percentage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card 4 - Fourth Metric</label>
                    <select
                      value={dashboardConfig.headerKPIs?.card4 || 'teamSize'}
                      onChange={(e) => updateDashboardConfig({
                        headerKPIs: {
                          ...dashboardConfig.headerKPIs,
                          card4: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    >
                      <option value="totalRevenue">Total Revenue</option>
                      <option value="avgProductivity">Average Productivity</option>
                      <option value="newClients">New Clients</option>
                      <option value="salesPerHour">Sales Per Hour</option>
                      <option value="retailPercentage">Retail Percentage</option>
                      <option value="teamSize">Team Size</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Goal Display Settings</h4>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Show Goals Below Metrics</span>
                      <p className="text-xs text-gray-600">Display target goals underneath each metric value</p>
                    </div>
                    <button
                      onClick={() => updateDashboardConfig({
                        showGoalsInHeader: !dashboardConfig.showGoalsInHeader
                      })}
                    >
                      {dashboardConfig.showGoalsInHeader ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Customization */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Layout</label>
                  <select
                    value={dashboardConfig.layoutStyle || 'cards'}
                    onChange={(e) => updateDashboardConfig({ layoutStyle: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  >
                    <option value="cards">Card Layout</option>
                    <option value="compact">Compact Layout</option>
                    <option value="detailed">Detailed Layout</option>
                    <option value="grid">Grid Layout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cards Per Row</label>
                  <select
                    value={dashboardConfig.cardsPerRow || 3}
                    onChange={(e) => updateDashboardConfig({ cardsPerRow: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  >
                    <option value={2}>2 Cards</option>
                    <option value={3}>3 Cards</option>
                    <option value={4}>4 Cards</option>
                    <option value={5}>5 Cards</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Basic Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Title</label>
                  <input
                    type="text"
                    value={dashboardConfig.title}
                    onChange={(e) => updateDashboardConfig({ title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="Executive Command Centre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={dashboardConfig.subtitle}
                    onChange={(e) => updateDashboardConfig({ subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="Real-time performance overview and key metrics"
                  />
                </div>
              </div>
            </div>

            {/* Module Toggles */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Modules</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(dashboardConfig.enabledModules).map(([moduleKey, isEnabled]) => (
                  <div key={moduleKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {moduleKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <p className="text-xs text-gray-600">
                        {moduleKey === 'revenueCards' && 'Revenue summary cards and metrics'}
                        {moduleKey === 'performanceCharts' && 'Performance visualization charts'}
                        {moduleKey === 'teamOverview' && 'Team member overview section'}
                        {moduleKey === 'divisionBreakdown' && 'Division-by-division analysis'}
                        {moduleKey === 'topPerformers' && 'Top performer rankings'}
                        {moduleKey === 'alerts' && 'Alert notifications and warnings'}
                        {moduleKey === 'quickActions' && 'Quick action buttons'}
                        {moduleKey === 'trendAnalysis' && 'Trend analysis and forecasting'}
                      </p>
                    </div>
                    <button
                      onClick={() => updateDashboardConfig({
                        enabledModules: {
                          ...dashboardConfig.enabledModules,
                          [moduleKey]: !isEnabled
                        }
                      })}
                      className="flex items-center"
                    >
                      {isEnabled ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Connections */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Connections</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">KPI Data Source</label>
                  <select
                    value={dashboardConfig.dataConnections.kpiDataSource}
                    onChange={(e) => updateDashboardConfig({
                      dataConnections: {
                        ...dashboardConfig.dataConnections,
                        kpiDataSource: e.target.value as any
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  >
                    <option value="daily-submissions">Daily Submissions</option>
                    <option value="manual-entry">Manual Entry</option>
                    <option value="api-sync">API Sync</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee Data Source</label>
                  <select
                    value={dashboardConfig.dataConnections.employeeDataSource}
                    onChange={(e) => updateDashboardConfig({
                      dataConnections: {
                        ...dashboardConfig.dataConnections,
                        employeeDataSource: e.target.value as any
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  >
                    <option value="internal">Internal System</option>
                    <option value="hr-system">HR System</option>
                    <option value="manual">Manual Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Financial Data Source</label>
                  <select
                    value={dashboardConfig.dataConnections.financialDataSource}
                    onChange={(e) => updateDashboardConfig({
                      dataConnections: {
                        ...dashboardConfig.dataConnections,
                        financialDataSource: e.target.value as any
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  >
                    <option value="accounting-system">Accounting System</option>
                    <option value="manual-import">Manual Import</option>
                    <option value="api">API Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Auto Refresh (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={dashboardConfig.dataConnections.autoRefreshInterval}
                    onChange={(e) => updateDashboardConfig({
                      dataConnections: {
                        ...dashboardConfig.dataConnections,
                        autoRefreshInterval: parseInt(e.target.value) || 5
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  />
                </div>
              </div>
            </div>

            {/* KPI Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard KPI Selection</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpiDefinitions.map(kpi => {
                  const isSelected = dashboardConfig.customKPIs.includes(kpi.id);
                  
                  return (
                    <div key={kpi.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{kpi.name}</div>
                        <div className="text-xs text-gray-600">{kpi.description}</div>
                        <div className="text-xs text-gray-500 capitalize">{kpi.category}</div>
                      </div>
                      <button
                        onClick={() => {
                          const newKPIs = isSelected
                            ? dashboardConfig.customKPIs.filter(id => id !== kpi.id)
                            : [...dashboardConfig.customKPIs, kpi.id];
                          updateDashboardConfig({ customKPIs: newKPIs });
                        }}
                        className="ml-3"
                      >
                        {isSelected ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Management</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Allow Employee Targets</span>
                    <p className="text-xs text-gray-600">Enable individual employee target setting</p>
                  </div>
                  <button
                    onClick={() => updateDashboardConfig({
                      targetManagement: {
                        ...dashboardConfig.targetManagement,
                        allowEmployeeTargets: !dashboardConfig.targetManagement.allowEmployeeTargets
                      }
                    })}
                  >
                    {dashboardConfig.targetManagement.allowEmployeeTargets ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Allow Division Targets</span>
                    <p className="text-xs text-gray-600">Enable division-level target setting</p>
                  </div>
                  <button
                    onClick={() => updateDashboardConfig({
                      targetManagement: {
                        ...dashboardConfig.targetManagement,
                        allowDivisionTargets: !dashboardConfig.targetManagement.allowDivisionTargets
                      }
                    })}
                  >
                    {dashboardConfig.targetManagement.allowDivisionTargets ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Auto-Calculate from History</span>
                    <p className="text-xs text-gray-600">Automatically suggest targets based on historical performance</p>
                  </div>
                  <button
                    onClick={() => updateDashboardConfig({
                      targetManagement: {
                        ...dashboardConfig.targetManagement,
                        autoCalculateFromHistory: !dashboardConfig.targetManagement.autoCalculateFromHistory
                      }
                    })}
                  >
                    {dashboardConfig.targetManagement.autoCalculateFromHistory ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Page Configuration Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">Performance Page Customization</h4>
              <p className="text-sm text-green-800">
                Configure performance tracking sections, review workflows, and custom fields.
                These settings control how performance data is displayed and managed.
              </p>
            </div>

            {/* Basic Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
                <input
                  type="text"
                  value={performanceConfig.title}
                  onChange={(e) => updatePerformanceConfig({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  placeholder="Performance Management"
                />
              </div>
            </div>

            {/* Section Toggles */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enabled Sections</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(performanceConfig.enabledSections).map(([sectionKey, isEnabled]) => (
                  <div key={sectionKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <p className="text-xs text-gray-600">
                        {sectionKey === 'individualMetrics' && 'Individual employee performance metrics'}
                        {sectionKey === 'teamComparison' && 'Team comparison and rankings'}
                        {sectionKey === 'goalTracking' && 'Goal setting and progress tracking'}
                        {sectionKey === 'performanceHistory' && 'Historical performance data'}
                        {sectionKey === 'coachingNotes' && 'Coaching notes and feedback'}
                        {sectionKey === 'actionPlans' && 'Performance improvement action plans'}
                        {sectionKey === 'certifications' && 'Training and certification tracking'}
                        {sectionKey === 'attendanceTracking' && 'Attendance and schedule tracking'}
                      </p>
                    </div>
                    <button
                      onClick={() => updatePerformanceConfig({
                        enabledSections: {
                          ...performanceConfig.enabledSections,
                          [sectionKey]: !isEnabled
                        }
                      })}
                    >
                      {isEnabled ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Review Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Review Workflow</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Enable Performance Reviews</span>
                    <p className="text-xs text-gray-600">Activate the performance review system</p>
                  </div>
                  <button
                    onClick={() => updatePerformanceConfig({
                      performanceReviewConfig: {
                        ...performanceConfig.performanceReviewConfig,
                        enabled: !performanceConfig.performanceReviewConfig.enabled
                      }
                    })}
                  >
                    {performanceConfig.performanceReviewConfig.enabled ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Review Frequency</label>
                    <select
                      value={performanceConfig.performanceReviewConfig.frequency}
                      onChange={(e) => updatePerformanceConfig({
                        performanceReviewConfig: {
                          ...performanceConfig.performanceReviewConfig,
                          frequency: e.target.value as any
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Auto-Generate Reviews</span>
                      <p className="text-xs text-gray-600">Automatically create review templates</p>
                    </div>
                    <button
                      onClick={() => updatePerformanceConfig({
                        performanceReviewConfig: {
                          ...performanceConfig.performanceReviewConfig,
                          autoGenerate: !performanceConfig.performanceReviewConfig.autoGenerate
                        }
                      })}
                    >
                      {performanceConfig.performanceReviewConfig.autoGenerate ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Fields */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Custom Performance Fields</h3>
                <button
                  onClick={() => setShowCustomFieldForm(true)}
                  className="flex items-center px-3 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </button>
              </div>
              
              <div className="space-y-3">
                {performanceConfig.customFields.map(field => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{field.name}</span>
                      <div className="text-xs text-gray-600">
                        Type: {field.type} • {field.required ? 'Required' : 'Optional'}
                      </div>
                    </div>
                    <button
                      onClick={() => removeCustomField(field.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-900 mb-2">Module Management</h4>
              <p className="text-sm text-purple-800">
                Enable or disable system modules and features. Disabled modules will be hidden from all users.
                Some modules have dependencies and cannot be disabled if other modules depend on them.
              </p>
            </div>

            {/* Module Categories */}
            {moduleCategories.map(category => {
              const categoryModules = modules.filter(module => module.category === category.key);
              
              return (
                <div key={category.key} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <category.icon className="h-5 w-5 text-[var(--color-primary,#f4647d)] mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">{category.label}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryModules.map(module => (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{module.name}</h4>
                            <p className="text-xs text-gray-600">{module.description}</p>
                          </div>
                          <button
                            onClick={() => handleToggleModule(module.id, !module.isEnabled)}
                            disabled={module.dependencies.length > 0 && !module.isEnabled}
                          >
                            {module.isEnabled ? (
                              <ToggleRight className="h-6 w-6 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        {module.dependencies.length > 0 && (
                          <div className="text-xs text-gray-500 mb-2">
                            Dependencies: {module.dependencies.join(', ')}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Permissions: {module.permissions.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Field Form Modal */}
        {showCustomFieldForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
            <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Add Custom Field</h3>
                <button
                  onClick={() => setShowCustomFieldForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field Name</label>
                  <input
                    type="text"
                    value={customFieldForm.name}
                    onChange={(e) => setCustomFieldForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="Enter field name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
                  <select
                    value={customFieldForm.type}
                    onChange={(e) => setCustomFieldForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Select Dropdown</option>
                    <option value="textarea">Text Area</option>
                  </select>
                </div>

                {customFieldForm.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options (comma-separated)</label>
                    <input
                      type="text"
                      value={customFieldForm.options}
                      onChange={(e) => setCustomFieldForm(prev => ({ ...prev, options: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={customFieldForm.required}
                    onChange={(e) => setCustomFieldForm(prev => ({ ...prev, required: e.target.checked }))}
                    className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Required field</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCustomFieldForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomField}
                  disabled={!customFieldForm.name}
                  className="px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Changes are automatically saved and applied across the system
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                // Force immediate application of all dashboard changes
                applyDashboardConfig();
                applyPerformanceConfig();
                
                // Force immediate localStorage saves
                try {
                  localStorage.setItem('dashboardConfig', JSON.stringify(dashboardConfig));
                  localStorage.setItem('performanceConfig', JSON.stringify(performanceConfig));
                } catch (error) {
                  console.error('Error saving dashboard config:', error);
                }
                
                // Dispatch comprehensive update events
                window.dispatchEvent(new CustomEvent('dashboardConfigurationUpdated', {
                  detail: { 
                    dashboardConfig, 
                    performanceConfig,
                    timestamp: new Date().toISOString()
                  }
                }));
                
                window.dispatchEvent(new StorageEvent('storage', {
                  key: 'dashboardConfig',
                  newValue: JSON.stringify(dashboardConfig),
                  storageArea: localStorage
                }));
                
                alert('Dashboard configuration applied successfully!');
              }}
              className="flex items-center px-6 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 transition-opacity"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Changes
            </button>
            
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Auto-saved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizer;