/**
 * Tests for Pin Manager
 */

import { PinManager } from '../../src/main/pinManager';
import { BrowserWindow, BrowserView, Tray } from 'electron';
import { Site } from '../../src/common/types';

// Mock electron modules
jest.mock('electron', () => ({
  BrowserWindow: jest.fn(),
  BrowserView: jest.fn(),
  Tray: jest.fn(),
  nativeImage: {
    createFromPath: jest.fn(() => ({
      resize: jest.fn(() => ({
        setTemplateImage: jest.fn(),
      })),
    })),
    createFromDataURL: jest.fn(() => ({
      resize: jest.fn(() => ({
        setTemplateImage: jest.fn(),
      })),
    })),
  },
  Menu: {
    buildFromTemplate: jest.fn(() => ({})),
  },
}));

// Mock sessionManager
jest.mock('../../src/main/sessionManager', () => ({
  sessionManager: {
    getSessionForSite: jest.fn(() => ({})),
  },
}));

describe('PinManager', () => {
  let pinManager: PinManager;
  let mockWindow: any;
  let mockView: any;
  let mockTray: any;

  const testSite: Site = {
    id: 'test-site-123',
    name: 'Test Site',
    url: 'https://example.com',
    icon: 'data:image/png;base64,test',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    // Create mock window
    mockWindow = {
      id: 1,
      setBrowserView: jest.fn(),
      removeBrowserView: jest.fn(),
      getContentBounds: jest.fn(() => ({ width: 800, height: 600 })),
      on: jest.fn(),
      setAlwaysOnTop: jest.fn(),
      isAlwaysOnTop: jest.fn(() => false),
      setTitle: jest.fn(),
      show: jest.fn(),
      focus: jest.fn(),
      close: jest.fn(),
      isDestroyed: jest.fn(() => false),
    };

    // Create mock view
    mockView = {
      setBounds: jest.fn(),
      webContents: {
        loadURL: jest.fn(),
        setUserAgent: jest.fn(),
        on: jest.fn(),
        canGoBack: jest.fn(() => false),
        canGoForward: jest.fn(() => false),
        goBack: jest.fn(),
        goForward: jest.fn(),
        reload: jest.fn(),
        openDevTools: jest.fn(),
        destroy: jest.fn(),
      },
    };

    // Create mock tray
    mockTray = {
      setToolTip: jest.fn(),
      setContextMenu: jest.fn(),
      on: jest.fn(),
      destroy: jest.fn(),
    };

    // Mock constructors
    (BrowserWindow as any).mockImplementation(() => mockWindow);
    (BrowserView as any).mockImplementation(() => mockView);
    (Tray as any).mockImplementation(() => mockTray);

    pinManager = new PinManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPinnedWindow', () => {
    it('should create a pinned window for a site', () => {
      const window = pinManager.createPinnedWindow(testSite);

      expect(BrowserWindow).toHaveBeenCalled();
      expect(BrowserView).toHaveBeenCalled();
      expect(window).toBe(mockWindow);
      expect(mockWindow.setBrowserView).toHaveBeenCalledWith(mockView);
      expect(mockView.webContents.loadURL).toHaveBeenCalledWith(testSite.url);
    });

    it('should set always-on-top if specified in site', () => {
      const siteWithAlwaysOnTop: Site = {
        ...testSite,
        alwaysOnTop: true,
      };

      pinManager.createPinnedWindow(siteWithAlwaysOnTop);

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          alwaysOnTop: true,
        })
      );
    });

    it('should not create duplicate window for same site', () => {
      const window1 = pinManager.createPinnedWindow(testSite);
      const window2 = pinManager.createPinnedWindow(testSite);

      expect(window1).toBe(window2);
      expect(mockWindow.focus).toHaveBeenCalled();
    });

    it('should set user agent mode correctly', () => {
      pinManager.createPinnedWindow(testSite, 'mobile');

      expect(mockView.webContents.setUserAgent).toHaveBeenCalled();
    });
  });

  describe('closePinnedWindow', () => {
    it('should close pinned window and clean up', () => {
      pinManager.createPinnedWindow(testSite);
      pinManager.closePinnedWindow(testSite.id);

      expect(mockWindow.removeBrowserView).toHaveBeenCalledWith(mockView);
      expect(mockWindow.close).toHaveBeenCalled();
    });

    it('should handle closing non-existent window gracefully', () => {
      expect(() => {
        pinManager.closePinnedWindow('non-existent');
      }).not.toThrow();
    });
  });

  describe('setAlwaysOnTop', () => {
    it('should set always-on-top for pinned window', () => {
      pinManager.createPinnedWindow(testSite);
      pinManager.setAlwaysOnTop(testSite.id, true);

      expect(mockWindow.setAlwaysOnTop).toHaveBeenCalledWith(true);
    });

    it('should handle non-existent window gracefully', () => {
      expect(() => {
        pinManager.setAlwaysOnTop('non-existent', true);
      }).not.toThrow();
    });
  });

  describe('isPinned', () => {
    it('should return true for pinned site', () => {
      pinManager.createPinnedWindow(testSite);
      expect(pinManager.isPinned(testSite.id)).toBe(true);
    });

    it('should return false for non-pinned site', () => {
      expect(pinManager.isPinned('non-existent')).toBe(false);
    });
  });

  describe('getPinnedSiteIds', () => {
    it('should return list of pinned site IDs', () => {
      const site1 = { ...testSite, id: 'site-1' };
      const site2 = { ...testSite, id: 'site-2' };

      pinManager.createPinnedWindow(site1);
      pinManager.createPinnedWindow(site2);

      const pinnedIds = pinManager.getPinnedSiteIds();
      expect(pinnedIds).toContain('site-1');
      expect(pinnedIds).toContain('site-2');
      expect(pinnedIds.length).toBe(2);
    });

    it('should return empty array when no sites pinned', () => {
      expect(pinManager.getPinnedSiteIds()).toEqual([]);
    });
  });

  describe('getPinnedWindow', () => {
    it('should return pinned window for site', () => {
      pinManager.createPinnedWindow(testSite);
      const window = pinManager.getPinnedWindow(testSite.id);

      expect(window).toBe(mockWindow);
    });

    it('should return null for non-pinned site', () => {
      expect(pinManager.getPinnedWindow('non-existent')).toBeNull();
    });
  });

  describe('reloadPinnedWindow', () => {
    it('should reload pinned window', () => {
      pinManager.createPinnedWindow(testSite);
      pinManager.reloadPinnedWindow(testSite.id);

      expect(mockView.webContents.reload).toHaveBeenCalled();
    });
  });

  describe('goBackInPinnedWindow', () => {
    it('should navigate back in pinned window', () => {
      mockView.webContents.canGoBack.mockReturnValue(true);
      pinManager.createPinnedWindow(testSite);
      pinManager.goBackInPinnedWindow(testSite.id);

      expect(mockView.webContents.goBack).toHaveBeenCalled();
    });

    it('should not navigate back if cannot go back', () => {
      mockView.webContents.canGoBack.mockReturnValue(false);
      pinManager.createPinnedWindow(testSite);
      pinManager.goBackInPinnedWindow(testSite.id);

      expect(mockView.webContents.goBack).not.toHaveBeenCalled();
    });
  });

  describe('goForwardInPinnedWindow', () => {
    it('should navigate forward in pinned window', () => {
      mockView.webContents.canGoForward.mockReturnValue(true);
      pinManager.createPinnedWindow(testSite);
      pinManager.goForwardInPinnedWindow(testSite.id);

      expect(mockView.webContents.goForward).toHaveBeenCalled();
    });
  });

  describe('openDevToolsForPinnedWindow', () => {
    it('should open DevTools for pinned window', () => {
      pinManager.createPinnedWindow(testSite);
      pinManager.openDevToolsForPinnedWindow(testSite.id);

      expect(mockView.webContents.openDevTools).toHaveBeenCalled();
    });
  });

  describe('closeAllPinnedWindows', () => {
    it('should close all pinned windows', () => {
      const site1 = { ...testSite, id: 'site-1' };
      const site2 = { ...testSite, id: 'site-2' };

      pinManager.createPinnedWindow(site1);
      pinManager.createPinnedWindow(site2);

      pinManager.closeAllPinnedWindows();

      expect(pinManager.getPinnedWindowCount()).toBe(0);
    });
  });

  describe('getPinnedWindowCount', () => {
    it('should return correct count of pinned windows', () => {
      expect(pinManager.getPinnedWindowCount()).toBe(0);

      pinManager.createPinnedWindow(testSite);
      expect(pinManager.getPinnedWindowCount()).toBe(1);

      const site2 = { ...testSite, id: 'site-2' };
      pinManager.createPinnedWindow(site2);
      expect(pinManager.getPinnedWindowCount()).toBe(2);

      pinManager.closePinnedWindow(testSite.id);
      expect(pinManager.getPinnedWindowCount()).toBe(1);
    });
  });
});
