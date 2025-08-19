import React, { useState } from 'react';
import { Division } from '../types/division';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  Palette, Plus, Edit, Save, X, Trash2, Copy, 
  CheckCircle, AlertCircle, Eye, Settings
} from 'lucide-react';

interface DivisionColorManagerProps {
  divisions?: Division[];
  onClose?: () => void;
}

const DivisionColorManager: React.FC<DivisionColorManagerProps> = ({ divisions = [], onClose }) => {
  const [managedDivisions, setManagedDivisions] = useLocalStorage<Division[]>('divisions', divisions);
  const [showColorForm, setShowColorForm] = useState<boolean>(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [colorForm, setColorForm] = useState<{ color: string }>({
    color: '#f4647d',
  });

  const handleOpenColorForm = (division?: Division) => {
    if (division) {
      setEditingDivision(division);
      setColorForm({ color: division.color });
    } else {
      setEditingDivision(null);
      setColorForm({ color: '#f4647d' });
    }
    setShowColorForm(true);
  };

  const handleSaveColor = () => {
    if (!editingDivision) return;

    const updatedDivision: Division = {
      ...editingDivision,
      color: colorForm.color,
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
    
    alert('Division color updated successfully! Changes will apply immediately.');

    // Force app re-render
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      window.location.reload();
    }, 500);

    setShowColorForm(false);
    setEditingDivision(null);
    setColorForm({ color: '#f4647d' });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Palette className="h-6 w-6 text-[var(--color-primary,#f4647d)] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Division Color Manager</h2>
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Division Color Customization</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Customize colors for each division that appear throughout the application</p>
            <p>• Colors affect employee cards, division badges, and visual indicators</p>
            <p>• Changes are immediately reflected across all pages and components</p>
          </div>
        </div>

        {/* Division Color Grid */}
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
                    <p className="text-sm text-gray-600">Division Color</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenColorForm(division)}
                  className="p-2 text-gray-400 hover:text-[var(--color-primary,#f4647d)] hover:bg-red-100 rounded"
                  title="Edit color"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Color:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded border border-gray-200"
                      style={{ backgroundColor: division.color }}
                    />
                    <span className="text-sm font-mono text-gray-700">{division.color}</span>
                  </div>
                </div>

                {/* Color Preview Examples */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-1">Preview Examples:</div>
                  <div className="flex items-center p-2 bg-gray-50 rounded border-l-4" 
                       style={{ borderLeftColor: division.color }}>
                    <div 
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: division.color }}
                    />
                    <span className="text-xs text-gray-700">Employee Card Style</span>
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
                    <span>Color applied across system</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Employee cards, badges, charts, and indicators
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {managedDivisions.length === 0 && (
          <div className="text-center py-12">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Divisions</h3>
            <p className="text-gray-500 mb-4">Create divisions first to customize their colors</p>
          </div>
        )}

        {/* Color Form Modal */}
        {showColorForm && editingDivision && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
            <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Edit Color for {editingDivision.name}
                </h3>
                <button
                  onClick={() => setShowColorForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Division Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={colorForm.color}
                      onChange={(e) => setColorForm({ color: e.target.value })}
                      className="w-16 h-16 rounded border border-gray-300"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={colorForm.color}
                        onChange={(e) => setColorForm({ color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                        placeholder="#f4647d"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter hex color code</p>
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Color Preview</h4>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-white rounded border-l-4" 
                         style={{ borderLeftColor: colorForm.color }}>
                      <div 
                        className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: colorForm.color }}
                      >
                        {editingDivision.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm text-gray-700">Employee Avatar Style</span>
                    </div>
                    <div className="flex justify-center">
                      <span 
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: `${colorForm.color}20`, 
                          color: colorForm.color 
                        }}
                      >
                        {editingDivision.name} Badge
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowColorForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveColor}
                    className="px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Color
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

export default DivisionColorManager;