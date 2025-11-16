/**
 * Pin Manager - Handles standalone pinned windows
 *
 * Features:
 * - Create standalone windows for pinned sites
 * - Always-on-top functionality
 * - Custom tray icons per pinned window
 * - BrowserView management for pinned windows
 */

import { BrowserWindow, BrowserView, screen, nativeImage, Tray, Menu } from 'electron';
import * as path from 'path';
import { Site, USER_AGENTS, PinnedWindowState } from '../common/types';
import { sessionManager } from './sessionManager';

/**
 * Pin Manager for handling standalone pinned windows
 */
export class PinManager {
  private pinnedWindows: Map<string, PinnedWindowState> = new Map();
  private pinnedTrays: Map<string, Tray> = new Map();

  /**
   * Create a pinned window for a site
   * @param site - Site to pin
   * @param userAgentMode - User agent mode to use
   * @returns The created BrowserWindow
   */
  createPinnedWindow(site: Site, userAgentMode: 'desktop' | 'mobile' = 'desktop'): BrowserWindow {
    // If window already exists, focus it
    const existing = this.pinnedWindows.get(site.id);
    if (existing) {
      existing.window.focus();
      return existing.window;
    }

    // Create window
    const window = new BrowserWindow({
      width: 1024,
      height: 768,
      title: site.name,
      frame: true, // Show frame for pinned windows
      show: true,
      alwaysOnTop: site.alwaysOnTop || false,
      backgroundColor: '#ffffff',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      }
    });

    // Create BrowserView with isolated session
    const view = new BrowserView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        session: sessionManager.getSessionForSite(site.id)
      }
    });

    window.setBrowserView(view);

    // Position BrowserView to fill the window
    const updateBounds = () => {
      const bounds = window.getContentBounds();
      view.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    };

    updateBounds();
    window.on('resize', updateBounds);

    // Set user agent
    view.webContents.setUserAgent(USER_AGENTS[userAgentMode]);

    // Load the site
    view.webContents.loadURL(site.url);

    // Track window state
    this.pinnedWindows.set(site.id, {
      siteId: site.id,
      window,
      view
    });

    // Create tray icon if custom icon is available
    if (site.icon || site.iconPath) {
      this.createTrayForPinnedWindow(site, window);
    }

    // Handle window close
    window.on('closed', () => {
      this.closePinnedWindow(site.id);
    });

    // Navigation events for title updates
    view.webContents.on('page-title-updated', (_event, title) => {
      window.setTitle(`${site.name} - ${title}`);
    });

    return window;
  }

  /**
   * Close a pinned window
   * @param siteId - Site ID
   */
  closePinnedWindow(siteId: string): void {
    const pinnedState = this.pinnedWindows.get(siteId);
    if (pinnedState) {
      // Remove BrowserView
      pinnedState.window.removeBrowserView(pinnedState.view);
      (pinnedState.view.webContents as any).destroy();

      // Close window
      if (!pinnedState.window.isDestroyed()) {
        pinnedState.window.close();
      }

      this.pinnedWindows.delete(siteId);
    }

    // Remove tray icon
    const tray = this.pinnedTrays.get(siteId);
    if (tray) {
      tray.destroy();
      this.pinnedTrays.delete(siteId);
    }
  }

  /**
   * Toggle always-on-top for a pinned window
   * @param siteId - Site ID
   * @param alwaysOnTop - Whether window should be always on top
   */
  setAlwaysOnTop(siteId: string, alwaysOnTop: boolean): void {
    const pinnedState = this.pinnedWindows.get(siteId);
    if (pinnedState) {
      pinnedState.window.setAlwaysOnTop(alwaysOnTop);
    }
  }

  /**
   * Check if a site has a pinned window
   * @param siteId - Site ID
   */
  isPinned(siteId: string): boolean {
    return this.pinnedWindows.has(siteId);
  }

  /**
   * Get all pinned site IDs
   */
  getPinnedSiteIds(): string[] {
    return Array.from(this.pinnedWindows.keys());
  }

  /**
   * Get pinned window for a site
   * @param siteId - Site ID
   */
  getPinnedWindow(siteId: string): BrowserWindow | null {
    const pinnedState = this.pinnedWindows.get(siteId);
    return pinnedState ? pinnedState.window : null;
  }

  /**
   * Create a tray icon for a pinned window
   * @param site - Site information
   * @param window - BrowserWindow to associate with
   */
  private createTrayForPinnedWindow(site: Site, window: BrowserWindow): void {
    try {
      let trayIcon: Electron.NativeImage;

      if (site.iconPath) {
        // Load from file path
        trayIcon = nativeImage.createFromPath(site.iconPath);
      } else if (site.icon) {
        // Load from base64 or URL
        if (site.icon.startsWith('data:')) {
          const base64Data = site.icon.split(',')[1];
          trayIcon = nativeImage.createFromDataURL(site.icon);
        } else {
          // Fallback to default icon
          trayIcon = nativeImage.createFromPath(
            path.join(__dirname, '../../assets/iconTemplate.png')
          );
        }
      } else {
        // Use default icon
        trayIcon = nativeImage.createFromPath(
          path.join(__dirname, '../../assets/iconTemplate.png')
        );
      }

      // Resize icon for tray (16x16 on macOS)
      trayIcon = trayIcon.resize({ width: 16, height: 16 });

      const tray = new Tray(trayIcon);
      tray.setToolTip(site.name);

      // Create context menu
      const contextMenu = Menu.buildFromTemplate([
        {
          label: `Show ${site.name}`,
          click: () => {
            window.show();
            window.focus();
          }
        },
        {
          label: window.isAlwaysOnTop() ? 'Disable Always on Top' : 'Enable Always on Top',
          click: () => {
            const newState = !window.isAlwaysOnTop();
            window.setAlwaysOnTop(newState);
            this.createTrayForPinnedWindow(site, window); // Recreate menu
          }
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          click: () => {
            this.closePinnedWindow(site.id);
          }
        }
      ]);

      tray.setContextMenu(contextMenu);

      // Click to show window
      tray.on('click', () => {
        window.show();
        window.focus();
      });

      this.pinnedTrays.set(site.id, tray);
    } catch (error) {
      console.error('Failed to create tray icon for pinned window:', error);
    }
  }

  /**
   * Update tray icon for a pinned window
   * @param site - Updated site information
   */
  updateTrayIcon(site: Site): void {
    const pinnedState = this.pinnedWindows.get(site.id);
    if (pinnedState) {
      // Destroy old tray
      const oldTray = this.pinnedTrays.get(site.id);
      if (oldTray) {
        oldTray.destroy();
        this.pinnedTrays.delete(site.id);
      }

      // Create new tray with updated icon
      this.createTrayForPinnedWindow(site, pinnedState.window);
    }
  }

  /**
   * Reload a pinned window
   * @param siteId - Site ID
   */
  reloadPinnedWindow(siteId: string): void {
    const pinnedState = this.pinnedWindows.get(siteId);
    if (pinnedState) {
      pinnedState.view.webContents.reload();
    }
  }

  /**
   * Navigate back in a pinned window
   * @param siteId - Site ID
   */
  goBackInPinnedWindow(siteId: string): void {
    const pinnedState = this.pinnedWindows.get(siteId);
    if (pinnedState && pinnedState.view.webContents.canGoBack()) {
      pinnedState.view.webContents.goBack();
    }
  }

  /**
   * Navigate forward in a pinned window
   * @param siteId - Site ID
   */
  goForwardInPinnedWindow(siteId: string): void {
    const pinnedState = this.pinnedWindows.get(siteId);
    if (pinnedState && pinnedState.view.webContents.canGoForward()) {
      pinnedState.view.webContents.goForward();
    }
  }

  /**
   * Open DevTools for a pinned window
   * @param siteId - Site ID
   */
  openDevToolsForPinnedWindow(siteId: string): void {
    const pinnedState = this.pinnedWindows.get(siteId);
    if (pinnedState) {
      pinnedState.view.webContents.openDevTools();
    }
  }

  /**
   * Close all pinned windows
   */
  closeAllPinnedWindows(): void {
    const siteIds = Array.from(this.pinnedWindows.keys());
    siteIds.forEach(siteId => this.closePinnedWindow(siteId));
  }

  /**
   * Get the number of pinned windows
   */
  getPinnedWindowCount(): number {
    return this.pinnedWindows.size;
  }
}

// Export singleton instance
export const pinManager = new PinManager();
