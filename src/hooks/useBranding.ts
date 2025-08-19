import { useState, useEffect } from 'react';
import { BrandingConfig, DivisionColorConfig } from '../types/branding';
import { useLocalStorage } from './useLocalStorage';
import { defaultBrandingConfig } from '../data/brandingPresets';
import { divisions } from '../data/divisions';

const defaultDivisionColors: DivisionColorConfig = {
  id: 'default-division-colors',
  name: 'Default Division Colors',
  divisionColors: {
    'new-patient': '#e6b813',
    'hormone': '#5c6f75',
    'nutrition': '#bfb6d9',
    'iv-therapy': '#91c4ba',
    'laser': '#ff9680',
    'injectables': '#ff6a76',
    'guest-care': '#e6b813',
    'feminine': '#a47d9b',
    'wellness': '#ff9680',
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const useBranding = () => {
  const [brandingConfig, setBrandingConfig] = useLocalStorage<BrandingConfig>('brandingConfig', defaultBrandingConfig);
  const [divisionColors, setDivisionColors] = useLocalStorage<DivisionColorConfig>('divisionColors', defaultDivisionColors);
  const [isApplying, setIsApplying] = useState(false);

  // Apply branding to CSS custom properties
  const applyBranding = (config: BrandingConfig) => {
    setIsApplying(true);
    
    try {
      const root = document.documentElement;
      
      // Apply color variables
      root.style.setProperty('--color-primary', config.colors.primary);
      root.style.setProperty('--color-secondary', config.colors.secondary);
      root.style.setProperty('--color-accent', config.colors.accent);
      root.style.setProperty('--color-success', config.colors.success);
      root.style.setProperty('--color-warning', config.colors.warning);
      root.style.setProperty('--color-error', config.colors.error);
      root.style.setProperty('--color-neutral', config.colors.neutral);
      root.style.setProperty('--color-background', config.colors.background);
      root.style.setProperty('--color-surface', config.colors.surface);
      root.style.setProperty('--color-text-primary', config.colors.text.primary);
      root.style.setProperty('--color-text-secondary', config.colors.text.secondary);
      root.style.setProperty('--color-text-muted', config.colors.text.muted);
      
      // Apply border color if defined
      if (config.colors.border) {
        root.style.setProperty('--color-border', config.colors.border);
      }

      // Apply typography variables
      root.style.setProperty('--font-family', config.typography.fontFamily);
      root.style.setProperty('--font-family-heading', config.typography.headingFontFamily);
      
      // Apply font size variables
      Object.entries(config.typography.fontSize).forEach(([key, value]) => {
        root.style.setProperty(`--font-size-${key}`, value);
      });
      
      // Apply font weight variables
      Object.entries(config.typography.fontWeight).forEach(([key, value]) => {
        root.style.setProperty(`--font-weight-${key}`, value);
      });
      
      // Apply line height variables
      Object.entries(config.typography.lineHeight).forEach(([key, value]) => {
        root.style.setProperty(`--line-height-${key}`, value);
      });
      
      // Apply spacing variables
      Object.entries(config.spacing).forEach(([key, value]) => {
        root.style.setProperty(`--spacing-${key}`, value);
      });

      // Apply border radius variables
      Object.entries(config.borderRadius).forEach(([key, value]) => {
        root.style.setProperty(`--border-radius-${key}`, value);
      });

      // Apply shadow variables
      Object.entries(config.shadows).forEach(([key, value]) => {
        root.style.setProperty(`--shadow-${key}`, value);
      });

      // Apply logo variables
      root.style.setProperty('--logo-url', `url(${config.logo.url})`);
      root.style.setProperty('--logo-width', config.logo.width);
      root.style.setProperty('--logo-height', config.logo.height);
      
      // Update document title
      document.title = `${config.companyName} - ${config.tagline}`;
      
      setBrandingConfig(config);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('brandingUpdated', {
        detail: config
      }));
      
      // Force re-render of all components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'brandingConfig',
        newValue: JSON.stringify(config),
        storageArea: localStorage
      }));
    } catch (error) {
      console.error('Error applying branding:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Apply division colors to CSS custom properties
  const applyDivisionColors = (colors: DivisionColorConfig) => {
    try {
      const root = document.documentElement;
      
      // Apply division color variables
      Object.entries(colors.divisionColors).forEach(([divisionId, color]) => {
        root.style.setProperty(`--division-${divisionId}`, color);
        root.style.setProperty(`--division-${divisionId}-light`, `${color}20`);
      });
      
      setDivisionColors(colors);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('divisionColorsUpdated', {
        detail: colors
      }));
    } catch (error) {
      console.error('Error applying division colors:', error);
    }
  };

  // Apply branding on mount and when config changes
  useEffect(() => {
    applyBranding(brandingConfig);
    applyDivisionColors(divisionColors);
  }, []);

  const updateBranding = (newConfig: Partial<BrandingConfig>) => {
    const updatedConfig = {
      ...brandingConfig,
      ...newConfig,
      updatedAt: new Date(),
    };
    applyBranding(updatedConfig);
    
    // Force immediate save to localStorage
    setBrandingConfig(updatedConfig);
  };

  const updateDivisionColors = (newColors: Partial<DivisionColorConfig>) => {
    const updatedColors = {
      ...divisionColors,
      ...newColors,
      updatedAt: new Date(),
    };
    applyDivisionColors(updatedColors);
    
    // Force immediate save to localStorage
    setDivisionColors(updatedColors);
  };

  const resetToDefault = () => {
    applyBranding(defaultBrandingConfig);
    applyDivisionColors(defaultDivisionColors);
  };

  return {
    brandingConfig,
    divisionColors,
    updateBranding,
    updateDivisionColors,
    resetToDefault,
    applyBranding,
    applyDivisionColors,
    isApplying,
  };
};