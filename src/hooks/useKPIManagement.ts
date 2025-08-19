import { useState, useEffect } from 'react';
import { KPIDefinition, DivisionKPIConfig } from '../types/branding';
import { useLocalStorage } from './useLocalStorage';
import { defaultKPIDefinitions, defaultDivisionKPIConfigs } from '../data/defaultKPIs';

interface KPICategory {
  key: string;
  label: string;
}

export const useKPIManagement = () => {
  const [kpiDefinitions, setKPIDefinitions] = useLocalStorage<KPIDefinition[]>('kpiDefinitions', defaultKPIDefinitions);
  const [divisionKPIConfigs, setDivisionKPIConfigs] = useLocalStorage<DivisionKPIConfig[]>('divisionKPIConfigs', defaultDivisionKPIConfigs);
  const [kpiCategories, setKPICategories] = useLocalStorage<KPICategory[]>('kpiCategories', [
    { key: 'performance', label: 'Performance' },
    { key: 'financial', label: 'Financial' },
    { key: 'operational', label: 'Operational' },
    { key: 'satisfaction', label: 'Satisfaction' },
    { key: 'growth', label: 'Growth' },
    { key: 'retention', label: 'Retention' },
  ]);

  // Get KPIs for a specific division
  const getDivisionKPIs = (divisionId: string): KPIDefinition[] => {
    const config = divisionKPIConfigs.find(config => config.divisionId === divisionId);
    
    if (config) {
      // Return KPIs in the configured order
      const orderedKPIs = config.displayOrder
        .map(kpiId => kpiDefinitions.find(kpi => kpi.id === kpiId))
        .filter(Boolean) as KPIDefinition[];
      
      // Add any KPIs not in the display order
      const remainingKPIs = config.kpiDefinitions.filter(kpi => 
        !config.displayOrder.includes(kpi.id)
      );
      
      return [...orderedKPIs, ...remainingKPIs];
    }

    // Fallback: return all applicable KPIs
    return kpiDefinitions.filter(kpi => 
      kpi.isActive && (
        kpi.applicableDivisions.includes('all') || 
        kpi.applicableDivisions.includes(divisionId)
      )
    ).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Get custom target for a KPI in a division
  const getKPITarget = (divisionId: string, kpiId: string): number => {
    const config = divisionKPIConfigs.find(config => config.divisionId === divisionId);
    const customTarget = config?.customTargets[kpiId];
    
    if (customTarget !== undefined) {
      return customTarget;
    }

    const kpiDef = kpiDefinitions.find(kpi => kpi.id === kpiId);
    return kpiDef?.target || 0;
  };

  // Add new KPI definition
  const addKPIDefinition = (kpi: Omit<KPIDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newKPI: KPIDefinition = {
      ...kpi,
      id: `kpi-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setKPIDefinitions(prev => [...prev, newKPI]);
    
    // Dispatch event to notify all components
    window.dispatchEvent(new CustomEvent('kpiDefinitionsUpdated', {
      detail: { kpiDefinitions: [...kpiDefinitions, newKPI] }
    }));
    
    return newKPI;
  };

  // Update KPI definition
  const updateKPIDefinition = (kpiId: string, updates: Partial<KPIDefinition>) => {
    setKPIDefinitions(prev => prev.map(kpi => 
      kpi.id === kpiId 
        ? { ...kpi, ...updates, updatedAt: new Date() }
        : kpi
    ));
    
    // Dispatch event to notify all components
    window.dispatchEvent(new CustomEvent('kpiDefinitionsUpdated', {
      detail: { kpiDefinitions: kpiDefinitions.map(kpi => 
        kpi.id === kpiId 
          ? { ...kpi, ...updates, updatedAt: new Date() }
          : kpi
      ) }
    }));
  };

  // Remove KPI definition
  const removeKPIDefinition = (kpiId: string) => {
    setKPIDefinitions(prev => prev.filter(kpi => kpi.id !== kpiId));
    
    // Remove from all division configs
    setDivisionKPIConfigs(prev => prev.map(config => ({
      ...config,
      kpiDefinitions: config.kpiDefinitions.filter(kpi => kpi.id !== kpiId),
      displayOrder: config.displayOrder.filter(id => id !== kpiId),
      customTargets: Object.fromEntries(
        Object.entries(config.customTargets).filter(([key]) => key !== kpiId)
      ),
      updatedAt: new Date(),
    })));
    
    // Dispatch event to notify all components
    window.dispatchEvent(new CustomEvent('kpiDefinitionsUpdated', {
      detail: { kpiDefinitions: kpiDefinitions.filter(kpi => kpi.id !== kpiId) }
    }));
  };

  // Update division KPI configuration
  const updateDivisionKPIConfig = (divisionId: string, updates: Partial<DivisionKPIConfig>) => {
    setDivisionKPIConfigs(prev => {
      const existingIndex = prev.findIndex(config => config.divisionId === divisionId);
      
      if (existingIndex >= 0) {
        // Update existing config
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...updates,
          updatedAt: new Date(),
        };
        return updated;
      } else {
        // Create new config
        const newConfig: DivisionKPIConfig = {
          id: `config-${divisionId}-${Date.now()}`,
          divisionId,
          kpiDefinitions: getDivisionKPIs(divisionId),
          customTargets: {},
          displayOrder: [],
          isActive: true,
          updatedAt: new Date(),
          ...updates,
        };
        return [...prev, newConfig];
      }
    });
  };

  // Set custom target for a division KPI
  const setCustomTarget = (divisionId: string, kpiId: string, target: number) => {
    const config = divisionKPIConfigs.find(config => config.divisionId === divisionId);
    
    if (config) {
      updateDivisionKPIConfig(divisionId, {
        customTargets: {
          ...config.customTargets,
          [kpiId]: target,
        },
      });
    } else {
      updateDivisionKPIConfig(divisionId, {
        customTargets: { [kpiId]: target },
      });
    }
  };

  // Reorder KPIs for a division
  const reorderDivisionKPIs = (divisionId: string, newOrder: string[]) => {
    updateDivisionKPIConfig(divisionId, {
      displayOrder: newOrder,
    });
  };

  // Get KPI categories
  const getKPICategories = () => {
    return kpiCategories.map(category => ({
      key: category.key,
      label: category.label,
      kpis: kpiDefinitions.filter(kpi => kpi.category === category.key && kpi.isActive),
    }));
  };

  // Add new KPI category
  const addKPICategory = (key: string, label: string) => {
    const newCategory: KPICategory = { key, label };
    setKPICategories(prev => [...prev, newCategory]);
  };

  // Update KPI category
  const updateKPICategory = (oldKey: string, newKey: string, newLabel: string) => {
    // Update category list
    setKPICategories(prev => prev.map(cat => 
      cat.key === oldKey ? { key: newKey, label: newLabel } : cat
    ));
    
    // Update all KPIs that use this category
    if (oldKey !== newKey) {
      setKPIDefinitions(prev => prev.map(kpi => 
        kpi.category === oldKey ? { ...kpi, category: newKey } : kpi
      ));
    }
  };

  // Remove KPI category
  const removeKPICategory = (categoryKey: string) => {
    setKPICategories(prev => prev.filter(cat => cat.key !== categoryKey));
  };

  return {
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
  };
};