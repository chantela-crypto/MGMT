// Enhanced state management utility with validation and error handling
export class StateManager {
  private static readonly VERSION_KEY = '_version';
  private static readonly CURRENT_VERSION = '1.0.0';

  // Save state with validation and error handling
  static saveState<T>(key: string, data: T, validator?: (data: T) => boolean): boolean {
    try {
      if (validator && !validator(data)) {
        console.error(`Validation failed for key "${key}"`);
        return false;
      }

      const versionedData = {
        [this.VERSION_KEY]: this.CURRENT_VERSION,
        data,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(key, JSON.stringify(versionedData));
      
      // Dispatch storage event for cross-component synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(versionedData),
        storageArea: localStorage
      }));
      
      return true;
    } catch (error) {
      console.error(`Error saving state for key "${key}":`, error);
      return false;
    }
  }

  // Load state with validation and migration support
  static loadState<T>(key: string, defaultValue: T, validator?: (data: T) => boolean): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item, this.dateReviver);
      
      // Handle versioned data
      if (parsed[this.VERSION_KEY]) {
        const data = parsed.data;
        if (validator && !validator(data)) {
          console.warn(`Invalid data for key "${key}", using default value`);
          return defaultValue;
        }
        return data;
      }

      // Handle legacy data (no version)
      if (validator && !validator(parsed)) {
        console.warn(`Invalid legacy data for key "${key}", using default value`);
        return defaultValue;
      }

      return parsed;
    } catch (error) {
      console.error(`Error loading state for key "${key}":`, error);
      return defaultValue;
    }
  }

  // Clear specific state
  static clearState(key: string): boolean {
    try {
      localStorage.removeItem(key);
      
      // Dispatch storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: null,
        storageArea: localStorage
      }));
      
      return true;
    } catch (error) {
      console.error(`Error clearing state for key "${key}":`, error);
      return false;
    }
  }

  // Validate data integrity
  static validateData<T>(data: T, validator: (data: T) => boolean): boolean {
    try {
      return validator(data);
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  // Batch save operations
  static saveBatch<T>(operations: Array<{ key: string; data: T; validator?: (data: T) => boolean }>): boolean {
    try {
      const results = operations.map(op => this.saveState(op.key, op.data, op.validator));
      return results.every(result => result);
    } catch (error) {
      console.error('Batch save error:', error);
      return false;
    }
  }

  // Date reviver for JSON parsing
  private static dateReviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
      return new Date(value);
    }
    return value;
  };

  // Get all keys with prefix
  static getKeysWithPrefix(prefix: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  // Clear all data with prefix
  static clearAllWithPrefix(prefix: string): boolean {
    try {
      const keys = this.getKeysWithPrefix(prefix);
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error(`Error clearing data with prefix "${prefix}":`, error);
      return false;
    }
  }

  // Export all configuration data
  static exportAllConfigurations(): string {
    const configKeys = [
      'brandingConfig',
      'divisionColors',
      'dashboardConfig',
      'performanceConfig',
      'sidebarConfig',
      'kpiDefinitions',
      'divisionKPIConfigs',
      'pageCustomizations',
    ];

    const exportData: Record<string, any> = {};
    
    configKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          exportData[key] = JSON.parse(item, this.dateReviver);
        }
      } catch (error) {
        console.error(`Error exporting key "${key}":`, error);
      }
    });

    return JSON.stringify(exportData, null, 2);
  }

  // Import all configuration data
  static importAllConfigurations(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData, this.dateReviver);
      
      Object.entries(importData).forEach(([key, value]) => {
        this.saveState(key, value);
      });

      // Force full application refresh after import
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error importing configurations:', error);
      return false;
    }
  }
}