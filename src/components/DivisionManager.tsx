import React, { useState } from 'react';
import { Division } from '../types/division';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  Building2, Plus, Edit, Save, X, Trash2, Copy, 
  CheckCircle, AlertCircle, Palette, Eye, Settings
} from 'lucide-react';

interface DivisionManagerProps {
  divisions: Division[];
  onClose?: () => void;
}

const DivisionManager: React.FC<DivisionManagerProps> = ({ divisions, onClose }) => {
  const [managedDivisions, setManagedDivisions] = useLocalStorage<Division[]>('divisions', divisions);
  const [showDivisionForm, setShowDivisionForm] = useState<boolean>(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [divisionForm, setDivisionForm] = useState<Partial<Division>>({
    name: '',
    color: '#f4647d',
  });

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

  const handleSaveDivision = () => {
    if (!divisionForm.name) {
      alert('Please provide a division name');
      return;
    }

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
      
      // Force immediate update of all components
      const updatedDivisions = managedDivisions.map(div => 
        div.id === editingDivision.id ? updatedDivision : div
      );
      
      // Dispatch comprehensive events
      window.dispatchEvent(new CustomEvent('divisionsUpdated', {
        detail: { divisions: updatedDivisions }
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'divisions',
        newValue: JSON.stringify(updatedDivisions),
        storageArea: localStorage
      }));
      
      // Force immediate localStorage save
      try {
        localStorage.setItem('divisions', JSON.stringify(updatedDivisions));
      } catch (error) {
        console.error('Error saving divisions:', error);
      }
      
      alert('Division updated successfully! Changes will apply immediately.');
    } else {
      // Create new division
      const newDivision: Division = {
        id: `div-${Date.now()}`,
        name: divisionForm.name!,
        color: divisionForm.color!,
      };
      
      setManagedDivisions(prev => [...prev, newDivision]);
      
      // Force immediate update of all components
      const updatedDivisions = [...managedDivisions, newDivision];
      
      // Dispatch comprehensive events
      window.dispatchEvent(new CustomEvent('divisionsUpdated', {
        detail: { divisions: updatedDivisions }
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'divisions',
        newValue: JSON.stringify(updatedDivisions),
        storageArea: localStorage
      }));
      
      // Force immediate localStorage save
      try {
        localStorage.setItem('divisions', JSON.stringify(updatedDivisions));
      } catch (error) {
        console.error('Error saving divisions:', error);
      }
      
      alert('Division created successfully! Changes will apply immediately.');
    }

    // Force app re-render
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      window.location.reload(); // Force full reload for division changes
    }, 500);

    setShowDivisionForm(false);
    setEditingDivision(null);
    setDivisionForm({ name: '', color: '#f4647d' });
  };

  const handleDeleteDivision = (division: Division) => {
    if (!window.confirm(`Are you sure you want to delete "${division.name}"? This action cannot be undone and may affect employee assignments.`)) {
      return;
    }

    setManagedDivisions(prev => prev.filter(div => div.id !== division.id));
    
    // Force immediate update of all components
    const updatedDivisions = managedDivisions.filter(div => div.id !== division.id);
    
    window.dispatchEvent(new CustomEvent('divisionsUpdated', {
      detail: { divisions: updatedDivisions }
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'divisions',
      newValue: JSON.stringify(updatedDivisions),
      storageArea: localStorage
    }));
    
    // Force immediate localStorage save
    try {
      localStorage.setItem('divisions', JSON.stringify(updatedDivisions));
    } catch (error) {
      console.error('Error saving divisions:', error);
    }
    
    alert('Division deleted successfully! Changes will apply immediately.');
    
    // Force app re-render
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      window.location.reload();
    }, 500);
  };

  const duplicateDivision = (division: Division) => {
    const duplicated = {
      ...division,
      id: `div-${Date.now()}`,
      name: `${division.name} (Copy)`,
    };
    
    setManagedDivisions(prev => [...prev, duplicated]);
    
    // Force immediate update
    const updatedDivisions = [...managedDivisions, duplicated];
    
    window.dispatchEvent(new CustomEvent('divisionsUpdated', {
      detail: { divisions: updatedDivisions }
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'divisions',
      newValue: JSON.stringify(updatedDivisions),
      storageArea: localStorage
    }));
    
    try {
      localStorage.setItem('divisions', JSON.stringify(updatedDivisions));
    } catch (error) {
      console.error('Error saving divisions:', error);
    }
    
    alert('Division duplicated successfully! Page will refresh to show changes.');
    
    // Force app re-render
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-[var(--color-primary,#f4647d)] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Division Management</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleOpenDivisionForm()}
              className="flex items-center px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Division
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
          <h4 className="text-sm font-medium text-blue-900 mb-2">Division Management System</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Create and manage business divisions that flow through all system pages</p>
            <p>• Divisions automatically appear in Daily Data, Employee KPIs, and Business KPIs</p>
            <p>• Color customization affects all division displays across the application</p>
            <p>• Changes are immediately reflected in navigation and data entry forms</p>
          </div>
        </div>

        {/* Division Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managedDivisions.map(division => (
            <div key={division.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mr-4"
                    style={{ backgroundColor: division.color }}
                  >
                    {division.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{division.name}</h4>
                    <p className="text-sm text-gray-600">ID: {division.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => duplicateDivision(division)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                    title="Duplicate division"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDivisionForm(division)}
                    className="p-2 text-gray-400 hover:text-[var(--color-primary,#f4647d)] hover:bg-red-100 rounded"
                    title="Edit division"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDivision(division)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                    title="Delete division"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Color:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: division.color }}
                    />
                    <span className="text-sm font-mono text-gray-700">{division.color}</span>
                  </div>
                </div>

                {/* Usage Examples */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-1">Usage Examples:</div>
                  <div className="flex items-center p-2 bg-gray-50 rounded border-l-4" 
                       style={{ borderLeftColor: division.color }}>
                    <div 
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: division.color }}
                    />
                    <span className="text-xs text-gray-700">Employee Card</span>
                  </div>
                  <div className="flex justify-center">
                    <span 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${division.color}20`, 
                        color: division.color 
                      }}
                    >
                      Division Badge
                    </span>
                  </div>
                </div>

                {/* System Integration Status */}
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-center text-sm text-green-800">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Integrated across all pages</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Available in Daily Data, Employee KPIs, Business KPIs
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {managedDivisions.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Divisions</h3>
            <p className="text-gray-500 mb-4">Create your first division to get started</p>
            <button
              onClick={() => handleOpenDivisionForm()}
              className="px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
            >
              Add First Division
            </button>
          </div>
        )}

        {/* Division Form Modal */}
        {showDivisionForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    placeholder="Enter division name"
                  />
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
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

                {/* System Integration Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">System Integration</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>✓ Automatically appears in Daily Data entry forms</p>
                    <p>✓ Available for Employee KPI data entry</p>
                    <p>✓ Included in Business KPI tracking</p>
                    <p>✓ Employee assignment and filtering</p>
                    <p>✓ Performance reporting and analytics</p>
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
                    disabled={!divisionForm.name}
                    className="px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingDivision ? 'Update Division' : 'Create Division'}
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

export default DivisionManager;