import { useState, useEffect } from 'react';
import { SidebarConfig, SidebarMenuItem } from '../types/branding';
import { usePersistentState } from './usePersistentState';
import { getValidatedMenuItems, MASTER_MENU_ITEMS } from '../data/sidebarConfig';

export const useSidebarConfig = () => {
  // Use the master menu configuration as the source of truth
  const [sidebarConfig, setSidebarConfig] = usePersistentState<SidebarConfig>('sidebarConfig', {
    id: 'master-config',
    name: 'Master Navigation',
    menuItems: getValidatedMenuItems().map(item => ({
      id: item.id,
      label: item.label,
      originalLabel: item.label,
      isFolder: item.isFolder,
      isSeparator: false,
      parentId: item.parentId,
      children: item.children?.map(child => child.id) || [],
      isVisible: item.isVisible,
      sortOrder: item.sortOrder,
      isCustom: false,
      route: item.route,
      canPromoteToMain: false,
      canDemoteToSub: false,
    })),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  

  // Get menu items organized by hierarchy
  const getMenuHierarchy = () => {
    const rootItems = sidebarConfig.menuItems
      .filter(item => !item.parentId && item.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return rootItems.map(item => ({
      ...item,
      children: item.isFolder && item.children ? sidebarConfig.menuItems
        .filter(child => child.parentId === item.id && child.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder) : undefined
    }));
  };

  // Update menu item
  const updateMenuItem = (itemId: string, updates: Partial<SidebarMenuItem>) => {
    setSidebarConfig(prev => {
      const updated = {
        ...prev,
        menuItems: prev.menuItems.map(item => 
          item.id === itemId 
            ? { ...item, ...updates }
            : item
        ),
        updatedAt: new Date(),
      };
      
      // Force immediate update of sidebar component
      window.dispatchEvent(new CustomEvent('sidebarConfigUpdated', {
        detail: updated
      }));
      
      // Force storage event for cross-component updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'sidebarConfig',
        newValue: JSON.stringify(updated),
        storageArea: localStorage
      }));
      
      // Force immediate localStorage save
      try {
        localStorage.setItem('sidebarConfig', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving sidebar config:', error);
      }
      
      // Force app re-render
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        window.location.reload(); // Force full reload for sidebar changes
      }, 100);
      
      return updated;
    });
  };

  // Add new menu item with immediate persistence
  const addMenuItem = (item: Omit<SidebarMenuItem, 'id'>) => {
    const newItem: SidebarMenuItem = {
      ...item,
      id: `custom-${Date.now()}`,
      isCustom: true,
      isSeparator: item.isSeparator || false,
      originalLabel: item.originalLabel || item.label || '',
      canPromoteToMain: item.canPromoteToMain || false,
      canDemoteToSub: item.canDemoteToSub || false,
      children: item.isFolder ? [] : undefined,
    };

    setSidebarConfig(prev => {
      const updated = {
        ...prev,
        menuItems: [...prev.menuItems, newItem],
        updatedAt: new Date(),
      };
      
      // Force immediate update
      window.dispatchEvent(new CustomEvent('sidebarConfigUpdated', {
        detail: updated
      }));
      
      // Force storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'sidebarConfig',
        newValue: JSON.stringify(updated),
        storageArea: localStorage
      }));
      
      // Force immediate save and reload
      try {
        localStorage.setItem('sidebarConfig', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving sidebar config:', error);
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return updated;
    });

    // If this item has a parent, add it to the parent's children array
    if (newItem.parentId) {
      setSidebarConfig(prev => {
        const updated = {
          ...prev,
          menuItems: prev.menuItems.map(menuItem => 
            menuItem.id === newItem.parentId && menuItem.isFolder
              ? { ...menuItem, children: [...(menuItem.children || []), newItem.id] }
              : menuItem
          ),
          updatedAt: new Date(),
        };
        
        return updated;
      });
    }
    
    return newItem;
  };

  // Remove menu item with immediate persistence
  const removeMenuItem = (itemId: string) => {
    setSidebarConfig(prev => {
      const updated = {
        ...prev,
        menuItems: prev.menuItems
          .filter(item => item.id !== itemId)
          .map(item => 
            // Remove from parent's children array if it exists
            item.isFolder && item.children?.includes(itemId)
              ? { ...item, children: item.children.filter(childId => childId !== itemId) }
              : item
          ),
        updatedAt: new Date(),
      };
      
      // Force immediate update
      window.dispatchEvent(new CustomEvent('sidebarConfigUpdated', {
        detail: updated
      }));
      
      // Force storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'sidebarConfig',
        newValue: JSON.stringify(updated),
        storageArea: localStorage
      }));
      
      // Force immediate save and reload
      try {
        localStorage.setItem('sidebarConfig', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving sidebar config:', error);
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return updated;
    });
  };

  // Reset to default with immediate persistence
  const resetToDefault = () => {
    const defaultConfig = {
      id: 'master-config',
      name: 'Master Navigation',
      menuItems: MASTER_MENU_ITEMS.map(item => ({
        id: item.id,
        label: item.label,
        originalLabel: item.label,
        isFolder: item.isFolder,
        isSeparator: false,
        parentId: item.parentId,
        children: item.children?.map(child => child.id) || [],
        isVisible: item.isVisible,
        sortOrder: item.sortOrder,
        isCustom: false,
        route: item.route,
        canPromoteToMain: false,
        canDemoteToSub: false,
      })),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setSidebarConfig(defaultConfig);
    
    // Force immediate update and reload
    window.dispatchEvent(new CustomEvent('sidebarConfigUpdated', {
      detail: defaultConfig
    }));
    
    try {
      localStorage.setItem('sidebarConfig', JSON.stringify(defaultConfig));
    } catch (error) {
      console.error('Error saving sidebar config:', error);
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Add separator with immediate update
  const addSeparator = () => {
    const newSeparator: SidebarMenuItem = {
      id: `separator-${Date.now()}`,
      label: '---',
      originalLabel: '---',
      isFolder: false,
      isSeparator: true,
      isVisible: true,
      sortOrder: Math.max(...sidebarConfig.menuItems.map(item => item.sortOrder)) + 10,
      isCustom: true,
      canPromoteToMain: false,
      canDemoteToSub: false,
    };
    
    setSidebarConfig(prev => {
      const updated = {
        ...prev,
        menuItems: [...prev.menuItems, newSeparator],
        updatedAt: new Date(),
      };
      
      // Force immediate update
      window.dispatchEvent(new CustomEvent('sidebarConfigUpdated', {
        detail: updated
      }));
      
      try {
        localStorage.setItem('sidebarConfig', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving sidebar config:', error);
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return updated;
    });
  };

  // Toggle item visibility with immediate update
  const toggleItemVisibility = (itemId: string) => {
    const item = sidebarConfig.menuItems.find(i => i.id === itemId);
    if (item) {
      updateMenuItem(itemId, { isVisible: !item.isVisible });
    }
  };

  // Duplicate item
  const duplicateItem = (item: SidebarMenuItem) => {
    const duplicated = {
      ...item,
      label: `${item.label} (Copy)`,
      originalLabel: `${item.label} (Copy)`,
      isCustom: true,
      sortOrder: item.sortOrder + 1,
    };
    
    addMenuItem(duplicated);
  };

  // Reorder menu items
  const reorderMenuItems = (draggedId: string, targetId: string, position: 'above' | 'below' | 'inside') => {
    const draggedItem = sidebarConfig.menuItems.find(item => item.id === draggedId);
    const targetItem = sidebarConfig.menuItems.find(item => item.id === targetId);
    
    if (!draggedItem || !targetItem) return;
    
    let newParentId = targetItem.parentId;
    let newSortOrder = targetItem.sortOrder;
    
    if (position === 'above') {
      newSortOrder = targetItem.sortOrder - 0.5;
    } else if (position === 'below') {
      newSortOrder = targetItem.sortOrder + 0.5;
    } else if (position === 'inside' && targetItem.isFolder) {
      newParentId = targetItem.id;
      newSortOrder = 1000;
    }
    
    updateMenuItem(draggedId, {
      parentId: newParentId,
      sortOrder: newSortOrder,
    });
  };

  // Promote to main navigation
  const promoteToMain = (itemId: string) => {
    updateMenuItem(itemId, { parentId: undefined });
  };

  // Demote to sub-navigation
  const demoteToSub = (itemId: string, parentId: string) => {
    updateMenuItem(itemId, { parentId });
  };
  return {
    sidebarConfig,
    getMenuHierarchy,
    updateMenuItem,
    addMenuItem,
    removeMenuItem,
    addSeparator,
    toggleItemVisibility,
    duplicateItem,
    reorderMenuItems,
    promoteToMain,
    demoteToSub,
    resetToDefault,
  };
};