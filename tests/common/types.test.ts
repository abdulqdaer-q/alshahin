/**
 * Tests for common types
 */

import { USER_AGENTS, UserAgentMode } from '../../src/common/types';
import type { Site, AppSettings, NavigationState, ExportData } from '../../src/common/types';

describe('Common Types', () => {
  describe('USER_AGENTS', () => {
    it('should have desktop user agent', () => {
      expect(USER_AGENTS.desktop).toBeDefined();
      expect(typeof USER_AGENTS.desktop).toBe('string');
      expect(USER_AGENTS.desktop).toContain('Mozilla');
    });

    it('should have mobile user agent', () => {
      expect(USER_AGENTS.mobile).toBeDefined();
      expect(typeof USER_AGENTS.mobile).toBe('string');
      expect(USER_AGENTS.mobile).toContain('Mozilla');
      expect(USER_AGENTS.mobile).toContain('Mobile');
    });

    it('should have different user agents for desktop and mobile', () => {
      expect(USER_AGENTS.desktop).not.toBe(USER_AGENTS.mobile);
    });
  });

  describe('Type Structures', () => {
    it('should validate Site interface structure', () => {
      const site: Site = {
        id: 'test-id',
        name: 'Test Site',
        url: 'https://test.com',
        icon: 'https://test.com/icon.png',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(site.id).toBeDefined();
      expect(site.name).toBeDefined();
      expect(site.url).toBeDefined();
      expect(site.createdAt).toBeDefined();
      expect(site.updatedAt).toBeDefined();
    });

    it('should allow Site without optional icon', () => {
      const site: Site = {
        id: 'test-id',
        name: 'Test Site',
        url: 'https://test.com',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(site.icon).toBeUndefined();
    });

    it('should validate AppSettings interface structure', () => {
      const settings: AppSettings = {
        activeSiteId: 'test-site-id',
        userAgentMode: 'desktop',
        windowWidth: 800,
        windowHeight: 600,
        lastExportPath: '/path/to/export',
      };

      expect(settings.userAgentMode).toBeDefined();
      expect(settings.windowWidth).toBeDefined();
      expect(settings.windowHeight).toBeDefined();
    });

    it('should validate NavigationState interface structure', () => {
      const navState: NavigationState = {
        canGoBack: true,
        canGoForward: false,
        isLoading: true,
        url: 'https://example.com',
        title: 'Example Site',
      };

      expect(navState.canGoBack).toBe(true);
      expect(navState.canGoForward).toBe(false);
      expect(navState.isLoading).toBe(true);
      expect(navState.url).toBe('https://example.com');
      expect(navState.title).toBe('Example Site');
    });

    it('should validate ExportData interface structure', () => {
      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: Date.now(),
        sites: [],
        settings: {
          userAgentMode: 'desktop',
          windowWidth: 800,
          windowHeight: 600,
        },
      };

      expect(exportData.version).toBeDefined();
      expect(exportData.exportedAt).toBeDefined();
      expect(Array.isArray(exportData.sites)).toBe(true);
      expect(exportData.settings).toBeDefined();
    });
  });

  describe('UserAgentMode Type', () => {
    it('should accept valid user agent modes', () => {
      const desktop: UserAgentMode = 'desktop';
      const mobile: UserAgentMode = 'mobile';

      expect(desktop).toBe('desktop');
      expect(mobile).toBe('mobile');
    });
  });
});
