import React, { useState } from 'react';
import { KPIDefinition, DivisionKPIConfig } from '../types/branding';
import { Division } from '../types/division';
import { useKPIManagement } from '../hooks/useKPIManagement';
import { 
  Target, Plus, Edit, Trash2, Save, X, 
  BarChart3, TrendingUp, DollarSign, Clock, Users, Award,
  ChevronDown, ChevronRight, Copy, Eye, Settings, Folder
} from 'lucide-react';

interface KPIManagerProps {
  divisions: Division[];
  onClose?: () => void;
}

const KPIManager: React.FC<KPIManagerProps> = ({ divisions, onClose }) => {
  const {
    kpiDefinitions,
    divisionKPIConfigs,
    getDivisionKPIs,
    getKPITarget,
    addKPIDefinition,
    updateKPIDefinition,
    removeKPIDefinition,
    updateDivisionKPIConfig,
    setCustomTarget,
    reorderDivisionKPIs,
    getKPICategories,
    addKPICategory,
    updateKPICategory,
    removeKPICategory,
  } = useKPIManagement();

  const [activeTab, setActiveTab] = useState<'global' | 'divisions'>('global');
  const [selectedDivision, setSelectedDivision] = useState<string>(divisions[0]?.id || '');
  const [editingKPI, setEditingKPI] = useState<KPIDefinition | null>(null);
  const [showKPIForm, setShowKPIForm] = useState<boolean>(false);
  const [showCategoryForm, setShowCategoryForm] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [categoryForm, setCategoryForm] = useState<{ key: string; label: string }>({ key: '', label: '' });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    performance: true,
    financial: true,
    operational: true,
    satisfaction: true,
    growth: true,
    retention: true,
  });
  const [kpiForm, setKPIForm] = useState<Partial<KPIDefinition>>({
    category: 'performance',
    dataType: 'percentage',
    isActive: true,
    divisionSpecific: false,
    applicableDivisions: ['all'],
    sortOrder: 100,
  });

  const categories = getKPICategories();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return BarChart3;
      case 'financial': return DollarSign;
      case 'operational': return Clock;
      case 'satisfaction': return Award;
      case 'growth': return TrendingUp;
      case 'retention': return Users;
      default: return Target;
    }
  };

  const handleSaveCategory = () => {
    if (!categoryForm.key || !categoryForm.label) {
      alert('Please provide both category key and label');
      return;
    }
    
    if (editingCategory) {
      updateKPICategory(editingCategory, categoryForm.key, categoryForm.label);
    } else {
      addKPICategory(categoryForm.key, categoryForm.label);
    }
    
    setShowCategoryForm(false);
    setEditingCategory('');
    setCategoryForm({ key: '', label: '' });
  };

  const handleEditCategory = (categoryKey: string, categoryLabel: string) => {
    setEditingCategory(categoryKey);
    setCategoryForm({ key: categoryKey, label: categoryLabel });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (categoryKey: string) => {
    const categoryKPIs = kpiDefinitions.filter(kpi => kpi.category === categoryKey);
    if (categoryKPIs.length > 0) {
      alert(`Cannot delete category "${categoryKey}" because it contains ${categoryKPIs.length} KPIs. Please move or delete the KPIs first.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the "${categoryKey}" category?`)) {
      removeKPICategory(categoryKey);
    }
  };

  const handleSaveKPI = () => {
    if (!kpiForm.name || !kpiForm.key) {
      alert('Please provide both KPI name and key');
      return;
    }
    
    if (editingKPI) {
      updateKPIDefinition(editingKPI.id, kpiForm);
    } else {
      addKPIDefinition(kpiForm as Omit<KPIDefinition, 'id' | 'createdAt' | 'updatedAt'>);
    }
    
    // Force KPI system re-render
    window.dispatchEvent(new CustomEvent('kpiSystemUpdated', {
      detail: { timestamp: new Date().toISOString() }
    }));
    
    setShowKPIForm(false);
    setEditingKPI(null);
    setKPIForm({
      category: 'performance',
      dataType: 'percentage',
      isActive: true,
      divisionSpecific: false,
      applicableDivisions: ['all'],
      sortOrder: 100,
    });
  };

  const handleEditKPI = (kpi: KPIDefinition) => {
    setEditingKPI(kpi);
    setKPIForm(kpi);
    setShowKPIForm(true);
  };

  const handleDeleteKPI = (kpiId: string) => {
    if (window.confirm('Are you sure you want to delete this KPI? This will remove it from all divisions.')) {
      removeKPIDefinition(kpiId);
    }
  };

  const handleCustomTargetChange = (kpiId: string, target: number) => {
    setCustomTarget(selectedDivision, kpiId, target);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const duplicateKPI = (kpi: KPIDefinition) => {
    const duplicatedKPI = {
      ...kpi,
      name: `${kpi.name} (Copy)`,
      key: `${kpi.key}Copy`,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    delete duplicatedKPI.id;
    delete duplicatedKPI.createdAt;
    delete duplicatedKPI.updatedAt;
    
    setKPIForm(duplicatedKPI);
    setEditingKPI(null);
    setShowKPIForm(true);
  };

  const selectedDivisionData = divisions.find(d => d.id === selectedDivision);
  const divisionKPIs = getDivisionKPIs(selectedDivision);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Target className="h-6 w-6 text-[var(--color-primary,#f4647d)] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">KPI Management System</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowKPIForm(true)}
              className="flex items-center px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add KPI
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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('global')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'global'
                  ? 'border-[var(--color-primary,#f4647d)] text-[var(--color-primary,#f4647d)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Global KPI Library
            </button>
            <button
              onClick={() => setActiveTab('divisions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'divisions'
                  ? 'border-[var(--color-primary,#f4647d)] text-[var(--color-primary,#f4647d)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              Division Configuration
            </button>
          </nav>
        </div>

        {/* Global KPI Library Tab */}
        {activeTab === 'global' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Global KPI Library</h4>
              <p className="text-sm text-blue-800">
                Manage the master library of KPIs that can be assigned to divisions. 
                Create new KPIs, edit existing ones, or remove unused metrics.
              </p>
            </div>

            {/* Category Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">KPI Categories</h3>
                <button
                  onClick={() => {
                    setEditingCategory('');
                    setCategoryForm({ key: '', label: '' });
                    setShowCategoryForm(true);
                  }}
                  className="flex items-center px-3 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                  <div key={category.key} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Folder className="h-5 w-5 text-[var(--color-primary,#f4647d)] mr-2" />
                        <div>
                          <h4 className="font-medium text-gray-900">{category.label}</h4>
                          <p className="text-sm text-gray-600">{category.kpis.length} KPIs</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditCategory(category.key, category.label)}
                          className="p-1 text-gray-400 hover:text-[var(--color-primary,#f4647d)]"
                          title="Edit category"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.key)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Key: {category.key}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI Categories */}
            <div className="space-y-4">
              {categories.map(category => {
                const Icon = getCategoryIcon(category.key);
                const isExpanded = expandedCategories[category.key];
                
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
                            <h3 className="text-lg font-semibold text-gray-900">{category.label}</h3>
                            <p className="text-sm text-gray-600">{category.kpis.length} KPIs</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {category.kpis.map(kpi => (
                            <div key={kpi.id} className="bg-gray-50 rounded-lg p-4 border">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-900">{kpi.name}</h4>
                                  <p className="text-sm text-gray-600">{kpi.description}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => duplicateKPI(kpi)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Duplicate KPI"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditKPI(kpi)}
                                    className="p-1 text-gray-400 hover:text-[var(--color-primary,#f4647d)]"
                                    title="Edit KPI"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteKPI(kpi.id)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                    title="Delete KPI"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Type:</span>
                                  <span className="font-medium capitalize">{kpi.dataType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Target:</span>
                                  <span className="font-medium">{kpi.target}{kpi.unit}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Scope:</span>
                                  <span className="font-medium">
                                    {kpi.divisionSpecific ? 'Division-specific' : 'Global'}
                                  </span>
                                </div>
                                {kpi.formula && (
                                  <div className="mt-2 p-2 bg-white rounded border">
                                    <div className="text-xs text-gray-600 mb-1">Formula:</div>
                                    <div className="text-xs font-mono text-gray-800">{kpi.formula}</div>
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

        {/* Division Configuration Tab */}
        {activeTab === 'divisions' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">Division KPI Configuration</h4>
              <p className="text-sm text-green-800">
                Configure which KPIs are displayed for each division, set custom targets, 
                and reorder the display sequence.
              </p>
            </div>

            {/* Division Selector */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
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

            {/* Division KPI Configuration */}
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
                      <p className="text-gray-600">{divisionKPIs.length} active KPIs</p>
                    </div>
                  </div>
                </div>

                {/* KPI List with Custom Targets */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Active KPIs & Targets</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {divisionKPIs.map(kpi => {
                      const customTarget = getKPITarget(selectedDivision, kpi.id);
                      const hasCustomTarget = customTarget !== kpi.target;
                      
                      return (
                        <div key={kpi.id} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900">{kpi.name}</h5>
                              <p className="text-sm text-gray-600">{kpi.description}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                hasCustomTarget ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {hasCustomTarget ? 'Custom' : 'Default'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Default Target
                              </label>
                              <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm">
                                {kpi.target}{kpi.unit}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Custom Target
                              </label>
                              <input
                                type="number"
                                step={kpi.dataType === 'percentage' || kpi.dataType === 'score' ? '0.1' : '1'}
                                min={kpi.minValue}
                                max={kpi.maxValue}
                                value={customTarget}
                                onChange={(e) => handleCustomTargetChange(kpi.id, parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#f4647d)]"
                              />
                            </div>
                          </div>
                          
                          {kpi.formula && (
                            <div className="mt-3 p-2 bg-white rounded border">
                              <div className="text-xs text-gray-600 mb-1">Formula:</div>
                              <div className="text-xs font-mono text-gray-800">{kpi.formula}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setShowCategoryForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Key *</label>
                <input
                  type="text"
                  value={categoryForm.key}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  placeholder="e.g., customer-service"
                  disabled={!!editingCategory}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase, use hyphens for spaces. Cannot be changed after creation.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Label *</label>
                <input
                  type="text"
                  value={categoryForm.label}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  placeholder="e.g., Customer Service"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={!categoryForm.key || !categoryForm.label}
                  className="px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Form Modal */}
      {showKPIForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
          <div className="relative top-8 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingKPI ? 'Edit KPI' : 'Add New KPI'}
              </h3>
              <button
                onClick={() => setShowKPIForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">KPI Name *</label>
                  <input
                    type="text"
                    value={kpiForm.name || ''}
                    onChange={(e) => setKPIForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="Enter KPI name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key (for code) *</label>
                  <input
                    type="text"
                    value={kpiForm.key || ''}
                    onChange={(e) => setKPIForm(prev => ({ ...prev, key: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="camelCaseKey"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={kpiForm.description || ''}
                  onChange={(e) => setKPIForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  rows={3}
                  placeholder="Describe what this KPI measures..."
                />
              </div>

              {/* KPI Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={kpiForm.category}
                    onChange={(e) => setKPIForm(prev => ({ ...prev, category: e.target.value as any }))}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
                  <select
                    value={kpiForm.dataType}
                    onChange={(e) => setKPIForm(prev => ({ ...prev, dataType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="currency">Currency ($)</option>
                    <option value="number">Number</option>
                    <option value="score">Score (1-10)</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <input
                    type="text"
                    value={kpiForm.unit || ''}
                    onChange={(e) => setKPIForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="%, $, hrs, etc."
                  />
                </div>
              </div>

              {/* Targets and Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Target</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kpiForm.target || ''}
                    onChange={(e) => setKPIForm(prev => ({ ...prev, target: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kpiForm.minValue || ''}
                    onChange={(e) => setKPIForm(prev => ({ ...prev, minValue: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kpiForm.maxValue || ''}
                    onChange={(e) => setKPIForm(prev => ({ ...prev, maxValue: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  />
                </div>
              </div>

              {/* Formula and Dependencies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formula (Optional)</label>
                <input
                  type="text"
                  value={kpiForm.formula || ''}
                  onChange={(e) => setKPIForm(prev => ({ ...prev, formula: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  placeholder="e.g., (Booked Hours / Scheduled Hours) × 100"
                />
              </div>

              {/* Division Applicability */}
              <div>
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={kpiForm.divisionSpecific}
                    onChange={(e) => setKPIForm(prev => ({ 
                      ...prev, 
                      divisionSpecific: e.target.checked,
                      applicableDivisions: e.target.checked ? [] : ['all']
                    }))}
                    className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Division-specific KPI
                  </label>
                </div>

                {kpiForm.divisionSpecific && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Divisions</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {divisions.map(division => (
                        <div key={division.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={kpiForm.applicableDivisions?.includes(division.id) || false}
                            onChange={(e) => {
                              const current = kpiForm.applicableDivisions || [];
                              const updated = e.target.checked
                                ? [...current, division.id]
                                : current.filter(id => id !== division.id);
                              setKPIForm(prev => ({ ...prev, applicableDivisions: updated }));
                            }}
                            className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">{division.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowKPIForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKPI}
                  disabled={!kpiForm.name || !kpiForm.key}
                  className="px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingKPI ? 'Update KPI' : 'Create KPI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIManager;