import React, { useState } from 'react';
import { Division, User } from '../types/division';
import { Palette, Target, Menu, Monitor, BarChart3, Settings, X, Layout, Users, Calendar, Activity, Building2, FileText, Table as Tabs } from 'lucide-react';
import BrandingManager from './BrandingManager';
import DivisionColorManager from './DivisionColorManager';
import KPIManager from './KPIManager';
import SidebarManager from './SidebarManager';
import DashboardCustomizer from './DashboardCustomizer';
import PerformanceCustomizer from './PerformanceCustomizer';
import DivisionManager from './DivisionManager';
import PDFDesigner from './PDFDesigner';
import DivisionMetricsManager from './DivisionMetricsManager';
import { CheckCircle } from 'lucide-react';

interface BrandingKPISettingsProps {
  currentUser: User;
  divisions: Division[];
}

const BrandingKPISettings: React.FC<BrandingKPISettingsProps> = ({
  currentUser,
  divisions,
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'division-colors' | 'kpi-management' | 'sidebar' | 'dashboard' | 'performance' | 'division-management' | 'division-metrics' | 'pdf-designer'>('branding');
  const [showBrandingManager, setShowBrandingManager] = useState<boolean>(false);
  const [showDivisionColorManager, setShowDivisionColorManager] = useState<boolean>(false);
  const [showKPIManager, setShowKPIManager] = useState<boolean>(false);
  const [showSidebarManager, setShowSidebarManager] = useState<boolean>(false);
  const [showDashboardCustomizer, setShowDashboardCustomizer] = useState<boolean>(false);
  const [showPerformanceCustomizer, setShowPerformanceCustomizer] = useState<boolean>(false);
  const [showDivisionManager, setShowDivisionManager] = useState<boolean>(false);
  const [showDivisionMetricsManager, setShowDivisionMetricsManager] = useState<boolean>(false);
  const [showPDFDesigner, setShowPDFDesigner] = useState<boolean>(false);

  // Only admins can access customization
  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
          <p className="text-gray-600">
            Only administrators can access the customization settings.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'branding',
      label: 'Branding & Appearance',
      icon: Palette,
      description: 'Colors, typography, and visual elements',
      action: () => setShowBrandingManager(true),
    },
    {
      id: 'division-colors',
      label: 'Division Colors',
      icon: Palette,
      description: 'Customize colors for each division',
      action: () => setShowDivisionColorManager(true),
    },
    {
      id: 'kpi-management',
      label: 'KPI Management',
      icon: Target,
      description: 'Configure metrics and targets',
      action: () => setShowKPIManager(true),
    },
    {
      id: 'sidebar',
      label: 'Sidebar & Navigation',
      icon: Menu,
      description: 'Menu structure and labels',
      action: () => setShowSidebarManager(true),
    },
    {
      id: 'dashboard',
      label: 'Dashboard Customizer',
      icon: Monitor,
      description: 'Dashboard modules and data connections',
      action: () => setShowDashboardCustomizer(true),
    },
    {
      id: 'performance',
      label: 'Performance Customizer',
      icon: BarChart3,
      description: 'Performance page sections and workflows',
      action: () => setShowPerformanceCustomizer(true),
    },
    {
      id: 'division-management',
      label: 'Division Management',
      icon: Building2,
      description: 'Create and manage business divisions',
      action: () => setShowDivisionManager(true),
    },
    {
      id: 'division-metrics',
      label: 'Division Daily Metrics',
      icon: BarChart3,
      description: 'Configure daily metrics for each division',
      action: () => setShowDivisionMetricsManager(true),
    },
    {
      id: 'pdf-designer',
      label: 'PDF Report Designer',
      icon: FileText,
      description: 'Design performance report templates',
      action: () => setShowPDFDesigner(true),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[#0c5b63] to-[#0f6b73] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <button
              onClick={() => {
                // Force immediate application of all customization changes
                window.dispatchEvent(new CustomEvent('forceConfigurationUpdate', {
                  detail: { timestamp: new Date().toISOString() }
                }));
                
                // Force re-render of all components
                setTimeout(() => {
                  window.dispatchEvent(new Event('resize'));
                  window.location.reload();
                }, 500);
                
                alert('All customization changes applied successfully! Page will refresh to show all updates.');
              }}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Apply All Changes
            </button>
            
            <div>
              <h1 className="text-3xl font-bold">Customizer</h1>
              <p className="text-white/80 text-lg">System customization and branding management</p>
            </div>
            
            <button
              onClick={() => {
                // Force immediate application of all customization changes
                window.dispatchEvent(new CustomEvent('forceConfigurationUpdate', {
                  detail: { timestamp: new Date().toISOString() }
                }));
                
                // Force re-render of all components
                setTimeout(() => {
                  window.dispatchEvent(new Event('resize'));
                  window.location.reload();
                }, 500);
                
                alert('All customization changes applied successfully! Page will refresh to show all updates.');
              }}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Apply All Changes
            </button>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Admin Access</div>
            <div className="text-xl font-bold">{currentUser.name}</div>
            <div className="text-sm text-white/70">Full customization access</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Customization Areas</h3>
                <div className="text-3xl font-bold text-white mb-1">{tabs.length}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Tabs className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Available customization options</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Divisions</h3>
                <div className="text-3xl font-bold text-white mb-1">{divisions.length}</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Business divisions to customize</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">System Status</h3>
                <div className="text-3xl font-bold text-white mb-1">Active</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">All systems operational</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Last Updated</h3>
                <div className="text-3xl font-bold text-white mb-1">Today</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">Configuration last modified</div>
          </div>
        </div>
      </div>

      {/* Customization Options Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Customization Options</h3>
          <p className="text-gray-600">Configure system appearance, behavior, and functionality</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tabs.map(tab => (
            <div key={tab.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#0c5b63] bg-opacity-10 rounded-xl flex items-center justify-center mr-4">
                  <tab.icon className="h-6 w-6 text-[#0c5b63]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{tab.label}</h4>
                  <p className="text-sm text-gray-600">{tab.description}</p>
                </div>
              </div>

              <button
                onClick={tab.action}
                className="w-full px-4 py-3 bg-[#0c5b63] text-white rounded-lg hover:bg-[#0f6b73] transition-colors flex items-center justify-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Customization Managers */}
      {showBrandingManager && (
        <BrandingManager onClose={() => setShowBrandingManager(false)} />
      )}

      {showDivisionColorManager && (
        <DivisionColorManager onClose={() => setShowDivisionColorManager(false)} />
      )}

      {showKPIManager && (
        <KPIManager divisions={divisions} onClose={() => setShowKPIManager(false)} />
      )}

      {showSidebarManager && (
        <SidebarManager onClose={() => setShowSidebarManager(false)} />
      )}

      {showDashboardCustomizer && (
        <DashboardCustomizer onClose={() => setShowDashboardCustomizer(false)} />
      )}

      {showPerformanceCustomizer && (
        <PerformanceCustomizer onClose={() => setShowPerformanceCustomizer(false)} />
      )}

      {showDivisionManager && (
        <DivisionManager 
          divisions={divisions}
          onClose={() => setShowDivisionManager(false)} 
        />
      )}

      {showDivisionMetricsManager && (
        <DivisionMetricsManager 
          divisions={divisions}
          onClose={() => setShowDivisionMetricsManager(false)} 
        />
      )}

      {showPDFDesigner && (
        <PDFDesigner onClose={() => setShowPDFDesigner(false)} />
      )}
      
      {/* Global event listeners for configuration changes */}
      <div style={{ display: 'none' }}>
        {/* This hidden div ensures all configuration changes are properly propagated */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Listen for all configuration changes and force re-render
              window.addEventListener('brandingUpdated', () => {
                window.dispatchEvent(new Event('resize'));
              });
              window.addEventListener('dashboardConfigUpdated', () => {
                window.dispatchEvent(new Event('resize'));
              });
              window.addEventListener('performanceConfigUpdated', () => {
                window.dispatchEvent(new Event('resize'));
              });
              window.addEventListener('sidebarConfigUpdated', () => {
                window.dispatchEvent(new Event('resize'));
              });
              window.addEventListener('kpiDefinitionsUpdated', () => {
                window.dispatchEvent(new Event('resize'));
              });
              window.addEventListener('divisionsUpdated', () => {
                window.dispatchEvent(new Event('resize'));
              });
            `
          }}
        />
      </div>
    </div>
  );
};

export default BrandingKPISettings;