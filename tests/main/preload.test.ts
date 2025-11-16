/**
 * Tests for the preload script - IPC bridge
 */

import { contextBridge } from 'electron';

describe('Preload Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should expose electronAPI to main world', () => {
    require('../../src/main/preload');

    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      'electronAPI',
      expect.any(Object)
    );
  });

  it('should expose platform information', () => {
    require('../../src/main/preload');

    const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;
    expect(exposedAPI.platform).toBeDefined();
    expect(typeof exposedAPI.platform).toBe('string');
  });

  describe('Site Management API', () => {
    it('should expose site CRUD methods', () => {
      require('../../src/main/preload');

      const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;
      expect(exposedAPI.site).toBeDefined();
      expect(typeof exposedAPI.site.getAll).toBe('function');
      expect(typeof exposedAPI.site.getById).toBe('function');
      expect(typeof exposedAPI.site.create).toBe('function');
      expect(typeof exposedAPI.site.update).toBe('function');
      expect(typeof exposedAPI.site.delete).toBe('function');
      expect(typeof exposedAPI.site.switch).toBe('function');
    });
  });

  describe('Navigation API', () => {
    it('should expose navigation control methods', () => {
      require('../../src/main/preload');

      const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;
      expect(exposedAPI.navigation).toBeDefined();
      expect(typeof exposedAPI.navigation.back).toBe('function');
      expect(typeof exposedAPI.navigation.forward).toBe('function');
      expect(typeof exposedAPI.navigation.reload).toBe('function');
      expect(typeof exposedAPI.navigation.stop).toBe('function');
      expect(typeof exposedAPI.navigation.loadUrl).toBe('function');
      expect(typeof exposedAPI.navigation.onStateChange).toBe('function');
      expect(typeof exposedAPI.navigation.removeStateChangeListener).toBe('function');
    });
  });

  describe('Settings API', () => {
    it('should expose settings methods', () => {
      require('../../src/main/preload');

      const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;
      expect(exposedAPI.settings).toBeDefined();
      expect(typeof exposedAPI.settings.getAll).toBe('function');
      expect(typeof exposedAPI.settings.update).toBe('function');
      expect(typeof exposedAPI.settings.setUserAgent).toBe('function');
    });
  });

  describe('Import/Export API', () => {
    it('should expose import/export methods', () => {
      require('../../src/main/preload');

      const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;
      expect(exposedAPI.importExport).toBeDefined();
      expect(typeof exposedAPI.importExport.showImportDialog).toBe('function');
      expect(typeof exposedAPI.importExport.importFromFile).toBe('function');
      expect(typeof exposedAPI.importExport.showExportDialog).toBe('function');
      expect(typeof exposedAPI.importExport.exportToFile).toBe('function');
      expect(typeof exposedAPI.importExport.exportToJson).toBe('function');
    });
  });

  describe('App Utility API', () => {
    it('should expose app utility methods', () => {
      require('../../src/main/preload');

      const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;
      expect(exposedAPI.app).toBeDefined();
      expect(typeof exposedAPI.app.getStoragePath).toBe('function');
    });
  });

  it('should expose complete type-safe API', () => {
    require('../../src/main/preload');

    const [[, exposedAPI]] = (contextBridge.exposeInMainWorld as jest.Mock).mock.calls;

    // Verify all top-level API namespaces
    expect(exposedAPI).toHaveProperty('site');
    expect(exposedAPI).toHaveProperty('navigation');
    expect(exposedAPI).toHaveProperty('settings');
    expect(exposedAPI).toHaveProperty('importExport');
    expect(exposedAPI).toHaveProperty('app');
    expect(exposedAPI).toHaveProperty('platform');
  });
});
