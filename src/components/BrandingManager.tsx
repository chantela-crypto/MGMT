import React, { useState } from 'react';
import { BrandingConfig, BrandingPreset } from '../types/branding';
import { useBranding } from '../hooks/useBranding';
import { brandingPresets } from '../data/brandingPresets';
import { 
  Palette, Save, RotateCcw, Eye, EyeOff, Download, Upload, 
  Type, Layout, Zap, Sparkles, X, Check, Copy, RefreshCw 
} from 'lucide-react';

interface BrandingManagerProps {
  onClose?: () => void;
}

const BrandingManager: React.FC<BrandingManagerProps> = ({ onClose }) => {
  const { brandingConfig, updateBranding, resetToDefault, applyBranding, isApplying } = useBranding();
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'presets'>('colors');
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [tempConfig, setTempConfig] = useState<BrandingConfig>(brandingConfig);

  const handleColorChange = (path: string, value: string) => {
    const keys = path.split('.');
    const newConfig = { ...tempConfig };
    
    let current: any = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setTempConfig(newConfig);
    
    if (previewMode) {
      applyBranding(newConfig);
    }
  };

  const handleSave = () => {
    updateBranding(tempConfig);
    
    // Force immediate application of changes
    applyBranding(tempConfig);
    
    // Dispatch comprehensive update events
    window.dispatchEvent(new CustomEvent('brandingConfigurationUpdated', {
      detail: { 
        config: tempConfig,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Force immediate localStorage save
    try {
      localStorage.setItem('brandingConfig', JSON.stringify(tempConfig));
    } catch (error) {
      console.error('Error saving branding config:', error);
    }
    
    alert('Branding configuration saved and applied successfully!');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes? This will discard unsaved modifications.')) {
      setTempConfig(brandingConfig);
      if (previewMode) {
        applyBranding(brandingConfig);
      }
    }
  };

  const handlePresetApply = (preset: BrandingPreset) => {
    const newConfig = {
      ...tempConfig,
      ...preset.config,
      id: tempConfig.id,
      name: preset.name,
      updatedAt: new Date(),
    } as BrandingConfig;
    
    setTempConfig(newConfig);
    
    if (previewMode) {
      applyBranding(newConfig);
    }
    
    // Show feedback for preset application
    alert(`${preset.name} preset applied successfully!`);
  };

  const exportBranding = () => {
    const dataStr = JSON.stringify(tempConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `branding-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importBranding = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string) as BrandingConfig;
        setTempConfig(importedConfig);
        if (previewMode) {
          applyBranding(importedConfig);
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing branding configuration. Please check the file format.');
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsText(file);
  };

  const colorSections = [
    {
      title: 'Primary Colors',
      colors: [
        { key: 'colors.primary', label: 'Primary', description: 'Main brand color' },
        { key: 'colors.secondary', label: 'Secondary', description: 'Secondary brand color' },
        { key: 'colors.accent', label: 'Accent', description: 'Accent and highlight color' },
      ],
    },
    {
      title: 'Status Colors',
      colors: [
        { key: 'colors.success', label: 'Success', description: 'Success states and positive actions' },
        { key: 'colors.warning', label: 'Warning', description: 'Warning states and caution' },
        { key: 'colors.error', label: 'Error', description: 'Error states and destructive actions' },
        { key: 'colors.neutral', label: 'Neutral', description: 'Neutral and disabled states' },
      ],
    },
    {
      title: 'Surface Colors',
      colors: [
        { key: 'colors.background', label: 'Background', description: 'Page background color' },
        { key: 'colors.surface', label: 'Surface', description: 'Card and panel background' },
      ],
    },
    {
      title: 'Text Colors',
      colors: [
        { key: 'colors.text.primary', label: 'Primary Text', description: 'Main text color' },
        { key: 'colors.text.secondary', label: 'Secondary Text', description: 'Secondary text color' },
        { key: 'colors.text.muted', label: 'Muted Text', description: 'Muted and disabled text' },
      ],
    },
  ];

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Palette className="h-6 w-6 text-[var(--color-primary,#f4647d)] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Branding & Appearance Manager</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                previewMode 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {previewMode ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {previewMode ? 'Live Preview ON' : 'Live Preview OFF'}
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
            {[
              { id: 'colors', label: 'Colors', icon: Palette },
              { id: 'typography', label: 'Typography', icon: Type },
              { id: 'spacing', label: 'Layout & Spacing', icon: Layout },
              { id: 'presets', label: 'Presets & Templates', icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-[var(--color-primary,#f4647d)] text-[var(--color-primary,#f4647d)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-8">
            {colorSections.map(section => (
              <div key={section.title} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.colors.map(color => {
                    const currentValue = getNestedValue(tempConfig, color.key);
                    return (
                      <div key={color.key} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{color.label}</h4>
                            <p className="text-sm text-gray-600">{color.description}</p>
                          </div>
                          <div 
                            className="w-12 h-12 rounded-lg border-2 border-gray-200"
                            style={{ backgroundColor: currentValue }}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={currentValue}
                            onChange={(e) => handleColorChange(color.key, e.target.value)}
                            className="w-8 h-8 rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) => handleColorChange(color.key, e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                            placeholder="#000000"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(currentValue)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                            title="Copy color"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Font Families</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body Font</label>
                  <select
                    value={tempConfig.typography.fontFamily}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      typography: { ...prev.typography, fontFamily: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  >
                    <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">
                      System Default
                    </option>
                    <option value="Inter, -apple-system, BlinkMacSystemFont, sans-serif">Inter</option>
                    <option value="'Roboto', -apple-system, BlinkMacSystemFont, sans-serif">Roboto</option>
                    <option value="'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif">Open Sans</option>
                    <option value="'Poppins', -apple-system, BlinkMacSystemFont, sans-serif">Poppins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font</label>
                  <select
                    value={tempConfig.typography.headingFontFamily}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      typography: { ...prev.typography, headingFontFamily: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  >
                    <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">
                      System Default
                    </option>
                    <option value="Inter, -apple-system, BlinkMacSystemFont, sans-serif">Inter</option>
                    <option value="'Roboto', -apple-system, BlinkMacSystemFont, sans-serif">Roboto</option>
                    <option value="'Playfair Display', serif">Playfair Display</option>
                    <option value="'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif">Montserrat</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={tempConfig.companyName}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                  <input
                    type="text"
                    value={tempConfig.tagline}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, tagline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                  <input
                    type="text"
                    value={tempConfig.logo.url}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      logo: { ...prev.logo, url: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                  <input
                    type="text"
                    value={tempConfig.logo.width}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      logo: { ...prev.logo, width: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="32px"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input
                    type="text"
                    value={tempConfig.logo.height}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      logo: { ...prev.logo, height: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="32px"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Font Sizes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(tempConfig.typography.fontSize).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        typography: {
                          ...prev.typography,
                          fontSize: { ...prev.typography.fontSize, [key]: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Font Weights</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(tempConfig.typography.fontWeight).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{key}</label>
                    <select
                      value={value}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        typography: {
                          ...prev.typography,
                          fontWeight: { ...prev.typography.fontWeight, [key]: e.target.value }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    >
                      <option value="300">Light (300)</option>
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semibold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra Bold (800)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Spacing Tab */}
        {activeTab === 'spacing' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Spacing Scale</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(tempConfig.spacing).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        spacing: { ...prev.spacing, [key]: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Border Radius</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(tempConfig.borderRadius).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        borderRadius: { ...prev.borderRadius, [key]: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brandingPresets.map(preset => (
                <div key={preset.id} className="bg-white rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{preset.name}</h4>
                      {preset.isBuiltIn && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Built-in
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{preset.description}</p>
                    
                    {/* Color Preview */}
                    <div className="flex space-x-2 mb-4">
                      {preset.config.colors && (
                        <>
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-200"
                            style={{ backgroundColor: preset.config.colors.primary }}
                            title="Primary"
                          />
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-200"
                            style={{ backgroundColor: preset.config.colors.secondary }}
                            title="Secondary"
                          />
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-200"
                            style={{ backgroundColor: preset.config.colors.accent }}
                            title="Accent"
                          />
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handlePresetApply(preset)}
                      className="w-full px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 transition-opacity"
                    >
                      Apply Preset
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import/Export</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={exportBranding}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </button>
                
                <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Configuration
                  <input
                    type="file"
                    accept=".json"
                    onChange={importBranding}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={resetToDefault}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Changes
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={isApplying}
              className="flex items-center px-6 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isApplying ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isApplying ? 'Applying...' : 'Save & Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingManager;