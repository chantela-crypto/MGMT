// Cypress E2E support file

// Import commands
import './commands';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that don't affect the test flow
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Add custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string, role?: string): Chainable<void>;
      selectDivision(divisionName: string): Chainable<void>;
      fillKPIForm(data: Record<string, number>): Chainable<void>;
    }
  }
}