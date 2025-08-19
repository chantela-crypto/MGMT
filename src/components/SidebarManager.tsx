import React, { useState } from 'react';
import { SidebarMenuItem } from '../types/branding';
import { useSidebarConfig } from '../hooks/useSidebarConfig';
import { 
  Menu, Plus, Edit, Trash2, Save, X, Eye, EyeOff, 
  GripVertical, ChevronDown, ChevronRight, Folder, 
  FileText, RotateCcw, Copy, Minus, ChevronUp, FolderPlus,
  ArrowUp, ArrowDown, Move
} from 'lucide-react';

interface SidebarManagerProps {
  onClose?: () => void;
}

interface DragState {
  draggedItem: SidebarMenuItem | null;
  dragOverItem: SidebarMenuItem | null;
  dragPosition: 'above' | 'below' | 'inside' | null;
}

const SidebarManager: React.FC<SidebarManagerProps> = ({ onClose }) => {
  const {
    sidebarConfig,
    getMenuHierarchy,
    updateMenuItem,
    addMenuItem,
    addSeparator,
    removeMenuItem,
    reorderMenuItems,
    promoteToMain,
    demoteToSub,
    resetToDefault,
  } = useSidebarConfig();

  const [editingItem, setEditingItem] = useState<SidebarMenuItem | null>(null);
  const [showItemForm, setShowItemForm] = useState<boolean>(false);
  const [showSubpageForm, setShowSubpageForm] = useState<boolean>(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [itemForm, setItemForm] = useState<Partial<SidebarMenuItem>>({
    label: '',
    isFolder: false,
    isSeparator: false,
    isVisible: true,
    sortOrder: 100,
    isCustom: true,
    canPromoteToMain: false,
    canDemoteToSub: false,
  });
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    dragOverItem: null,
    dragPosition: null,
  });

  const menuHierarchy = getMenuHierarchy();

  const handleEditItem = (item: SidebarMenuItem) => {
    setEditingItem(item);
    setItemForm(item);
    setShowItemForm(true);
  };

  const handleSaveItem = () => {
    if (editingItem) {
      updateMenuItem(editingItem.id, itemForm);
      alert('Menu item updated successfully! Changes will apply immediately.');
    } else {
      if (!itemForm.label) {
        alert('Please provide a label for the menu item');
        return;
      }
      
      const newItem: Omit<SidebarMenuItem, 'id'> = {
        label: itemForm.label,
        originalLabel: itemForm.label,
        isFolder: itemForm.isFolder || false,
        isSeparator: itemForm.isSeparator || false,
        parentId: selectedParentId || undefined,
        isVisible: itemForm.isVisible !== false,
        sortOrder: itemForm.sortOrder || 100,
        isCustom: true,
        route: itemForm.isFolder || itemForm.isSeparator ? undefined : itemForm.route,
        canPromoteToMain: itemForm.canPromoteToMain || false,
        canDemoteToSub: itemForm.canDemoteToSub || false,
      };
      
      try {
        addMenuItem(newItem);
        alert('Menu item added successfully!');
      } catch (error) {
        alert(`Error adding menu item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
    }
    
    setShowItemForm(false);
    setShowSubpageForm(false);
    setEditingItem(null);
    setSelectedParentId('');
    setItemForm({
      label: '',
      isFolder: false,
      isSeparator: false,
      isVisible: true,
      sortOrder: 100,
      isCustom: true,
      canPromoteToMain: false,
      canDemoteToSub: false,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    const item = sidebarConfig.menuItems.find(i => i.id === itemId);
    if (item && window.confirm(`Are you sure you want to delete "${item.label}"?`)) {
      removeMenuItem(itemId);
      alert('Menu item deleted successfully! Changes will apply immediately.');
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleAddSubpage = (parentId: string) => {
    setSelectedParentId(parentId);
    setItemForm({
      label: '',
      isFolder: false,
      isSeparator: false,
      isVisible: true,
      sortOrder: 100,
      isCustom: true,
      canPromoteToMain: true,
      canDemoteToSub: false,
      parentId: parentId,
    });
    setShowSubpageForm(true);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, item: SidebarMenuItem) => {
    setDragState(prev => ({ ...prev, draggedItem: item }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', item.id);
  };

  const handleDragOver = (e: React.DragEvent, item: SidebarMenuItem) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    let position: 'above' | 'below' | 'inside' = 'below';
    
    if (item.isFolder) {
      if (y < height * 0.25) {
        position = 'above';
      } else if (y > height * 0.75) {
        position = 'below';
      } else {
        position = 'inside';
      }
    } else {
      position = y < height * 0.5 ? 'above' : 'below';
    }
    
    setDragState(prev => ({
      ...prev,
      dragOverItem: item,
      dragPosition: position,
    }));
  };

  const handleDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dragOverItem: null,
      dragPosition: null,
    }));
  };

  const handleDrop = (e: React.DragEvent, targetItem: SidebarMenuItem) => {
    e.preventDefault();
    
    const { draggedItem, dragPosition } = dragState;
    if (!draggedItem || !dragPosition || draggedItem.id === targetItem.id) {
      setDragState({ draggedItem: null, dragOverItem: null, dragPosition: null });
      return;
    }

    // Calculate new sort order and parent
    let newParentId = targetItem.parentId;
    let newSortOrder = targetItem.sortOrder;

    if (dragPosition === 'above') {
      newSortOrder = targetItem.sortOrder - 0.5;
    } else if (dragPosition === 'below') {
      newSortOrder = targetItem.sortOrder + 0.5;
    } else if (dragPosition === 'inside' && targetItem.isFolder) {
      newParentId = targetItem.id;
      newSortOrder = 1000; // Place at end of folder
    }

    // Update the dragged item
    updateMenuItem(draggedItem.id, {
      parentId: newParentId,
      sortOrder: newSortOrder,
    });

    // Reorder items to clean up sort orders
    const parentItems = sidebarConfig.menuItems
      .filter(item => item.parentId === newParentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    parentItems.forEach((item, index) => {
      updateMenuItem(item.id, { sortOrder: (index + 1) * 10 });
    });

    setDragState({ draggedItem: null, dragOverItem: null, dragPosition: null });
  };

  const getDragOverStyle = (item: SidebarMenuItem) => {
    if (dragState.dragOverItem?.id !== item.id) return {};
    
    switch (dragState.dragPosition) {
      case 'above':
        return { borderTop: '2px solid #f4647d' };
      case 'below':
        return { borderBottom: '2px solid #f4647d' };
      case 'inside':
        return { backgroundColor: '#f4647d20', border: '2px dashed #f4647d' };
      default:
        return {};
    }
  };

  const renderMenuItem = (item: SidebarMenuItem, level: number = 0) => {
    if (!item.isVisible && !editingItem) return null;

    // Render separator
    if (item.isSeparator) {
      return (
        <li key={item.id}>
          <div 
            className="flex items-center justify-between p-2 mx-4 hover:bg-gray-50 rounded"
            style={{ marginLeft: `${level * 16}px`, ...getDragOverStyle(item) }}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item)}
          >
            <div className="flex items-center flex-1">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move mr-2" />
              <hr className="flex-1 border-gray-300" />
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                title="Delete separator"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </li>
      );
    }
    
    const isExpanded = expandedFolders[item.id];
    const hasChildren = item.isFolder && item.children && item.children.length > 0;
    
    return (
      <div key={item.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div 
          className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
            item.isVisible ? 'bg-white border-gray-200 hover:border-gray-300' : 'bg-gray-50 border-gray-300 opacity-60'
          } ${dragState.draggedItem?.id === item.id ? 'opacity-50' : ''}`}
          style={getDragOverStyle(item)}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => handleDragOver(e, item)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item)}
        >
          <div className="flex items-center space-x-3">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
            
            {item.isFolder ? (
              <div className="flex items-center">
                <button
                  onClick={() => toggleFolder(item.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                <Folder className="h-4 w-4 text-blue-500 mr-2" />
              </div>
            ) : (
              <FileText className="h-4 w-4 text-gray-500 mr-2" />
            )}
            
            <div>
              <div className="font-medium text-gray-900">{item.label}</div>
              {item.originalLabel !== item.label && (
                <div className="text-xs text-gray-500">Originally: {item.originalLabel}</div>
              )}
              <div className="flex items-center space-x-2 mt-1">
                {item.isCustom && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Custom
                  </span>
                )}
                {item.parentId && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Subpage
                  </span>
                )}
                {level > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Level {level + 1}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Add Subpage button for folders */}
            {item.isFolder && (
              <button
                onClick={() => handleAddSubpage(item.id)}
                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded"
                title="Add subpage to this folder"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            )}

            {/* Promote/Demote buttons */}
            {item.canPromoteToMain && item.parentId && (
              <button
                onClick={() => promoteToMain(item.id)}
                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded"
                title="Move to main navigation"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            )}
            
            {item.canDemoteToSub && !item.parentId && (
              <button
                onClick={() => {
                  const folders = sidebarConfig.menuItems.filter(i => i.isFolder);
                  if (folders.length > 0) {
                    demoteToSub(item.id, folders[0].id);
                  }
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                title="Move to sub-navigation"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => toggleItemVisibility(item.id)}
              className={`p-1 rounded ${
                item.isVisible ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={item.isVisible ? 'Hide item' : 'Show item'}
            >
              {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            
            <button
              onClick={() => duplicateItem(item)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
              title="Duplicate item"
            >
              <Copy className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => handleEditItem(item)}
              className="p-1 text-gray-400 hover:text-[var(--color-primary,#f4647d)] hover:bg-red-100 rounded"
              title="Edit item"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            {item.isCustom && (
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                title="Delete item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Render children if folder is expanded */}
        {item.isFolder && isExpanded && item.children && (
          <div className="mt-2 space-y-2">
            {item.children.map((childId: string) => {
              const childItem = sidebarConfig.menuItems.find(i => i.id === childId);
              return childItem ? renderMenuItem(childItem, level + 1) : null;
            })}
            
            {/* Add Subpage button at bottom of folder */}
            <div className="ml-6">
              <button
                onClick={() => handleAddSubpage(item.id)}
                className="flex items-center w-full p-2 text-gray-500 hover:text-[var(--color-primary,#f4647d)] hover:bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-[var(--color-primary,#f4647d)] transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-sm">Add subpage to {item.label}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Menu className="h-6 w-6 text-[var(--color-primary,#f4647d)] mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Sidebar Menu Manager</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowItemForm(true)}
              className="flex items-center px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </button>
            
            <button
              onClick={() => addSeparator()}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Minus className="h-4 w-4 mr-2" />
              Add Separator
            </button>
            
            <button
              onClick={resetToDefault}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </button>
            
            <button
              onClick={() => {
                // Force immediate application of all sidebar changes
                window.dispatchEvent(new CustomEvent('sidebarConfigUpdated', {
                  detail: sidebarConfig
                }));
                
                try {
                  localStorage.setItem('sidebarConfig', JSON.stringify(sidebarConfig));
                } catch (error) {
                  console.error('Error applying sidebar config:', error);
                }
                
                alert('Sidebar configuration applied successfully! Page will refresh to show changes.');
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Changes
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

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Enhanced Sidebar Customization</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Drag & Drop:</strong> Drag menu items to reorder or move between folders</p>
            <p>• <strong>Subpages:</strong> Add subpages to folders using the folder+ icon or "Add subpage" button</p>
            <p>• <strong>Multi-level Navigation:</strong> Create nested folder structures up to 3 levels deep</p>
            <p>• <strong>Visual Feedback:</strong> Drop zones show above, below, or inside folder placement</p>
            <p>• <strong>Auto-sorting:</strong> Items are automatically renumbered after drag operations</p>
            <p>• <strong>Promote/Demote:</strong> Move items between main navigation and subpages</p>
          </div>
        </div>

        {/* Drag & Drop Instructions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-green-900 mb-2">Drag & Drop Instructions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-800">
            <div>
              <div className="flex items-center mb-1">
                <Move className="h-4 w-4 mr-1" />
                <strong>Reorder Items</strong>
              </div>
              <p>Drag above or below other items to change order</p>
            </div>
            <div>
              <div className="flex items-center mb-1">
                <Folder className="h-4 w-4 mr-1" />
                <strong>Move to Folder</strong>
              </div>
              <p>Drag onto a folder to make it a subpage</p>
            </div>
            <div>
              <div className="flex items-center mb-1">
                <ArrowUp className="h-4 w-4 mr-1" />
                <strong>Promote to Main</strong>
              </div>
              <p>Drag to root level or use promote button</p>
            </div>
          </div>
        </div>

        {/* Menu Structure */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Menu Structure</h3>
            <div className="text-sm text-gray-600">
              {sidebarConfig.menuItems.filter(item => item.isVisible).length} visible items • 
              {sidebarConfig.menuItems.filter(item => item.parentId).length} subpages
            </div>
          </div>

          <div className="space-y-3">
            {menuHierarchy.map(item => renderMenuItem(item))}
          </div>
        </div>

        {/* Menu Item Form Modal */}
        {(showItemForm || showSubpageForm) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
            <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Menu Item' : 
                   showSubpageForm ? 'Add New Subpage' : 'Add New Menu Item'}
                </h3>
                <button
                  onClick={() => {
                    setShowItemForm(false);
                    setShowSubpageForm(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Label *</label>
                    <input
                      type="text"
                      value={itemForm.label || ''}
                      onChange={(e) => setItemForm(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                      placeholder="Enter menu label"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Route (for pages)</label>
                    <input
                      type="text"
                      value={itemForm.route || ''}
                      onChange={(e) => setItemForm(prev => ({ ...prev, route: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                      placeholder="page-route-name"
                      disabled={itemForm.isFolder}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parent Folder</label>
                    <select
                      value={itemForm.parentId || selectedParentId || ''}
                      onChange={(e) => setItemForm(prev => ({ ...prev, parentId: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                      disabled={showSubpageForm}
                    >
                      <option value="">Root Level</option>
                      {sidebarConfig.menuItems
                        .filter(item => item.isFolder && item.id !== itemForm.id)
                        .map(folder => (
                          <option key={folder.id} value={folder.id}>
                            {folder.label}
                          </option>
                        ))}
                    </select>
                    {showSubpageForm && selectedParentId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Adding to: {sidebarConfig.menuItems.find(i => i.id === selectedParentId)?.label}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                    <input
                      type="number"
                      value={itemForm.sortOrder || 100}
                      onChange={(e) => setItemForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 100 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#f4647d)]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={itemForm.isFolder || false}
                      onChange={(e) => setItemForm(prev => ({ 
                        ...prev, 
                        isFolder: e.target.checked,
                        isSeparator: false,
                        route: e.target.checked ? undefined : prev.route
                      }))}
                      className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                      disabled={showSubpageForm}
                    />
                    <label className="ml-2 text-sm text-gray-700">This is a folder (contains other items)</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={itemForm.isSeparator || false}
                      onChange={(e) => setItemForm(prev => ({ 
                        ...prev, 
                        isSeparator: e.target.checked,
                        isFolder: false,
                        route: undefined,
                        label: e.target.checked ? '---' : prev.label
                      }))}
                      className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                      disabled={showSubpageForm}
                    />
                    <label className="ml-2 text-sm text-gray-700">This is a separator line</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={itemForm.isVisible !== false}
                      onChange={(e) => setItemForm(prev => ({ ...prev, isVisible: e.target.checked }))}
                      className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Visible in sidebar</label>
                  </div>

                  {!itemForm.isFolder && !itemForm.isSeparator && (
                    <>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={itemForm.canPromoteToMain || false}
                          onChange={(e) => setItemForm(prev => ({ ...prev, canPromoteToMain: e.target.checked }))}
                          className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Can be promoted to main navigation</label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={itemForm.canDemoteToSub || false}
                          onChange={(e) => setItemForm(prev => ({ ...prev, canDemoteToSub: e.target.checked }))}
                          className="h-4 w-4 text-[var(--color-primary,#f4647d)] focus:ring-[var(--color-primary,#f4647d)] border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Can be demoted to sub-navigation</label>
                      </div>
                    </>
                  )}
                </div>

                {/* Subpage-specific options */}
                {(showSubpageForm || itemForm.parentId) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Subpage Configuration</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>• This item will appear as a subpage under the selected folder</p>
                      <p>• Subpages can be promoted to main navigation later</p>
                      <p>• Use descriptive labels for better navigation</p>
                      <p>• Route should match an existing page or component</p>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowItemForm(false);
                      setShowSubpageForm(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveItem}
                    disabled={!itemForm.label}
                    className="px-4 py-2 bg-[var(--color-primary,#f4647d)] text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingItem ? 'Update Item' : 
                     showSubpageForm ? 'Create Subpage' : 'Create Item'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sidebar Preview</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Preview */}
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Live Preview</h4>
              <div className="space-y-2 max-w-xs">
                {menuHierarchy.map(item => (
                  <div key={item.id}>
                    <div className={`flex items-center px-3 py-2 text-sm rounded transition-all duration-200 ${
                      item.isVisible ? 'text-gray-700 hover:bg-white hover:shadow-sm' : 'text-gray-400 line-through'
                    }`}>
                      {item.isFolder ? (
                        <Folder className="h-4 w-4 mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      {item.label}
                      {item.isCustom && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1 rounded">Custom</span>
                      )}
                    </div>
                    
                    {item.isFolder && item.children && (
                      <div className="ml-4 space-y-1 mt-1">
                        {item.children.map(child => (
                          <div key={child.id} className={`flex items-center px-3 py-1 text-xs rounded ${
                            child.isVisible ? 'text-gray-600 hover:bg-white' : 'text-gray-400 line-through'
                          }`}>
                            <FileText className="h-3 w-3 mr-2" />
                            {child.label}
                            {child.isCustom && (
                              <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1 rounded">Custom</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Structure Overview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Structure Overview</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-medium">{sidebarConfig.menuItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Visible Items:</span>
                  <span className="font-medium">{sidebarConfig.menuItems.filter(item => item.isVisible).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Folders:</span>
                  <span className="font-medium">{sidebarConfig.menuItems.filter(item => item.isFolder).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subpages:</span>
                  <span className="font-medium">{sidebarConfig.menuItems.filter(item => item.parentId).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Custom Items:</span>
                  <span className="font-medium">{sidebarConfig.menuItems.filter(item => item.isCustom).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Separators:</span>
                  <span className="font-medium">{sidebarConfig.menuItems.filter(item => item.isSeparator).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarManager;