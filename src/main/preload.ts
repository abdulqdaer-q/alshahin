/**
 * Preload script - IPC Bridge between Main and Renderer processes
 *
 * This script runs in the renderer process but has access to Node.js APIs.
 * It uses contextBridge to safely expose IPC methods to the renderer.
 *
 * Security:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - All IPC channels are explicitly whitelisted
 */

import { contextBridge, ipcRenderer } from 'electron';
import { Site, CreateSiteInput, UpdateSiteInput, AppSettings, UserAgentMode, NavigationState } from '../common/types';

/**
 * API exposed to the renderer process
 */
const electronAPI = {
  // ============================================================================
  // Site Management
  // ============================================================================

  site: {
    /**
     * Get all sites
     */
    getAll: (): Promise<Site[]> => {
      return ipcRenderer.invoke('site:getAll');
    },

    /**
     * Get a site by ID
     */
    getById: (id: string): Promise<Site | undefined> => {
      return ipcRenderer.invoke('site:getById', id);
    },

    /**
     * Create a new site
     */
    create: (input: CreateSiteInput): Promise<Site> => {
      return ipcRenderer.invoke('site:create', input);
    },

    /**
     * Update an existing site
     */
    update: (input: UpdateSiteInput): Promise<Site | null> => {
      return ipcRenderer.invoke('site:update', input);
    },

    /**
     * Delete a site
     */
    delete: (id: string): Promise<boolean> => {
      return ipcRenderer.invoke('site:delete', id);
    },

    /**
     * Switch to a different site
     */
    switch: (siteId: string): Promise<boolean> => {
      return ipcRenderer.invoke('site:switch', siteId);
    },

    /**
     * Open site in default browser
     */
    openInBrowser: (siteId: string): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('site:openInBrowser', siteId);
    },

    /**
     * Listen for site cycle events (from keyboard shortcut)
     */
    onSiteCycled: (callback: (siteId: string) => void): void => {
      ipcRenderer.on('site-cycled', (_event, siteId) => callback(siteId));
    },

    /**
     * Remove site cycle listener
     */
    removeSiteCycledListener: (): void => {
      ipcRenderer.removeAllListeners('site-cycled');
    },
  },

  // ============================================================================
  // Navigation Controls
  // ============================================================================

  navigation: {
    /**
     * Navigate back in history
     */
    back: (): Promise<void> => {
      return ipcRenderer.invoke('navigation:back');
    },

    /**
     * Navigate forward in history
     */
    forward: (): Promise<void> => {
      return ipcRenderer.invoke('navigation:forward');
    },

    /**
     * Reload current page
     */
    reload: (): Promise<void> => {
      return ipcRenderer.invoke('navigation:reload');
    },

    /**
     * Stop loading
     */
    stop: (): Promise<void> => {
      return ipcRenderer.invoke('navigation:stop');
    },

    /**
     * Load a specific URL
     */
    loadUrl: (url: string): Promise<void> => {
      return ipcRenderer.invoke('navigation:loadUrl', url);
    },

    /**
     * Listen for navigation state changes
     */
    onStateChange: (callback: (state: NavigationState) => void): void => {
      ipcRenderer.on('navigation-state-changed', (_event, state) => callback(state));
    },

    /**
     * Remove navigation state change listener
     */
    removeStateChangeListener: (): void => {
      ipcRenderer.removeAllListeners('navigation-state-changed');
    },
  },

  // ============================================================================
  // Settings
  // ============================================================================

  settings: {
    /**
     * Get all settings
     */
    getAll: (): Promise<AppSettings> => {
      return ipcRenderer.invoke('settings:getAll');
    },

    /**
     * Update settings
     */
    update: (updates: Partial<AppSettings>): Promise<AppSettings> => {
      return ipcRenderer.invoke('settings:update', updates);
    },

    /**
     * Set user agent mode (desktop or mobile)
     */
    setUserAgent: (mode: UserAgentMode): Promise<AppSettings> => {
      return ipcRenderer.invoke('settings:setUserAgent', mode);
    },
  },

  // ============================================================================
  // Import/Export
  // ============================================================================

  importExport: {
    /**
     * Show import file dialog and return selected path
     */
    showImportDialog: (): Promise<string | null> => {
      return ipcRenderer.invoke('import:showDialog');
    },

    /**
     * Import sites from a file
     */
    importFromFile: (filePath: string, merge: boolean): Promise<{ success: boolean; error?: string }> => {
      return ipcRenderer.invoke('import:fromFile', filePath, merge);
    },

    /**
     * Show export file dialog and return selected path
     */
    showExportDialog: (): Promise<string | null> => {
      return ipcRenderer.invoke('export:showDialog');
    },

    /**
     * Export sites to a file
     */
    exportToFile: (filePath: string): Promise<{ success: boolean; error?: string }> => {
      return ipcRenderer.invoke('export:toFile', filePath);
    },

    /**
     * Get export data as JSON string
     */
    exportToJson: (): Promise<string> => {
      return ipcRenderer.invoke('export:toJson');
    },
  },

  // ============================================================================
  // Pin Management
  // ============================================================================

  pin: {
    /**
     * Create a pinned window for a site
     */
    create: (siteId: string): Promise<{ success: boolean; error?: string; windowId?: number }> => {
      return ipcRenderer.invoke('pin:create', siteId);
    },

    /**
     * Close a pinned window
     */
    close: (siteId: string): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('pin:close', siteId);
    },

    /**
     * Toggle pin state for a site
     */
    toggle: (siteId: string): Promise<{ success: boolean; pinned: boolean; error?: string }> => {
      return ipcRenderer.invoke('pin:toggle', siteId);
    },

    /**
     * Check if a site is pinned
     */
    isPinned: (siteId: string): Promise<boolean> => {
      return ipcRenderer.invoke('pin:isPinned', siteId);
    },

    /**
     * Set always-on-top for a pinned window
     */
    setAlwaysOnTop: (siteId: string, alwaysOnTop: boolean): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('pin:setAlwaysOnTop', siteId, alwaysOnTop);
    },

    /**
     * Open DevTools for a pinned window
     */
    openDevTools: (siteId: string): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('pin:openDevTools', siteId);
    },
  },

  // ============================================================================
  // Popover Window
  // ============================================================================

  popover: {
    /**
     * Set always-on-top for popover window
     */
    setAlwaysOnTop: (alwaysOnTop: boolean): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('popover:setAlwaysOnTop', alwaysOnTop);
    },

    /**
     * Check if popover is always on top
     */
    isAlwaysOnTop: (): Promise<boolean> => {
      return ipcRenderer.invoke('popover:isAlwaysOnTop');
    },
  },

  // ============================================================================
  // Ad-Blocking
  // ============================================================================

  adblock: {
    /**
     * Enable or disable ad-blocking
     */
    setEnabled: (enabled: boolean): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('adblock:setEnabled', enabled);
    },

    /**
     * Check if ad-blocking is enabled
     */
    isEnabled: (): Promise<boolean> => {
      return ipcRenderer.invoke('adblock:isEnabled');
    },
  },

  // ============================================================================
  // Icon Management
  // ============================================================================

  icon: {
    /**
     * Save a custom icon for a site
     */
    save: (siteId: string, iconData: string): Promise<{ success: boolean; iconPath?: string; error?: string }> => {
      return ipcRenderer.invoke('icon:save', siteId, iconData);
    },

    /**
     * Delete a custom icon
     */
    delete: (siteId: string): Promise<{ success: boolean; error?: string }> => {
      return ipcRenderer.invoke('icon:delete', siteId);
    },

    /**
     * Get icon path for a site
     */
    getPath: (siteId: string): Promise<string | null> => {
      return ipcRenderer.invoke('icon:getPath', siteId);
    },
  },

  // ============================================================================
  // DevTools
  // ============================================================================

  devtools: {
    /**
     * Open DevTools for current BrowserView
     */
    open: (): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('devtools:open');
    },

    /**
     * Open DevTools for popover window
     */
    openPopover: (): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('devtools:openPopover');
    },
  },

  // ============================================================================
  // Utility
  // ============================================================================

  app: {
    /**
     * Get the storage file path
     */
    getStoragePath: (): Promise<string> => {
      return ipcRenderer.invoke('app:getStoragePath');
    },
  },

  // Platform detection
  platform: process.platform,
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

/**
 * Type definitions for TypeScript
 */
export type ElectronAPI = typeof electronAPI;

/**
 * Global window interface extension
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
