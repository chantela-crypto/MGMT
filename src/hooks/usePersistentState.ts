import { useState, useEffect, useCallback } from 'react';

interface PersistentStateOptions<T> {
  validator?: (data: T) => boolean;
  serializer?: {
    serialize: (data: T) => string;
    deserialize: (data: string) => T;
  };
}

export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options?: PersistentStateOptions<T>
): [T, (value: T | ((prev: T) => T)) => void, { isLoading: boolean; error: string | null }] {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date reviver function for JSON parsing
  const dateReviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
      return new Date(value);
    }
    return value;
  };

  // Load initial state
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = options?.serializer 
          ? options.serializer.deserialize(item)
          : JSON.parse(item, dateReviver);
        
        if (options?.validator && !options.validator(parsed)) {
          console.warn(`Invalid data for key "${key}", using default value`);
          setState(defaultValue);
        } else {
          setState(parsed);
        }
      }
    } catch (error) {
      console.error(`Error loading state for key "${key}":`, error);
      setError(`Failed to load saved data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setState(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  // Save state to localStorage
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const newValue = value instanceof Function ? value(state) : value;
      
      if (options?.validator && !options.validator(newValue)) {
        setError('Invalid data provided');
        return;
      }

      setState(newValue);
      
      const serialized = options?.serializer 
        ? options.serializer.serialize(newValue)
        : JSON.stringify(newValue);
      
      localStorage.setItem(key, serialized);
      setError(null);
      
      // Dispatch storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: serialized,
        storageArea: localStorage
      }));
    } catch (error) {
      console.error(`Error saving state for key "${key}":`, error);
      setError(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [key, state, options]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const parsed = options?.serializer 
            ? options.serializer.deserialize(e.newValue)
            : JSON.parse(e.newValue, dateReviver);
          setState(parsed);
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, options]);

  return [state, setValue, { isLoading, error }];
}