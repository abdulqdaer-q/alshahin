/**
 * Global type definitions for the application
 * This file makes window.electronAPI available to TypeScript across all files
 */

import type { Site, CreateSiteInput, UpdateSiteInput, AppSettings, UserAgentMode, NavigationState } from './common/types';

interface ElectronAPI {
  // Site Management
  site: {
    getAll: () => Promise<Site[]>;
    getById: (id: string) => Promise<Site | undefined>;
    create: (input: CreateSiteInput) => Promise<Site>;
    update: (input: UpdateSiteInput) => Promise<Site | null>;
    delete: (id: string) => Promise<boolean>;
    switch: (siteId: string) => Promise<boolean>;
    openInBrowser: (siteId: string) => Promise<{ success: boolean }>;
    onSiteCycled: (callback: (siteId: string) => void) => void;
    removeSiteCycledListener: () => void;
  };

  // Navigation Controls
  navigation: {
    back: () => Promise<void>;
    forward: () => Promise<void>;
    reload: () => Promise<void>;
    loadUrl: (url: string) => Promise<void>;
    onStateChange: (callback: (state: NavigationState) => void) => void;
  };

  // Settings
  settings: {
    getAll: () => Promise<AppSettings>;
    setUserAgent: (mode: UserAgentMode) => Promise<void>;
  };

  // Import/Export
  importExport: {
    showImportDialog: () => Promise<string | null>;
    showExportDialog: () => Promise<string | null>;
    importFromFile: (filePath: string, merge: boolean) => Promise<{ success: boolean; error?: string }>;
    exportToFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    exportToJson: () => Promise<string>;
  };

  // Pin Management
  pin: {
    create: (siteId: string) => Promise<{ success: boolean; error?: string; windowId?: number }>;
    close: (siteId: string) => Promise<{ success: boolean }>;
    toggle: (siteId: string) => Promise<{ success: boolean; pinned: boolean; error?: string }>;
    isPinned: (siteId: string) => Promise<boolean>;
    setAlwaysOnTop: (siteId: string, alwaysOnTop: boolean) => Promise<{ success: boolean }>;
    openDevTools: (siteId: string) => Promise<{ success: boolean }>;
  };

  // Popover Window
  popover: {
    setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<{ success: boolean }>;
    isAlwaysOnTop: () => Promise<boolean>;
  };

  // Ad-Blocking
  adblock: {
    setEnabled: (enabled: boolean) => Promise<{ success: boolean }>;
    isEnabled: () => Promise<boolean>;
  };

  // Icon Management
  icon: {
    save: (siteId: string, iconData: string) => Promise<{ success: boolean; iconPath?: string; error?: string }>;
    delete: (siteId: string) => Promise<{ success: boolean; error?: string }>;
    getPath: (siteId: string) => Promise<string | null>;
  };

  // DevTools
  devtools: {
    open: () => Promise<{ success: boolean }>;
    openPopover: () => Promise<{ success: boolean }>;
  };

  // App Utilities
  app: {
    getStoragePath: () => Promise<string>;
  };

  // Platform
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
