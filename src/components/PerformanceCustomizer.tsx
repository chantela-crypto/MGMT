import React, { useState } from 'react';
import { PerformancePageConfig } from '../types/branding';
import { useDashboardConfig } from '../hooks/useDashboardConfig';
import { useKPIManagement } from '../hooks/useKPIManagement';
import { 
  BarChart3, Settings, ToggleLeft, ToggleRight, Save, X, Plus, 
  Edit, Trash2, Target, Clock, Users, Award, CheckCircle, Eye
} from 'lucide-react';

interface PerformanceCustomizerProps {
  onClose?: () => void;
}

const PerformanceCustomizer: React.FC<PerformanceCustomizerProps> = ({ onClose }) => {
  const {
    performanceConfig,
    updatePerformanceConfig,
    addCustomField,
    removeCustomField,
  } = useDashboardConfig();

  const { kpiDefinitions } = useKPIManagement();

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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-[var(--color-primary,#f4647d)] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Performance Page Customization</h2>
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

        <div className="space-y-6">
          {/* Page Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Time Range</label>
                <select
                  value={performanceConfig.metricDisplayOptions.defaultTimeRange}
                  onChange={(e) => updatePerformanceConfig({
                    metricDisplayOptions: {
                      ...performanceConfig.metricDisplayOptions,
                      defaultTimeRange: e.target.value as any
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                >
                  <option value="1m">1 Month</option>
                  <option value="3m">3 Months</option>
                  <option value="6m">6 Months</option>
                  <option value="12m">12 Months</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section Toggles */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Sections</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(performanceConfig.enabledSections).map(([sectionKey, isEnabled]) => (
                <div key={sectionKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <p className="text-xs text-gray-600">
                      {sectionKey === 'individualMetrics' && 'Individual employee performance metrics and KPIs'}
                      {sectionKey === 'teamComparison' && 'Team comparison charts and rankings'}
                      {sectionKey === 'goalTracking' && 'Goal setting, progress tracking, and target management'}
                      {sectionKey === 'performanceHistory' && 'Historical performance data and trends'}
                      {sectionKey === 'coachingNotes' && 'Manager coaching notes and feedback system'}
                      {sectionKey === 'actionPlans' && 'Performance improvement action plans'}
                      {sectionKey === 'certifications' && 'Training certifications and skill tracking'}
                      {sectionKey === 'attendanceTracking' && 'Attendance monitoring and schedule compliance'}
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

          {/* Display Options */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metric Display Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Show Target Comparison</span>
                    <p className="text-xs text-gray-600">Display actual vs target comparisons</p>
                  </div>
                  <button
                    onClick={() => updatePerformanceConfig({
                      metricDisplayOptions: {
                        ...performanceConfig.metricDisplayOptions,
                        showTargetComparison: !performanceConfig.metricDisplayOptions.showTargetComparison
                      }
                    })}
                  >
                    {performanceConfig.metricDisplayOptions.showTargetComparison ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Show Trend Indicators</span>
                    <p className="text-xs text-gray-600">Display up/down trend arrows</p>
                  </div>
                  <button
                    onClick={() => updatePerformanceConfig({
                      metricDisplayOptions: {
                        ...performanceConfig.metricDisplayOptions,
                        showTrendIndicators: !performanceConfig.metricDisplayOptions.showTrendIndicators
                      }
                    })}
                  >
                    {performanceConfig.metricDisplayOptions.showTrendIndicators ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Show Peer Comparison</span>
                    <p className="text-xs text-gray-600">Compare employee performance to peers</p>
                  </div>
                  <button
                    onClick={() => updatePerformanceConfig({
                      metricDisplayOptions: {
                        ...performanceConfig.metricDisplayOptions,
                        showPeerComparison: !performanceConfig.metricDisplayOptions.showPeerComparison
                      }
                    })}
                  >
                    {performanceConfig.metricDisplayOptions.showPeerComparison ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
                <select
                  value={performanceConfig.metricDisplayOptions.chartType}
                  onChange={(e) => updatePerformanceConfig({
                    metricDisplayOptions: {
                      ...performanceConfig.metricDisplayOptions,
                      chartType: e.target.value as any
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="area">Area Chart</option>
                </select>
              </div>
            </div>
          </div>

          {/* Review Workflow */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Workflow</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900">Manager Approval Required</span>
                  <p className="text-xs text-gray-600">Require manager approval for performance reviews</p>
                </div>
                <button
                  onClick={() => updatePerformanceConfig({
                    reviewWorkflow: {
                      ...performanceConfig.reviewWorkflow,
                      managerApprovalRequired: !performanceConfig.reviewWorkflow.managerApprovalRequired
                    }
                  })}
                >
                  {performanceConfig.reviewWorkflow.managerApprovalRequired ? (
                    <ToggleRight className="h-6 w-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900">Employee Acknowledgment Required</span>
                  <p className="text-xs text-gray-600">Require employee to acknowledge review completion</p>
                </div>
                <button
                  onClick={() => updatePerformanceConfig({
                    reviewWorkflow: {
                      ...performanceConfig.reviewWorkflow,
                      employeeAcknowledgmentRequired: !performanceConfig.reviewWorkflow.employeeAcknowledgmentRequired
                    }
                  })}
                >
                  {performanceConfig.reviewWorkflow.employeeAcknowledgmentRequired ? (
                    <ToggleRight className="h-6 w-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900">Auto-Schedule Follow-ups</span>
                  <p className="text-xs text-gray-600">Automatically schedule follow-up meetings</p>
                </div>
                <button
                  onClick={() => updatePerformanceConfig({
                    reviewWorkflow: {
                      ...performanceConfig.reviewWorkflow,
                      autoScheduleFollowUp: !performanceConfig.reviewWorkflow.autoScheduleFollowUp
                    }
                  })}
                >
                  {performanceConfig.reviewWorkflow.autoScheduleFollowUp ? (
                    <ToggleRight className="h-6 w-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Custom Fields Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Custom Performance Fields</h3>
              <button
                onClick={() => setShowCustomFieldForm(true)}
                className="flex items-center px-3 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Field
              </button>
            </div>
            
            <div className="space-y-3">
              {performanceConfig.customFields.map(field => (
                <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{field.name}</span>
                    <div className="text-xs text-gray-600">
                      Type: {field.type} • {field.required ? 'Required' : 'Optional'}
                      {field.options && ` • Options: ${field.options.join(', ')}`}
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
              
              {performanceConfig.customFields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No custom fields configured. Add custom fields to capture additional performance data.
                </div>
              )}
            </div>
          </div>
        </div>

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
            All changes are automatically saved and applied to the performance system
          </div>
          
          <div className="flex items-center space-x-3">
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

export default PerformanceCustomizer;