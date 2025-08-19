describe('Button Interactions E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login Flow', () => {
    it('should complete login flow successfully', () => {
      // Fill login form
      cy.get('input[type="email"]').type('admin@truebalance.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('select').select('admin');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('not.include', '/login');
      cy.get('[data-testid="dashboard"]').should('be.visible');
    });

    it('should show validation errors for empty form', () => {
      cy.get('button[type="submit"]').click();
      
      // Form should not submit with empty fields
      cy.url().should('include', '/login');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      // Login first
      cy.get('input[type="email"]').type('admin@truebalance.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
    });

    it('should navigate between pages using sidebar', () => {
      // Click on different sidebar items
      cy.get('[data-testid="sidebar"]').within(() => {
        cy.contains('Performance').click();
        cy.url().should('include', 'performance');
        
        cy.contains('Daily Data').click();
        cy.url().should('include', 'scoreboard');
        
        cy.contains('Employee KPIs').click();
        cy.url().should('include', 'yearly-tracking');
      });
    });

    it('should maintain state across navigation', () => {
      // Set some filters
      cy.get('select').first().select('laser');
      
      // Navigate away and back
      cy.contains('Performance').click();
      cy.contains('Daily Data').click();
      
      // State should be maintained
      cy.get('select').first().should('have.value', 'laser');
    });
  });

  describe('Data Entry Forms', () => {
    beforeEach(() => {
      // Login and navigate to data input
      cy.get('input[type="email"]').type('admin@truebalance.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.contains('Daily Data').click();
    });

    it('should save data entry successfully', () => {
      // Open daily form for a division
      cy.get('button').contains('Enter Daily Data').first().click();
      
      // Fill in data for first employee
      cy.get('input[type="number"]').first().type('8');
      cy.get('input[type="number"]').eq(1).type('7.5');
      
      // Submit individual entry
      cy.get('button').contains('Submit').first().click();
      
      // Save overall submission
      cy.get('button').contains('Save Daily Data').click();
      
      // Should close modal
      cy.get('[data-testid="daily-form-modal"]').should('not.exist');
    });
  });

  describe('State Persistence', () => {
    it('should persist data across page refresh', () => {
      // Login
      cy.get('input[type="email"]').type('admin@truebalance.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Set some state
      cy.get('select').first().select('laser');
      
      // Refresh page
      cy.reload();
      
      // Should still be logged in and state preserved
      cy.get('[data-testid="dashboard"]').should('be.visible');
      cy.get('select').first().should('have.value', 'laser');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('POST', '/api/**', { forceNetworkError: true });
      
      // Login
      cy.get('input[type="email"]').type('admin@truebalance.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Should handle error without crashing
      cy.get('body').should('be.visible');
    });
  });
});