// Test setup file - runs before all tests

// Set up global test environment
process.env.NODE_ENV = 'test';

// Mock process.platform for testing
Object.defineProperty(process, 'platform', {
  value: 'darwin', // Default to macOS for testing
  writable: true,
});

// Suppress console output during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
// };
