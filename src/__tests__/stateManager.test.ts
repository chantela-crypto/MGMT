import { StateManager } from '../utils/stateManager';

describe('StateManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load state correctly', () => {
    const testData = { name: 'John', age: 30 };
    const key = 'testUser';

    const saved = StateManager.saveState(key, testData);
    expect(saved).toBe(true);

    const loaded = StateManager.loadState(key, {});
    expect(loaded).toEqual(testData);
  });

  it('should return default value when no state exists', () => {
    const defaultValue = { name: 'Default', age: 0 };
    const loaded = StateManager.loadState('nonexistent', defaultValue);
    expect(loaded).toEqual(defaultValue);
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage full');
    });

    const saved = StateManager.saveState('test', { data: 'test' });
    expect(saved).toBe(false);

    // Restore original method
    localStorage.setItem = originalSetItem;
  });

  it('should clear state correctly', () => {
    StateManager.saveState('test', { data: 'test' });
    const cleared = StateManager.clearState('test');
    expect(cleared).toBe(true);

    const loaded = StateManager.loadState('test', null);
    expect(loaded).toBe(null);
  });

  it('should validate data integrity', () => {
    const validator = (data: any) => data.name && data.age > 0;
    
    expect(StateManager.validateData({ name: 'John', age: 30 }, validator)).toBe(true);
    expect(StateManager.validateData({ name: '', age: 30 }, validator)).toBe(false);
    expect(StateManager.validateData({ name: 'John', age: -5 }, validator)).toBe(false);
  });

  it('should handle batch operations', () => {
    const operations = [
      { key: 'user1', data: { name: 'John' } },
      { key: 'user2', data: { name: 'Jane' } },
    ];

    const result = StateManager.saveBatch(operations);
    expect(result).toBe(true);

    expect(StateManager.loadState('user1', {})).toEqual({ name: 'John' });
    expect(StateManager.loadState('user2', {})).toEqual({ name: 'Jane' });
  });
});