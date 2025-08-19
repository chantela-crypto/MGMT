import React, { useState } from 'react';
import { 
  FileText, Save, X, Eye, Download, Upload, Palette, 
  Type, Layout, Image, Settings, Plus, Edit, Trash2,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic
} from 'lucide-react';

interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  type: 'performance-review' | 'employee-report' | 'division-summary' | 'monthly-report';
  layout: {
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
  };
  header: {
    enabled: boolean;
    logo: { enabled: boolean; url: string; width: number; height: number };
    companyName: { enabled: boolean; text: string; fontSize: number; color: string };
    title: { enabled: boolean; text: string; fontSize: number; color: string };
    subtitle: { enabled: boolean; text: string; fontSize: number; color: string };
    backgroundColor: string;
    height: number;
  };
  footer: {
    enabled: boolean;
    text: string;
    fontSize: number;
    color: string;
    backgroundColor: string;
    height: number;
    showPageNumbers: boolean;
    showDate: boolean;
  };
  content: {
    sections: PDFSection[];
    backgroundColor: string;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    textColor: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PDFSection {
  id: string;
  type: 'text' | 'table' | 'chart' | 'metrics' | 'signature' | 'spacer';
  title: string;
  content: any;
  styling: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    padding: number;
    margin: number;
  };
  isVisible: boolean;
  sortOrder: number;
}

interface PDFDesignerProps {
  onClose?: () => void;
}

const PDFDesigner: React.FC<PDFDesignerProps> = ({ onClose }) => {
  const [templates, setTemplates] = useState<PDFTemplate[]>([
    {
      id: 'template-performance',
      name: 'Performance Review Report',
      description: 'Comprehensive employee performance review with KPIs and goals',
      type: 'performance-review',
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      header: {
        enabled: true,
        logo: { enabled: true, url: '/logo tb.png', width: 60, height: 60 },
        companyName: { enabled: true, text: 'True Balance Longevity Inc.', fontSize: 18, color: '#0c5b63' },
        title: { enabled: true, text: 'Performance Review Report', fontSize: 24, color: '#111827' },
        subtitle: { enabled: true, text: 'Employee Performance Analysis', fontSize: 14, color: '#6b7280' },
        backgroundColor: '#ffffff',
        height: 120,
      },
      footer: {
        enabled: true,
        text: 'Confidential - True Balance Longevity Inc.',
        fontSize: 10,
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        height: 40,
        showPageNumbers: true,
        showDate: true,
      },
      content: {
        sections: [
          {
            id: 'employee-info',
            type: 'text',
            title: 'Employee Information',
            content: { fields: ['name', 'position', 'division', 'hireDate'] },
            styling: {
              backgroundColor: '#ffffff',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              borderRadius: 8,
              padding: 16,
              margin: 8,
            },
            isVisible: true,
            sortOrder: 1,
          },
          {
            id: 'kpi-metrics',
            type: 'metrics',
            title: 'Key Performance Indicators',
            content: { metrics: ['productivityRate', 'retailPercentage', 'happinessScore', 'attendanceRate'] },
            styling: {
              backgroundColor: '#f9fafb',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              borderRadius: 8,
              padding: 16,
              margin: 8,
            },
            isVisible: true,
            sortOrder: 2,
          },
        ],
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        lineHeight: 1.5,
        textColor: '#111827',
      },
      branding: {
        primaryColor: '#f4647d',
        secondaryColor: '#0c5b63',
        accentColor: '#fd8585',
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(templates[0]);
  const [activeTab, setActiveTab] = useState<'layout' | 'header' | 'content' | 'footer' | 'branding'>('layout');
  const [showTemplateForm, setShowTemplateForm] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    setTemplates(prev => prev.map(template => 
      template.id === selectedTemplate.id 
        ? { ...selectedTemplate, updatedAt: new Date() }
        : template
    ));
    
    alert('PDF template saved successfully!');
  };

  const handleExportTemplate = () => {
    if (!selectedTemplate) return;
    
    const dataStr = JSON.stringify(selectedTemplate, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}-template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplate = JSON.parse(e.target?.result as string) as PDFTemplate;
        importedTemplate.id = `template-${Date.now()}`;
        importedTemplate.name = `${importedTemplate.name} (Imported)`;
        setTemplates(prev => [...prev, importedTemplate]);
        setSelectedTemplate(importedTemplate);
      } catch (error) {
        alert('Error importing template. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const updateTemplate = (updates: Partial<PDFTemplate>) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({ ...selectedTemplate, ...updates });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-[var(--color-primary,#f4647d)] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">PDF Report Designer</h2>
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
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Preview ON' : 'Preview OFF'}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
              <button
                onClick={() => setShowTemplateForm(true)}
                className="p-2 text-[var(--color-primary,#f4647d)] hover:bg-red-100 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {templates.map(template => (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id 
                      ? 'border-[var(--color-primary,#f4647d)] bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                  <div className="text-xs text-gray-500 capitalize">{template.type.replace('-', ' ')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Design Controls */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            {selectedTemplate && (
              <>
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { id: 'layout', label: 'Layout', icon: Layout },
                      { id: 'header', label: 'Header', icon: AlignLeft },
                      { id: 'content', label: 'Content', icon: FileText },
                      { id: 'footer', label: 'Footer', icon: AlignLeft },
                      { id: 'branding', label: 'Branding', icon: Palette },
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

                {/* Layout Tab */}
                {activeTab === 'layout' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Page Size</label>
                        <select
                          value={selectedTemplate.layout.pageSize}
                          onChange={(e) => updateTemplate({
                            layout: { ...selectedTemplate.layout, pageSize: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                        >
                          <option value="A4">A4</option>
                          <option value="Letter">Letter</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                        <select
                          value={selectedTemplate.layout.orientation}
                          onChange={(e) => updateTemplate({
                            layout: { ...selectedTemplate.layout, orientation: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Margins (mm)</label>
                      <div className="grid grid-cols-4 gap-2">
                        <input
                          type="number"
                          placeholder="Top"
                          value={selectedTemplate.layout.margins.top}
                          onChange={(e) => updateTemplate({
                            layout: {
                              ...selectedTemplate.layout,
                              margins: { ...selectedTemplate.layout.margins, top: parseInt(e.target.value) || 0 }
                            }
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                        />
                        <input
                          type="number"
                          placeholder="Right"
                          value={selectedTemplate.layout.margins.right}
                          onChange={(e) => updateTemplate({
                            layout: {
                              ...selectedTemplate.layout,
                              margins: { ...selectedTemplate.layout.margins, right: parseInt(e.target.value) || 0 }
                            }
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                        />
                        <input
                          type="number"
                          placeholder="Bottom"
                          value={selectedTemplate.layout.margins.bottom}
                          onChange={(e) => updateTemplate({
                            layout: {
                              ...selectedTemplate.layout,
                              margins: { ...selectedTemplate.layout.margins, bottom: parseInt(e.target.value) || 0 }
                            }
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                        />
                        <input
                          type="number"
                          placeholder="Left"
                          value={selectedTemplate.layout.margins.left}
                          onChange={(e) => updateTemplate({
                            layout: {
                              ...selectedTemplate.layout,
                              margins: { ...selectedTemplate.layout.margins, left: parseInt(e.target.value) || 0 }
                            }
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Header Tab */}
                {activeTab === 'header' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Enable Header</label>
                      <input
                        type="checkbox"
                        checked={selectedTemplate.header.enabled}
                        onChange={(e) => updateTemplate({
                          header: { ...selectedTemplate.header, enabled: e.target.checked }
                        })}
                        className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                      />
                    </div>

                    {selectedTemplate.header.enabled && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <input
                              type="text"
                              value={selectedTemplate.header.companyName.text}
                              onChange={(e) => updateTemplate({
                                header: {
                                  ...selectedTemplate.header,
                                  companyName: { ...selectedTemplate.header.companyName, text: e.target.value }
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Report Title</label>
                            <input
                              type="text"
                              value={selectedTemplate.header.title.text}
                              onChange={(e) => updateTemplate({
                                header: {
                                  ...selectedTemplate.header,
                                  title: { ...selectedTemplate.header.title, text: e.target.value }
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Logo Settings</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedTemplate.header.logo.enabled}
                                onChange={(e) => updateTemplate({
                                  header: {
                                    ...selectedTemplate.header,
                                    logo: { ...selectedTemplate.header.logo, enabled: e.target.checked }
                                  }
                                })}
                                className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                              />
                              <label className="ml-2 text-sm text-gray-700">Show Logo</label>
                            </div>
                            <input
                              type="number"
                              placeholder="Width"
                              value={selectedTemplate.header.logo.width}
                              onChange={(e) => updateTemplate({
                                header: {
                                  ...selectedTemplate.header,
                                  logo: { ...selectedTemplate.header.logo, width: parseInt(e.target.value) || 0 }
                                }
                              })}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                            />
                            <input
                              type="number"
                              placeholder="Height"
                              value={selectedTemplate.header.logo.height}
                              onChange={(e) => updateTemplate({
                                header: {
                                  ...selectedTemplate.header,
                                  logo: { ...selectedTemplate.header.logo, height: parseInt(e.target.value) || 0 }
                                }
                              })}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Branding Tab */}
                {activeTab === 'branding' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={selectedTemplate.branding.primaryColor}
                            onChange={(e) => updateTemplate({
                              branding: { ...selectedTemplate.branding, primaryColor: e.target.value }
                            })}
                            className="w-8 h-8 rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={selectedTemplate.branding.primaryColor}
                            onChange={(e) => updateTemplate({
                              branding: { ...selectedTemplate.branding, primaryColor: e.target.value }
                            })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={selectedTemplate.branding.secondaryColor}
                            onChange={(e) => updateTemplate({
                              branding: { ...selectedTemplate.branding, secondaryColor: e.target.value }
                            })}
                            className="w-8 h-8 rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={selectedTemplate.branding.secondaryColor}
                            onChange={(e) => updateTemplate({
                              branding: { ...selectedTemplate.branding, secondaryColor: e.target.value }
                            })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={selectedTemplate.branding.accentColor}
                            onChange={(e) => updateTemplate({
                              branding: { ...selectedTemplate.branding, accentColor: e.target.value }
                            })}
                            className="w-8 h-8 rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={selectedTemplate.branding.accentColor}
                            onChange={(e) => updateTemplate({
                              branding: { ...selectedTemplate.branding, accentColor: e.target.value }
                            })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Tab */}
                {activeTab === 'content' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">Content Sections</h4>
                      <button
                        onClick={() => {
                          const newSection: PDFSection = {
                            id: `section-${Date.now()}`,
                            type: 'text',
                            title: 'New Section',
                            content: {},
                            styling: {
                              backgroundColor: '#ffffff',
                              borderColor: '#e5e7eb',
                              borderWidth: 1,
                              borderRadius: 8,
                              padding: 16,
                              margin: 8,
                            },
                            isVisible: true,
                            sortOrder: selectedTemplate.content.sections.length + 1,
                          };
                          updateTemplate({
                            content: {
                              ...selectedTemplate.content,
                              sections: [...selectedTemplate.content.sections, newSection]
                            }
                          });
                        }}
                        className="flex items-center px-3 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </button>
                    </div>

                    <div className="space-y-4">
                      {selectedTemplate.content.sections.map(section => (
                        <div key={section.id} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900">{section.title}</h5>
                              <p className="text-sm text-gray-600 capitalize">{section.type}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  updateTemplate({
                                    content: {
                                      ...selectedTemplate.content,
                                      sections: selectedTemplate.content.sections.map(s =>
                                        s.id === section.id ? { ...s, isVisible: !s.isVisible } : s
                                      )
                                    }
                                  });
                                }}
                                className={`p-1 rounded ${section.isVisible ? 'text-green-600' : 'text-gray-400'}`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  updateTemplate({
                                    content: {
                                      ...selectedTemplate.content,
                                      sections: selectedTemplate.content.sections.filter(s => s.id !== section.id)
                                    }
                                  });
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Section Title"
                              value={section.title}
                              onChange={(e) => updateTemplate({
                                content: {
                                  ...selectedTemplate.content,
                                  sections: selectedTemplate.content.sections.map(s =>
                                    s.id === section.id ? { ...s, title: e.target.value } : s
                                  )
                                }
                              })}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                            />
                            <select
                              value={section.type}
                              onChange={(e) => updateTemplate({
                                content: {
                                  ...selectedTemplate.content,
                                  sections: selectedTemplate.content.sections.map(s =>
                                    s.id === section.id ? { ...s, type: e.target.value as any } : s
                                  )
                                }
                              })}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                            >
                              <option value="text">Text Block</option>
                              <option value="table">Data Table</option>
                              <option value="chart">Chart/Graph</option>
                              <option value="metrics">KPI Metrics</option>
                              <option value="signature">Signature Block</option>
                              <option value="spacer">Spacer</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Template
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportTemplate}
                        className="hidden"
                      />
                    </label>
                    
                    <button
                      onClick={handleExportTemplate}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Template
                    </button>
                  </div>
                  
                  <button
                    onClick={handleSaveTemplate}
                    className="flex items-center px-6 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Preview</h3>
            
            {selectedTemplate && previewMode ? (
              <div 
                className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm"
                style={{ 
                  backgroundColor: selectedTemplate.content.backgroundColor,
                  fontFamily: selectedTemplate.content.fontFamily,
                  fontSize: `${selectedTemplate.content.fontSize}px`,
                  color: selectedTemplate.content.textColor,
                }}
              >
                {/* Header Preview */}
                {selectedTemplate.header.enabled && (
                  <div 
                    className="mb-4 p-4 rounded-lg"
                    style={{ 
                      backgroundColor: selectedTemplate.header.backgroundColor,
                      height: `${selectedTemplate.header.height}px`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {selectedTemplate.header.logo.enabled && (
                        <div 
                          className="bg-gray-200 rounded flex items-center justify-center"
                          style={{ 
                            width: `${selectedTemplate.header.logo.width}px`,
                            height: `${selectedTemplate.header.logo.height}px`,
                          }}
                        >
                          <span className="text-xs text-gray-500">LOGO</span>
                        </div>
                      )}
                      <div className="text-right">
                        <div 
                          className="font-bold"
                          style={{ 
                            fontSize: `${selectedTemplate.header.title.fontSize}px`,
                            color: selectedTemplate.header.title.color,
                          }}
                        >
                          {selectedTemplate.header.title.text}
                        </div>
                        <div 
                          style={{ 
                            fontSize: `${selectedTemplate.header.subtitle.fontSize}px`,
                            color: selectedTemplate.header.subtitle.color,
                          }}
                        >
                          {selectedTemplate.header.subtitle.text}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Preview */}
                <div className="space-y-4">
                  {selectedTemplate.content.sections
                    .filter(section => section.isVisible)
                    .map(section => (
                      <div 
                        key={section.id}
                        className="rounded-lg"
                        style={{
                          backgroundColor: section.styling.backgroundColor,
                          borderColor: section.styling.borderColor,
                          borderWidth: `${section.styling.borderWidth}px`,
                          borderRadius: `${section.styling.borderRadius}px`,
                          padding: `${section.styling.padding}px`,
                          margin: `${section.styling.margin}px`,
                        }}
                      >
                        <h4 className="font-semibold mb-2">{section.title}</h4>
                        <div className="text-sm text-gray-600">
                          {section.type === 'text' && 'Text content would appear here'}
                          {section.type === 'table' && 'Data table would appear here'}
                          {section.type === 'chart' && 'Chart/graph would appear here'}
                          {section.type === 'metrics' && 'KPI metrics would appear here'}
                          {section.type === 'signature' && 'Signature block would appear here'}
                          {section.type === 'spacer' && 'Spacing element'}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Footer Preview */}
                {selectedTemplate.footer.enabled && (
                  <div 
                    className="mt-4 p-2 rounded-lg text-center"
                    style={{ 
                      backgroundColor: selectedTemplate.footer.backgroundColor,
                      fontSize: `${selectedTemplate.footer.fontSize}px`,
                      color: selectedTemplate.footer.color,
                    }}
                  >
                    {selectedTemplate.footer.text}
                    {selectedTemplate.footer.showPageNumbers && ' | Page 1 of 1'}
                    {selectedTemplate.footer.showDate && ` | ${new Date().toLocaleDateString()}`}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {selectedTemplate ? 'Enable preview mode to see template design' : 'Select a template to preview'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFDesigner;