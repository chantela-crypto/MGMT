import React, { useState } from 'react';
import { Division } from '../types/division';
import { DivisionMetric, DivisionMetricConfig, DEFAULT_DIVISION_METRICS } from '../types/divisionMetrics';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  BarChart3, Plus, Edit, Save, X, Trash2, Copy, 
  Settings, Target, Clock, DollarSign, Users, Activity,
  ChevronDown, ChevronRight, Eye, EyeOff, ArrowUp, ArrowDown
} from 'lucide-react';

interface DivisionMetricsManagerProps {
  divisions: Division[];
  onClose?: () => void;
}

const DivisionMetricsManager: React.FC<DivisionMetricsManagerProps> = ({
  divisions,
  onClose,
}) => {
  const [divisionMetricConfigs, setDivisionMetricConfigs] = useLocalStorage<DivisionMetricConfig[]>('divisionMetricConfigs', []);
  const [selectedDivision, setSelectedDivision] = useState<string>(divisions[0]?.id || '');
  const [showMetricForm, setShowMetricForm] = useState<boolean>(false);
  const [editingMetric, setEditingMetric] = useState<DivisionMetric | null>(null);
  const [metricForm, setMetricForm] = useState<Partial<DivisionMetric>>({
    dataType: 'number',
    category: 'performance',
    isRequired: false,
    isActive: true,
    sortOrder: 100,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    hours: true,
    revenue: true,
    clients: true,
    performance: true,
    other: true,
  });

  // Get or create division metric config
  const getDivisionConfig = (divisionId: string): DivisionMetricConfig => {
    const existing = divisionMetricConfigs.find(config => config.divisionId === divisionId);
    if (existing) return existing;

    // Create default config with default metrics
    const division = divisions.find(d => d.id === divisionId);
    const defaultConfig: DivisionMetricConfig = {
      id: `config-${divisionId}`,
      divisionId,
      divisionName: division?.name || 'Unknown',
      metrics: DEFAULT_DIVISION_METRICS.map(metric => ({
        ...metric,
        id: `${divisionId}-${metric.key}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setDivisionMetricConfigs(prev => [...prev, defaultConfig]);
    return defaultConfig;
  };

  const selectedDivisionConfig = getDivisionConfig(selectedDivision);
  const selectedDivisionData = divisions.find(d => d.id === selectedDivision);

  // Group metrics by category
  const metricsByCategory = selectedDivisionConfig.metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, DivisionMetric[]>);

  // Sort metrics within each category
  Object.keys(metricsByCategory).forEach(category => {
    metricsByCategory[category].sort((a, b) => a.sortOrder - b.sortOrder);
  });

  const categories = [
    { key: 'hours', label: 'Hours & Time', icon: Clock, color: 'blue' },
    { key: 'revenue', label: 'Revenue & Sales', icon: DollarSign, color: 'green' },
    { key: 'clients', label: 'Clients & Bookings', icon: Users, color: 'purple' },
    { key: 'performance', label: 'Performance Metrics', icon: Target, color: 'orange' },
    { key: 'other', label: 'Other Metrics', icon: Activity, color: 'gray' },
  ];

  const dataTypes = [
    { value: 'number', label: 'Number', example: '5, 10, 25' },
    { value: 'currency', label: 'Currency ($)', example: '$1,500.00' },
    { value: 'percentage', label: 'Percentage (%)', example: '85.5%' },
    { value: 'hours', label: 'Hours', example: '8.5 hours' },
    { value: 'count', label: 'Count/Quantity', example: '3 clients' },
  ];

  const handleSaveMetric = () => {
    if (!metricForm.name || !metricForm.key) {
      alert('Please provide metric name and key');
      return;
    }

    const newMetric: DivisionMetric = {
      id: editingMetric?.id || `${selectedDivision}-${metricForm.key}-${Date.now()}`,
      key: metricForm.key!,
      name: metricForm.name!,
      description: metricForm.description || '',
      dataType: metricForm.dataType!,
      unit: metricForm.unit || '',
      isRequired: metricForm.isRequired || false,
      defaultValue: metricForm.defaultValue,
      minValue: metricForm.minValue,
      maxValue: metricForm.maxValue,
      placeholder: metricForm.placeholder,
      helpText: metricForm.helpText,
      category: metricForm.category!,
      sortOrder: metricForm.sortOrder || 100,
      isActive: metricForm.isActive !== false,
      createdAt: editingMetric?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    setDivisionMetricConfigs(prev => prev.map(config => {
      if (config.divisionId === selectedDivision) {
        const updatedMetrics = editingMetric
          ? config.metrics.map(metric => metric.id === editingMetric.id ? newMetric : metric)
          : [...config.metrics, newMetric];

        return {
          ...config,
          metrics: updatedMetrics,
          updatedAt: new Date(),
        };
      }
      return config;
    }));

    setShowMetricForm(false);
    setEditingMetric(null);
    setMetricForm({
      dataType: 'number',
      category: 'performance',
      isRequired: false,
      isActive: true,
      sortOrder: 100,
    });
  };

  const handleEditMetric = (metric: DivisionMetric) => {
    setEditingMetric(metric);
    setMetricForm(metric);
    setShowMetricForm(true);
  };

  const handleDeleteMetric = (metricId: string) => {
    if (window.confirm('Are you sure you want to delete this metric? This will remove it from daily data entry forms.')) {
      setDivisionMetricConfigs(prev => prev.map(config => {
        if (config.divisionId === selectedDivision) {
          return {
            ...config,
            metrics: config.metrics.filter(metric => metric.id !== metricId),
            updatedAt: new Date(),
          };
        }
        return config;
      }));
    }
  };

  const handleDuplicateMetric = (metric: DivisionMetric) => {
    const duplicated = {
      ...metric,
      id: `${selectedDivision}-${metric.key}-copy-${Date.now()}`,
      key: `${metric.key}Copy`,
      name: `${metric.name} (Copy)`,
      sortOrder: metric.sortOrder + 1,
    };
    
    setMetricForm(duplicated);
    setEditingMetric(null);
    setShowMetricForm(true);
  };

  const handleToggleMetric = (metricId: string) => {
    setDivisionMetricConfigs(prev => prev.map(config => {
      if (config.divisionId === selectedDivision) {
        return {
          ...config,
          metrics: config.metrics.map(metric => 
            metric.id === metricId 
              ? { ...metric, isActive: !metric.isActive, updatedAt: new Date() }
              : metric
          ),
          updatedAt: new Date(),
        };
      }
      return config;
    }));
  };

  const handleMoveMetric = (metricId: string, direction: 'up' | 'down') => {
    setDivisionMetricConfigs(prev => prev.map(config => {
      if (config.divisionId === selectedDivision) {
        const metrics = [...config.metrics];
        const index = metrics.findIndex(m => m.id === metricId);
        
        if (index === -1) return config;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= metrics.length) return config;
        
        // Swap sort orders
        const temp = metrics[index].sortOrder;
        metrics[index].sortOrder = metrics[newIndex].sortOrder;
        metrics[newIndex].sortOrder = temp;
        
        return {
          ...config,
          metrics,
          updatedAt: new Date(),
        };
      }
      return config;
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryIcon = (categoryKey: string) => {
    const category = categories.find(c => c.key === categoryKey);
    return category?.icon || Activity;
  };

  const getCategoryColor = (categoryKey: string) => {
    const category = categories.find(c => c.key === categoryKey);
    return category?.color || 'gray';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-[var(--color-primary,#f4647d)] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Division Metrics Manager</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMetricForm(true)}
              className="flex items-center px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Division Metrics Configuration</h4>
          <p className="text-sm text-blue-800">
            Configure which metrics each division tracks in their daily data entry forms. 
            These metrics will appear as input fields when staff submit their daily performance data.
          </p>
        </div>

        {/* Division Selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Division</label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
          >
            {divisions.map(division => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </select>
        </div>

        {/* Division Metrics Configuration */}
        {selectedDivisionData && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3"
                  style={{ backgroundColor: selectedDivisionData.color }}
                >
                  {selectedDivisionData.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedDivisionData.name}</h3>
                  <p className="text-gray-600">{selectedDivisionConfig.metrics.filter(m => m.isActive).length} active metrics</p>
                </div>
              </div>
            </div>

            {/* Metrics by Category */}
            <div className="space-y-4">
              {categories.map(category => {
                const categoryMetrics = metricsByCategory[category.key] || [];
                const isExpanded = expandedCategories[category.key];
                const Icon = category.icon;
                
                if (categoryMetrics.length === 0) return null;
                
                return (
                  <div key={category.key} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleCategory(category.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-[var(--color-primary,#f4647d)]" />
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{category.label}</h4>
                            <p className="text-sm text-gray-600">{categoryMetrics.length} metrics</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryMetrics.map(metric => (
                            <div key={metric.id} className="bg-gray-50 rounded-lg p-4 border">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{metric.name}</h5>
                                  <p className="text-sm text-gray-600">{metric.description}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs text-gray-500">Key: {metric.key}</span>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-xs text-gray-500 capitalize">{metric.dataType}</span>
                                    {metric.isRequired && (
                                      <>
                                        <span className="text-xs text-gray-500">•</span>
                                        <span className="text-xs text-red-600">Required</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-3">
                                  <button
                                    onClick={() => handleMoveMetric(metric.id, 'up')}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Move up"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveMetric(metric.id, 'down')}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Move down"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleMetric(metric.id)}
                                    className={`p-1 ${metric.isActive ? 'text-green-600' : 'text-gray-400'}`}
                                    title={metric.isActive ? 'Hide metric' : 'Show metric'}
                                  >
                                    {metric.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateMetric(metric)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Duplicate metric"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditMetric(metric)}
                                    className="p-1 text-gray-400 hover:text-[var(--color-primary,#f4647d)]"
                                    title="Edit metric"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMetric(metric.id)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                    title="Delete metric"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Unit:</span>
                                  <span className="font-medium">{metric.unit || 'None'}</span>
                                </div>
                                {metric.defaultValue !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Default:</span>
                                    <span className="font-medium">{metric.defaultValue}</span>
                                  </div>
                                )}
                                {(metric.minValue !== undefined || metric.maxValue !== undefined) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Range:</span>
                                    <span className="font-medium">
                                      {metric.minValue !== undefined ? metric.minValue : '∞'} - {metric.maxValue !== undefined ? metric.maxValue : '∞'}
                                    </span>
                                  </div>
                                )}
                                {metric.placeholder && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Placeholder:</span>
                                    <span className="font-medium">{metric.placeholder}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Metric Form Modal */}
        {showMetricForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
            <div className="relative top-8 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingMetric ? 'Edit Metric' : 'Add New Metric'}
                </h3>
                <button
                  onClick={() => setShowMetricForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Metric Name *</label>
                    <input
                      type="text"
                      value={metricForm.name || ''}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                      placeholder="Enter metric name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key (for code) *</label>
                    <input
                      type="text"
                      value={metricForm.key || ''}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, key: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                      placeholder="camelCaseKey"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={metricForm.description || ''}
                    onChange={(e) => setMetricForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    rows={3}
                    placeholder="Describe what this metric measures..."
                  />
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
                    <select
                      value={metricForm.dataType}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, dataType: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    >
                      {dataTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={metricForm.category}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    >
                      {categories.map(category => (
                        <option key={category.key} value={category.key}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                    <input
                      type="text"
                      value={metricForm.unit || ''}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                      placeholder="$, %, hrs, etc."
                    />
                  </div>
                </div>

                {/* Values and Validation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={metricForm.defaultValue || ''}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, defaultValue: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={metricForm.minValue || ''}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, minValue: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={metricForm.maxValue || ''}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, maxValue: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    />
                  </div>
                </div>

                {/* UI Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder Text</label>
                    <input
                      type="text"
                      value={metricForm.placeholder || ''}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, placeholder: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                      placeholder="Enter placeholder text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                    <input
                      type="number"
                      value={metricForm.sortOrder || ''}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 100 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Help Text</label>
                  <input
                    type="text"
                    value={metricForm.helpText || ''}
                    onChange={(e) => setMetricForm(prev => ({ ...prev, helpText: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="Help text shown below the input field"
                  />
                </div>

                {/* Options */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={metricForm.isRequired || false}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                      className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Required field</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={metricForm.isActive !== false}
                      onChange={(e) => setMetricForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active metric</label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowMetricForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMetric}
                    disabled={!metricForm.name || !metricForm.key}
                    className="px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingMetric ? 'Update Metric' : 'Create Metric'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DivisionMetricsManager;