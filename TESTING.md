# Testing Documentation

Comprehensive test suite for the Web Apps Menubar application.

## Test Structure

```
tests/
├── __mocks__/
│   ├── electron.ts           # Mock Electron APIs
│   └── electron-store.ts     # Mock electron-store
├── common/
│   └── types.test.ts         # Type definitions and constants
├── main/
│   ├── store.test.ts         # Storage layer (CRUD, import/export)
│   ├── preload.test.ts       # IPC bridge API exposure
│   └── main.test.ts          # Main process (existing)
├── integration/
│   └── browserview.test.ts   # BrowserView lifecycle and integration
├── renderer/
│   └── renderer.test.ts      # UI logic (existing)
└── setup.ts                  # Test environment setup
```

## Running Tests

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

### Storage Layer (`tests/main/store.test.ts`)

**Site Store - CRUD Operations:**
- ✓ Get all sites (empty and populated)
- ✓ Get site by ID (found and not found)
- ✓ Add new site with auto-generated fields
- ✓ Add site without optional icon
- ✓ Generate unique IDs
- ✓ Update site (name, URL, icon, multiple fields)
- ✓ Update timestamps (updatedAt modified, createdAt preserved)
- ✓ Delete site (success and failure)
- ✓ Clear all sites

**Settings Store:**
- ✓ Get default settings
- ✓ Update user agent mode
- ✓ Update window dimensions
- ✓ Update active site ID
- ✓ Preserve existing settings on partial update
- ✓ Reset to defaults

**Import/Export:**
- ✓ Export to file (JSON format)
- ✓ Export to JSON string
- ✓ Import from file (replace mode)
- ✓ Import from file (merge mode)
- ✓ Import from JSON string
- ✓ Prevent duplicate URLs in merge mode
- ✓ Get storage path

**Total: 31 tests**

### Preload Script (`tests/main/preload.test.ts`)

**API Exposure:**
- ✓ Expose electronAPI to main world
- ✓ Expose platform information
- ✓ Expose site management methods (getAll, getById, create, update, delete, switch)
- ✓ Expose navigation controls (back, forward, reload, stop, loadUrl, onStateChange)
- ✓ Expose settings methods (getAll, update, setUserAgent)
- ✓ Expose import/export methods (dialogs, file operations, JSON export)
- ✓ Expose app utilities (getStoragePath)
- ✓ Verify complete type-safe API structure

**Total: 8 tests**

### Common Types (`tests/common/types.test.ts`)

**User Agent Constants:**
- ✓ Desktop user agent defined and valid
- ✓ Mobile user agent defined and valid
- ✓ Different agents for desktop and mobile

**Type Structure Validation:**
- ✓ Site interface (with and without optional icon)
- ✓ AppSettings interface
- ✓ NavigationState interface
- ✓ ExportData interface
- ✓ UserAgentMode type

**Total: 8 tests**

### BrowserView Integration (`tests/integration/browserview.test.ts`)

**BrowserView Lifecycle:**
- ✓ Create BrowserView with correct security configuration
- ✓ Load URL in BrowserView
- ✓ Set custom user agent

**Site Switching Workflow:**
- ✓ Complete site switching flow (create, load, switch, destroy)

**Navigation State:**
- ✓ Track navigation state (back, forward, loading, URL, title)
- ✓ Perform navigation actions

**User Agent Switching:**
- ✓ Switch between desktop and mobile user agents with reload

**Positioning:**
- ✓ Position BrowserView below UI chrome (120px offset)
- ✓ Enable auto-resize

**Error Handling:**
- ✓ Handle URL load errors gracefully

**Total: 10 tests**

## Total Test Count

**57 tests** across all test suites

## Mock Objects

### Electron Mock (`tests/__mocks__/electron.ts`)

Mocks all Electron APIs used in the application:
- `app` - Application lifecycle and paths
- `BrowserWindow` - Main window management
- `BrowserView` - Web content rendering
- `Tray` - System tray icon
- `screen` - Display information
- `nativeImage` - Image manipulation
- `ipcMain` - Main process IPC
- `ipcRenderer` - Renderer process IPC
- `contextBridge` - Secure API exposure
- `dialog` - File dialogs

### electron-store Mock (`tests/__mocks__/electron-store.ts`)

Provides in-memory storage implementation:
- `get(key, default)` - Retrieve value
- `set(key, value)` - Store value
- `delete(key)` - Remove value
- `clear()` - Clear all data
- `has(key)` - Check existence
- Supports nested key paths (e.g., 'settings.userAgentMode')

## Test Configuration

### Jest Configuration (`jest.config.js`)

- **Preset**: `ts-jest` for TypeScript support
- **Environment**: Node.js
- **Coverage**: Excludes type definitions and DOM-dependent renderer code
- **Module Mapping**: Auto-mocks Electron and electron-store
- **Setup**: Loads setup file for global test configuration

### Coverage Thresholds

While not enforced, aim for:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Writing New Tests

### Example: Testing a Site CRUD Operation

```typescript
describe('siteStore', () => {
  beforeEach(() => {
    siteStore.clear(); // Reset state
    jest.clearAllMocks(); // Clear mock calls
  });

  it('should add a site with all fields', () => {
    const site = siteStore.add({
      name: 'Test Site',
      url: 'https://test.com',
      icon: 'https://test.com/icon.png'
    });

    expect(site).toMatchObject({
      name: 'Test Site',
      url: 'https://test.com',
      icon: 'https://test.com/icon.png'
    });
    expect(site.id).toBeDefined();
    expect(site.createdAt).toBeDefined();
  });
});
```

### Example: Testing IPC Communication

```typescript
it('should expose site.getAll method', () => {
  require('../../src/main/preload');

  const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;

  expect(typeof exposedAPI.site.getAll).toBe('function');
});
```

### Example: Testing BrowserView

```typescript
it('should create BrowserView with security settings', () => {
  const browserView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  expect(BrowserView).toHaveBeenCalled();
  expect(browserView.webContents).toBeDefined();
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` to reset state
3. **Mocking**: Use mocks for Electron and external dependencies
4. **Descriptive Names**: Test names should explain what is being tested
5. **Arrange-Act-Assert**: Structure tests clearly
6. **Edge Cases**: Test both success and failure paths

## Continuous Integration

Tests are designed to run in CI environments without requiring:
- Electron runtime
- Display server (headless)
- File system (mocked)
- Network access

## Known Limitations

1. **Renderer Tests**: DOM-dependent code is excluded from coverage due to Jest environment
2. **Integration Tests**: Full end-to-end tests require Electron runtime
3. **Async Operations**: Some file I/O is mocked rather than using actual filesystem

## Future Improvements

- [ ] Add E2E tests with Spectron or Playwright
- [ ] Increase renderer code coverage with jsdom
- [ ] Add performance benchmarks for BrowserView switching
- [ ] Add visual regression tests for UI components
- [ ] Add accessibility tests
- [ ] Add mutation testing to verify test quality

## Troubleshooting

### Tests failing due to module not found

```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Mock not working

Ensure the module path in `jest.config.js` matches exactly:
```javascript
moduleNameMapper: {
  '^electron$': '<rootDir>/tests/__mocks__/electron.ts',
  '^electron-store$': '<rootDir>/tests/__mocks__/electron-store.ts',
}
```

### TypeScript errors in tests

Verify `tsconfig.json` includes the tests directory:
```json
{
  "include": ["src/**/*", "tests/**/*"]
}
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest](https://kulshekhar.github.io/ts-jest/)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- [Testing Best Practices](https://testingjavascript.com/)
