import { describe, it, expect } from 'vitest';
import { validateMenuItems, getValidatedMenuItems, MASTER_MENU_ITEMS } from '../data/sidebarConfig';

describe('Sidebar Navigation Validation', () => {
  describe('validateMenuItems', () => {
    it('should pass validation for master menu items', () => {
      const validation = validateMenuItems(MASTER_MENU_ITEMS);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation for duplicate IDs', () => {
      const invalidItems = [
        { id: 'test', label: 'Test 1', route: 'test1', sortOrder: 10, isVisible: true, isFolder: false },
        { id: 'test', label: 'Test 2', route: 'test2', sortOrder: 20, isVisible: true, isFolder: false },
      ];
      
      const validation = validateMenuItems(invalidItems);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Duplicate ID found: test');
    });

    it('should fail validation for duplicate routes', () => {
      const invalidItems = [
        { id: 'test1', label: 'Test 1', route: 'test', sortOrder: 10, isVisible: true, isFolder: false },
        { id: 'test2', label: 'Test 2', route: 'test', sortOrder: 20, isVisible: true, isFolder: false },
      ];
      
      const validation = validateMenuItems(invalidItems);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Duplicate route found: test');
    });

    it('should fail validation for duplicate sort orders', () => {
      const invalidItems = [
        { id: 'test1', label: 'Test 1', route: 'test1', sortOrder: 10, isVisible: true, isFolder: false },
        { id: 'test2', label: 'Test 2', route: 'test2', sortOrder: 10, isVisible: true, isFolder: false },
      ];
      
      const validation = validateMenuItems(invalidItems);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Duplicate sort order found: 10');
    });

    it('should fail validation for missing required fields', () => {
      const invalidItems = [
        { id: '', label: 'Test', route: 'test', sortOrder: 10, isVisible: true, isFolder: false },
      ];
      
      const validation = validateMenuItems(invalidItems);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getValidatedMenuItems', () => {
    it('should return validated menu items', () => {
      const items = getValidatedMenuItems();
      expect(items).toBeDefined();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should return items sorted by sortOrder', () => {
      const items = getValidatedMenuItems();
      for (let i = 1; i < items.length; i++) {
        expect(items[i].sortOrder).toBeGreaterThanOrEqual(items[i - 1].sortOrder);
      }
    });

    it('should only return visible items', () => {
      const items = getValidatedMenuItems();
      items.forEach(item => {
        expect(item.isVisible).toBe(true);
      });
    });
  });

  describe('Menu Item Uniqueness', () => {
    it('should have unique IDs across all menu items', () => {
      const ids = MASTER_MENU_ITEMS.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique routes across all menu items', () => {
      const routes = MASTER_MENU_ITEMS.map(item => item.route);
      const uniqueRoutes = new Set(routes);
      expect(uniqueRoutes.size).toBe(routes.length);
    });

    it('should have unique sort orders across all menu items', () => {
      const sortOrders = MASTER_MENU_ITEMS.map(item => item.sortOrder);
      const uniqueSortOrders = new Set(sortOrders);
      expect(uniqueSortOrders.size).toBe(sortOrders.length);
    });
  });

  describe('Required Menu Items', () => {
    it('should include essential navigation items', () => {
      const requiredRoutes = [
        'unified-dashboard',
        'performance-2',
        'scoreboard',
        'employees',
        'projections',
      ];

      const availableRoutes = MASTER_MENU_ITEMS.map(item => item.route);
      
      requiredRoutes.forEach(route => {
        expect(availableRoutes).toContain(route);
      });
    });
  });
});