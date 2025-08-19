import React, { useState } from 'react';
import { User } from '../types/division';
import { Division, KPIData, KPITarget } from '../types/division';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Settings as SettingsIcon, User as UserIcon, Bell, Shield, Database, Download, Upload, Trash2, FileText, Users, Building2, Plus, Edit, Save, X, Palette, Target, Calendar, Activity } from 'lucide-react';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
import { useFormValidation } from '../hooks/useFormValidation';
import Reports from './Reports';
import UserManagement from './UserManagement';

interface ZenotiConfig {
  baseUrl: string;
  apiKey: string;
  organizationId: string;
  centerId?: string;
  timeout: number;
  apiLevel: 'organization' | 'center';
}

interface SettingsProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  divisions?: Division[];
  kpiData?: KPIData[];
  targets?: KPITarget[];
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser, divisions = [], kpiData = [], targets = [] }) => {
  const { isLoading, error, execute } = useAsyncOperation();
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState('profile');
  const [userForm, setUserForm] = useState<User>(currentUser);
  const [zenotiConfig, setZenotiConfig] = useLocalStorage<ZenotiConfig>('zenotiConfig', {
    baseUrl: 'https://api.zenoti.com/v1',
    apiKey: '',
    organizationId: '',
    centerId: '',
    timeout: 30000,
    apiLevel: 'organization',
  });
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    performanceAlerts: true,
    weeklyReports: false,
    monthlyReports: true,
  });

  // Division Management State
  const [managedDivisions, setManagedDivisions] = useLocalStorage<Division[]>('divisions', divisions);
  const [showDivisionForm, setShowDivisionForm] = useState<boolean>(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [divisionForm, setDivisionForm] = useState<Partial<Division>>({
    name: '',
    color: '#f4647d',
  });

  const validationRules = {
    name: [
      { required: true, message: 'Name is required' },
      { minLength: 2, message: 'Name must be at least 2 characters' },
    ],
    email: [
      { required: true, message: 'Email is required' },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
    ],
    divisionName: [
      { required: true, message: 'Division name is required' },
      { minLength: 2, message: 'Division name must be at least 2 characters' },
    ],
  };
  
  const { errors, validateForm } = useFormValidation(validationRules);

  // Calculate settings metrics
  const settingsMetrics = {
    totalDivisions: managedDivisions.length,
    userRole: currentUser.role,
    notificationsEnabled: Object.values(notifications).filter(Boolean).length,
    dataStorage: 'Local Browser Storage',
  };

  const handleZenotiConfigChange = (field: keyof ZenotiConfig, value: string | number) => {
    setZenotiConfig(prev => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  };

  const handleSaveZenotiConfig = async () => {
    await execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return 'Configuration saved';
    }, () => {
      setConnectionStatus({
        type: 'success',
        message: 'Zenoti configuration saved successfully!'
      });
      
      setTimeout(() => {
        setConnectionStatus({ type: null, message: '' });
      }, 3000);
    });
  };

  const handleTestZenotiConnection = async () => {
    if (!zenotiConfig.apiKey || (!zenotiConfig.organizationId && !zenotiConfig.centerId)) {
      setConnectionStatus({
        type: 'error',
        message: 'Please provide API Key and either Organization ID or Center ID before testing connection.'
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus({ type: 'info', message: 'Testing connection to Zenoti API...' });

    try {
      const testEndpoints = [];
      
      if (zenotiConfig.apiLevel === 'organization' && zenotiConfig.organizationId) {
        testEndpoints.push({
          name: 'Organization Info',
          url: `${zenotiConfig.baseUrl}/organizations/${zenotiConfig.organizationId}`,
          headers: {
            'Authorization': `Bearer ${zenotiConfig.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Organization-Id': zenotiConfig.organizationId,
          }
        });
      } else if (zenotiConfig.centerId) {
        testEndpoints.push({
          name: 'Center Info',
          url: `${zenotiConfig.baseUrl}/centers/${zenotiConfig.centerId}`,
          headers: {
            'Authorization': `Bearer ${zenotiConfig.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Center-Id': zenotiConfig.centerId,
          }
        });
      }

      let successfulEndpoint = null;

      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(endpoint.url, {
            method: 'GET',
            headers: endpoint.headers,
            signal: AbortSignal.timeout(zenotiConfig.timeout),
          });

          if (response.ok) {
            const responseData = await response.json();
            successfulEndpoint = { ...endpoint, data: responseData };
            break;
          }
        } catch (endpointError) {
          console.log(`${endpoint.name} Exception:`, endpointError);
        }
      }

      if (successfulEndpoint) {
        setConnectionStatus({
          type: 'success',
          message: `✅ Successfully connected via ${successfulEndpoint.name}!`
        });
      } else {
        setConnectionStatus({
          type: 'error',
          message: 'Connection failed. Please check your API credentials and configuration.'
        });
      }
    } catch (error) {
      setConnectionStatus({
        type: 'error',
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveProfile = async () => {
    const formValidationData = { name: userForm.name, email: userForm.email };
    
    if (!validateForm(formValidationData)) {
      return;
    }

    await execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return userForm;
    }, (savedUser) => {
      onUpdateUser(savedUser);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    });
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      user: currentUser.name,
      divisions: managedDivisions,
      message: 'Data export functionality would be implemented here'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `true-balance-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Division Management Functions
  const handleOpenDivisionForm = (division?: Division) => {
    if (division) {
      setEditingDivision(division);
      setDivisionForm(division);
    } else {
      setEditingDivision(null);
      setDivisionForm({
        name: '',
        color: '#f4647d',
      });
    }
    setShowDivisionForm(true);
  };

  const handleSaveDivision = async () => {
    const formValidationData = { divisionName: divisionForm.name };
    
    if (!validateForm(formValidationData)) {
      return;
    }

    await execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (editingDivision) {
        // Update existing division
        const updatedDivision: Division = {
          ...editingDivision,
          name: divisionForm.name!,
          color: divisionForm.color!,
        };
        
        setManagedDivisions(prev => prev.map(div => 
          div.id === editingDivision.id ? updatedDivision : div
        ));
        
        return updatedDivision;
      } else {
        // Create new division
        const newDivision: Division = {
          id: `div-${Date.now()}`,
          name: divisionForm.name!,
          color: divisionForm.color!,
        };
        
        setManagedDivisions(prev => [...prev, newDivision]);
        
        return newDivision;
      }
    }, (savedDivision) => {
      // Dispatch events to update all components
      window.dispatchEvent(new CustomEvent('divisionsUpdated', {
        detail: { divisions: managedDivisions }
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'divisions',
        newValue: JSON.stringify(managedDivisions),
        storageArea: localStorage
      }));
      
      setSuccessMessage(`Division ${editingDivision ? 'updated' : 'created'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowDivisionForm(false);
      setEditingDivision(null);
      setDivisionForm({ name: '', color: '#f4647d' });
    });
  };

  const handleDeleteDivision = async (division: Division) => {
    if (!window.confirm(`Are you sure you want to delete "${division.name}"? This action cannot be undone and may affect employee assignments.`)) {
      return;
    }

    await execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setManagedDivisions(prev => prev.filter(div => div.id !== division.id));
      
      return division;
    }, () => {
      // Dispatch events to update all components
      window.dispatchEvent(new CustomEvent('divisionsUpdated', {
        detail: { divisions: managedDivisions.filter(div => div.id !== division.id) }
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'divisions',
        newValue: JSON.stringify(managedDivisions.filter(div => div.id !== division.id)),
        storageArea: localStorage
      }));
      
      setSuccessMessage(`Division "${division.name}" deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'divisions', label: 'Division Management', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'exports', label: 'Exports', icon: FileText },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Template Design */}
      <div className="bg-gradient-to-r from-[#0c5b63] to-[#0f6b73] rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-white/80 text-lg">System configuration and management</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-white/80 mb-1">Current User</div>
            <div className="text-xl font-bold">{currentUser.name}</div>
            <div className="text-sm text-white/70 capitalize">
              {currentUser.role.replace('-', ' ')}
            </div>
          </div>
        </div>

        {/* Settings KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Total Divisions</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {settingsMetrics.totalDivisions}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">
              Active business divisions
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">User Role</h3>
                <div className="text-3xl font-bold text-white mb-1 capitalize">
                  {settingsMetrics.userRole.replace('-', ' ')}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">
              Access level and permissions
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Notifications</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {settingsMetrics.notificationsEnabled}
                </div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">
              Active notification types
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white/80 mb-2">Data Storage</h3>
                <div className="text-3xl font-bold text-white mb-1">Local</div>
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70">
              Browser-based storage
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-[#0c5b63] text-[#0c5b63]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                />
                {errors.name && (
                  <div className="mt-1 text-sm text-red-600">
                    {errors.name[0]}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                />
                {errors.email && (
                  <div className="mt-1 text-sm text-red-600">
                    {errors.email[0]}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  disabled={currentUser.role !== 'admin'}
                >
                  <option value="admin">Administrator</option>
                  <option value="division-manager">Division Manager</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={userForm.id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">{successMessage}</div>
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm text-red-800">Error: {error}</div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="px-4 py-2 bg-[#0c5b63] text-white rounded-md hover:bg-[#0f6b73] focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                type="button"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'divisions' && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Division Management Moved</h3>
            <p className="text-gray-500 mb-4">
              Division management is now available in the Customizer section for better organization.
            </p>
            <p className="text-sm text-blue-600">
              Navigate to Customizer → Division Management to create and manage divisions.
            </p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email Alerts</h4>
                  <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                  className="h-4 w-4 text-[#0c5b63] focus:ring-[#0c5b63] border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Performance Alerts</h4>
                  <p className="text-sm text-gray-500">Get notified when performance drops below targets</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.performanceAlerts}
                  onChange={(e) => setNotifications(prev => ({ ...prev, performanceAlerts: e.target.checked }))}
                  className="h-4 w-4 text-[#0c5b63] focus:ring-[#0c5b63] border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
                  <p className="text-sm text-gray-500">Receive weekly performance summaries</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.weeklyReports}
                  onChange={(e) => setNotifications(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                  className="h-4 w-4 text-[#0c5b63] focus:ring-[#0c5b63] border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Monthly Reports</h4>
                  <p className="text-sm text-gray-500">Receive monthly performance reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.monthlyReports}
                  onChange={(e) => setNotifications(prev => ({ ...prev, monthlyReports: e.target.checked }))}
                  className="h-4 w-4 text-[#0c5b63] focus:ring-[#0c5b63] border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-[#0c5b63] mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Zenoti API Configuration</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Level
                  </label>
                  <select
                    value={zenotiConfig.apiLevel}
                    onChange={(e) => handleZenotiConfigChange('apiLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  >
                    <option value="organization">Organization Level</option>
                    <option value="center">Center Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={zenotiConfig.apiKey}
                    onChange={(e) => handleZenotiConfigChange('apiKey', e.target.value)}
                    placeholder="Enter your Zenoti API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  />
                </div>

                {zenotiConfig.apiLevel === 'organization' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization ID *
                    </label>
                    <input
                      type="text"
                      value={zenotiConfig.organizationId}
                      onChange={(e) => handleZenotiConfigChange('organizationId', e.target.value)}
                      placeholder="e.g., 12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Center ID *
                    </label>
                    <input
                      type="text"
                      value={zenotiConfig.centerId || ''}
                      onChange={(e) => handleZenotiConfigChange('centerId', e.target.value)}
                      placeholder="e.g., 67890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Connection Status
                  </label>
                  <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      connectionStatus.type === 'success' ? 'bg-green-500' :
                      connectionStatus.type === 'error' ? 'bg-red-500' :
                      connectionStatus.type === 'info' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-gray-700">
                      {connectionStatus.type === 'success' ? 'Connected' :
                       connectionStatus.type === 'error' ? 'Connection Failed' :
                       connectionStatus.type === 'info' ? 'Testing...' :
                       'Not Connected'}
                    </span>
                  </div>
                </div>
              </div>

              {connectionStatus.message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${
                  connectionStatus.type === 'success' ? 'bg-green-100 text-green-800' :
                  connectionStatus.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {connectionStatus.type === 'success' ? '✓' :
                   connectionStatus.type === 'error' ? '✗' :
                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />}
                  <span className="text-sm ml-2">{connectionStatus.message}</span>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleTestZenotiConnection}
                  disabled={isTestingConnection || !zenotiConfig.apiKey}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isTestingConnection ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleSaveZenotiConfig}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-[#0c5b63] text-white rounded-md hover:bg-[#0f6b73]"
                  type="button"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exports' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Reports & Exports</h3>
            <Reports
              kpiData={kpiData}
              divisions={managedDivisions}
              targets={targets}
            />
          </div>
        )}

        {activeTab === 'user-management' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            <UserManagement
              currentUser={currentUser}
              divisions={managedDivisions}
            />
          </div>
        )}

        {activeTab === 'user-management' && currentUser.role !== 'admin' && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Only administrators can access user management settings.
            </p>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-r from-[#0c5b63] to-[#0f6b73] rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-90">Export Data</p>
                    <p className="text-lg font-bold">Backup & Analysis</p>
                  </div>
                  <Download className="h-12 w-12 opacity-80" />
                </div>
                <button
                  onClick={handleExportData}
                  className="w-full px-4 py-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-all duration-200"
                >
                  Export Data
                </button>
              </div>

              <div className="bg-gradient-to-r from-[#0c5b63] to-[#0f6b73] rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-90">Import Data</p>
                    <p className="text-lg font-bold">Restore Backup</p>
                  </div>
                  <Upload className="h-12 w-12 opacity-80" />
                </div>
                <input
                  type="file"
                  accept=".json"
                  className="w-full px-3 py-2 bg-white bg-opacity-20 text-white rounded-md placeholder-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-100"
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90">Danger Zone</p>
                  <p className="text-lg font-bold">Clear All Data</p>
                </div>
                <Trash2 className="h-12 w-12 opacity-80" />
              </div>
              <p className="text-sm opacity-90 mb-4">
                This action cannot be undone and will remove all application data.
              </p>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-all duration-200"
              >
                Clear All Data
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Data Storage Information</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• All data is stored locally in your browser</p>
                <p>• Data persists between sessions</p>
                <p>• No data is sent to external servers</p>
                <p>• Clear browser data to reset the application</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Division Form Modal */}
      {showDivisionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDivision ? 'Edit Division' : 'Add New Division'}
              </h3>
              <button
                onClick={() => setShowDivisionForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Division Name *</label>
                <input
                  type="text"
                  value={divisionForm.name || ''}
                  onChange={(e) => setDivisionForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                  placeholder="Enter division name"
                />
                {errors.divisionName && (
                  <div className="mt-1 text-sm text-red-600">
                    {errors.divisionName[0]}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Division Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={divisionForm.color || '#f4647d'}
                    onChange={(e) => setDivisionForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-12 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={divisionForm.color || '#f4647d'}
                    onChange={(e) => setDivisionForm(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0c5b63]"
                    placeholder="#f4647d"
                  />
                </div>
              </div>

              {/* Color Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Color Preview</h4>
                <div className="space-y-2">
                  <div className="flex items-center p-2 bg-white rounded border-l-4" 
                       style={{ borderLeftColor: divisionForm.color }}>
                    <div 
                      className="w-6 h-6 rounded-full mr-2"
                      style={{ backgroundColor: divisionForm.color }}
                    />
                    <span className="text-sm text-gray-700">Employee Card Style</span>
                  </div>
                  <div className="flex justify-center">
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${divisionForm.color}20`, 
                        color: divisionForm.color 
                      }}
                    >
                      Division Badge Style
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDivisionForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDivision}
                  disabled={isLoading || !divisionForm.name}
                  className="px-4 py-2 bg-[#0c5b63] text-white rounded-md hover:bg-[#0f6b73] disabled:bg-gray-400 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingDivision ? 'Update Division' : 'Create Division'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;