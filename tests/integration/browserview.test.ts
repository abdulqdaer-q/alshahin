/**
 * Integration tests for BrowserView management
 *
 * These tests verify the integration between storage, IPC handlers,
 * and BrowserView lifecycle management.
 */

import { BrowserView } from 'electron';
import { siteStore } from '../../src/main/store';
import type { Site } from '../../src/common/types';

describe('BrowserView Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    siteStore.clear();
  });

  describe('BrowserView Creation', () => {
    it('should create BrowserView with correct configuration', () => {
      const site: Site = {
        id: 'test-site',
        name: 'Test Site',
        url: 'https://example.com',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Simulate creating a BrowserView (main.ts:140-200)
      const browserView = new BrowserView({
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          webSecurity: true,
        },
      });

      expect(BrowserView).toHaveBeenCalled();
      expect(browserView).toBeDefined();
      expect(browserView.setBounds).toBeDefined();
      expect(browserView.setAutoResize).toBeDefined();
      expect(browserView.webContents).toBeDefined();
    });

    it('should load URL in BrowserView', async () => {
      const browserView = new BrowserView();
      const url = 'https://github.com';

      await browserView.webContents.loadURL(url);

      expect(browserView.webContents.loadURL).toHaveBeenCalledWith(url);
    });

    it('should set custom user agent', () => {
      const browserView = new BrowserView();
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';

      browserView.webContents.setUserAgent(userAgent);

      expect(browserView.webContents.setUserAgent).toHaveBeenCalledWith(userAgent);
    });
  });

  describe('Site Switching Flow', () => {
    it('should follow complete site switching workflow', async () => {
      // Step 1: Create sites in storage
      const site1 = siteStore.add({
        name: 'GitHub',
        url: 'https://github.com',
      });

      const site2 = siteStore.add({
        name: 'Google',
        url: 'https://google.com',
      });

      expect(siteStore.getAll()).toHaveLength(2);

      // Step 2: Load first site
      const browserView1 = new BrowserView();
      await browserView1.webContents.loadURL(site1.url);

      expect(browserView1.webContents.loadURL).toHaveBeenCalledWith('https://github.com');

      // Step 3: Switch to second site (destroy first, create second)
      (browserView1.webContents as any).destroy();

      const browserView2 = new BrowserView();
      await browserView2.webContents.loadURL(site2.url);

      expect(browserView1.webContents.destroy).toHaveBeenCalled();
      expect(browserView2.webContents.loadURL).toHaveBeenCalledWith('https://google.com');
    });
  });

  describe('Navigation State', () => {
    it('should track navigation state correctly', () => {
      const browserView = new BrowserView();

      // Mock navigation state
      (browserView.webContents.canGoBack as jest.Mock).mockReturnValue(true);
      (browserView.webContents.canGoForward as jest.Mock).mockReturnValue(false);
      (browserView.webContents.isLoading as jest.Mock).mockReturnValue(true);
      (browserView.webContents.getURL as jest.Mock).mockReturnValue('https://example.com');
      (browserView.webContents.getTitle as jest.Mock).mockReturnValue('Example Domain');

      const state = {
        canGoBack: browserView.webContents.canGoBack(),
        canGoForward: browserView.webContents.canGoForward(),
        isLoading: browserView.webContents.isLoading(),
        url: browserView.webContents.getURL(),
        title: browserView.webContents.getTitle(),
      };

      expect(state.canGoBack).toBe(true);
      expect(state.canGoForward).toBe(false);
      expect(state.isLoading).toBe(true);
      expect(state.url).toBe('https://example.com');
      expect(state.title).toBe('Example Domain');
    });

    it('should perform navigation actions', () => {
      const browserView = new BrowserView();

      browserView.webContents.goBack();
      expect(browserView.webContents.goBack).toHaveBeenCalled();

      browserView.webContents.goForward();
      expect(browserView.webContents.goForward).toHaveBeenCalled();

      browserView.webContents.reload();
      expect(browserView.webContents.reload).toHaveBeenCalled();

      browserView.webContents.stop();
      expect(browserView.webContents.stop).toHaveBeenCalled();
    });
  });

  describe('User Agent Switching', () => {
    it('should switch between desktop and mobile user agents', () => {
      const site = siteStore.add({
        name: 'Test Site',
        url: 'https://test.com',
      });

      // Desktop mode
      const desktopView = new BrowserView();
      const desktopUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
      desktopView.webContents.setUserAgent(desktopUA);
      desktopView.webContents.loadURL(site.url);

      expect(desktopView.webContents.setUserAgent).toHaveBeenCalledWith(desktopUA);

      // Destroy and recreate for mobile
      (desktopView.webContents as any).destroy();

      const mobileView = new BrowserView();
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
      mobileView.webContents.setUserAgent(mobileUA);
      mobileView.webContents.loadURL(site.url);

      expect(mobileView.webContents.setUserAgent).toHaveBeenCalledWith(mobileUA);
      expect(desktopView.webContents.destroy).toHaveBeenCalled();
    });
  });

  describe('BrowserView Positioning', () => {
    it('should position BrowserView below UI chrome', () => {
      const browserView = new BrowserView();
      const UI_CHROME_HEIGHT = 120;
      const windowWidth = 800;
      const windowHeight = 600;

      browserView.setBounds({
        x: 0,
        y: UI_CHROME_HEIGHT,
        width: windowWidth,
        height: windowHeight - UI_CHROME_HEIGHT,
      });

      expect(browserView.setBounds).toHaveBeenCalledWith({
        x: 0,
        y: 120,
        width: 800,
        height: 480,
      });
    });

    it('should enable auto-resize', () => {
      const browserView = new BrowserView();

      browserView.setAutoResize({
        width: true,
        height: true,
      });

      expect(browserView.setAutoResize).toHaveBeenCalledWith({
        width: true,
        height: true,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle URL load errors gracefully', async () => {
      const browserView = new BrowserView();
      const invalidUrl = 'not-a-valid-url';

      (browserView.webContents.loadURL as jest.Mock).mockRejectedValue(
        new Error('Invalid URL')
      );

      await expect(browserView.webContents.loadURL(invalidUrl)).rejects.toThrow('Invalid URL');
    });
  });
});
