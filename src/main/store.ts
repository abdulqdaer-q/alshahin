/**
 * Storage management using electron-store
 *
 * This module handles persistent storage of sites and application settings.
 * Data is stored in JSON format at the OS-specific app data directory:
 * - macOS: ~/Library/Application Support/electron-menubar-app/config.json
 * - Linux: ~/.config/electron-menubar-app/config.json
 * - Windows: %APPDATA%/electron-menubar-app/config.json
 */

import Store from 'electron-store';
import { Site, AppSettings, ExportData } from '../common/types';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Schema for the electron-store
 */
interface StoreSchema {
  sites: Site[];
  settings: AppSettings;
}

/**
 * Default application settings
 */
const DEFAULT_SETTINGS: AppSettings = {
  userAgentMode: 'desktop',
  windowWidth: 800,
  windowHeight: 600,
};

/**
 * Store instance with type-safe schema
 */
const store = new Store<StoreSchema>({
  defaults: {
    sites: [],
    settings: DEFAULT_SETTINGS,
  },
  name: 'config', // Creates config.json
  cwd: app.getPath('userData'), // OS-specific app data directory
});

/**
 * Log the storage file path on initialization
 */
console.log('Storage file path:', store.path);

/**
 * Site management functions
 */
export const siteStore = {
  /**
   * Get all sites
   */
  getAll(): Site[] {
    return store.get('sites', []);
  },

  /**
   * Get a single site by ID
   */
  getById(id: string): Site | undefined {
    const sites = store.get('sites', []);
    return sites.find(site => site.id === id);
  },

  /**
   * Add a new site
   */
  add(site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Site {
    const sites = store.get('sites', []);
    const newSite: Site = {
      ...site,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    sites.push(newSite);
    store.set('sites', sites);
    return newSite;
  },

  /**
   * Update an existing site
   */
  update(id: string, updates: Partial<Omit<Site, 'id' | 'createdAt'>>): Site | null {
    const sites = store.get('sites', []);
    const index = sites.findIndex(site => site.id === id);

    if (index === -1) {
      return null;
    }

    const updatedSite: Site = {
      ...sites[index],
      ...updates,
      updatedAt: Date.now(),
    };

    sites[index] = updatedSite;
    store.set('sites', sites);
    return updatedSite;
  },

  /**
   * Delete a site by ID
   */
  delete(id: string): boolean {
    const sites = store.get('sites', []);
    const filtered = sites.filter(site => site.id !== id);

    if (filtered.length === sites.length) {
      return false; // Site not found
    }

    store.set('sites', filtered);
    return true;
  },

  /**
   * Clear all sites
   */
  clear(): void {
    store.set('sites', []);
  },
};

/**
 * Settings management functions
 */
export const settingsStore = {
  /**
   * Get all settings
   */
  getAll(): AppSettings {
    return store.get('settings', DEFAULT_SETTINGS);
  },

  /**
   * Update settings
   */
  update(updates: Partial<AppSettings>): AppSettings {
    const current = store.get('settings', DEFAULT_SETTINGS);
    const updated = { ...current, ...updates };
    store.set('settings', updated);
    return updated;
  },

  /**
   * Reset settings to defaults
   */
  reset(): AppSettings {
    store.set('settings', DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },
};

/**
 * Import/Export functions
 */
export const importExport = {
  /**
   * Export all data to a JSON file
   */
  async exportToFile(filePath: string): Promise<void> {
    const data: ExportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      sites: siteStore.getAll(),
      settings: settingsStore.getAll(),
    };

    await fs.promises.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      'utf-8'
    );

    // Save the export path for future reference
    settingsStore.update({ lastExportPath: path.dirname(filePath) });
  },

  /**
   * Export data as JSON string
   */
  exportToJson(): string {
    const data: ExportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      sites: siteStore.getAll(),
      settings: settingsStore.getAll(),
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import data from a JSON file
   */
  async importFromFile(filePath: string, merge: boolean = false): Promise<void> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const data: ExportData = JSON.parse(content);

    if (!merge) {
      // Replace all data
      store.set('sites', data.sites || []);
      store.set('settings', data.settings || DEFAULT_SETTINGS);
    } else {
      // Merge sites (avoid duplicates by URL)
      const existingSites = siteStore.getAll();
      const existingUrls = new Set(existingSites.map(s => s.url));

      const newSites = (data.sites || []).filter(site => !existingUrls.has(site.url));
      store.set('sites', [...existingSites, ...newSites]);

      // Update settings
      const currentSettings = settingsStore.getAll();
      store.set('settings', { ...currentSettings, ...data.settings });
    }

    // Save the import path
    settingsStore.update({ lastExportPath: path.dirname(filePath) });
  },

  /**
   * Import data from JSON string
   */
  importFromJson(jsonString: string, merge: boolean = false): void {
    const data: ExportData = JSON.parse(jsonString);

    if (!merge) {
      store.set('sites', data.sites || []);
      store.set('settings', data.settings || DEFAULT_SETTINGS);
    } else {
      const existingSites = siteStore.getAll();
      const existingUrls = new Set(existingSites.map(s => s.url));

      const newSites = (data.sites || []).filter(site => !existingUrls.has(site.url));
      store.set('sites', [...existingSites, ...newSites]);

      const currentSettings = settingsStore.getAll();
      store.set('settings', { ...currentSettings, ...data.settings });
    }
  },
};

/**
 * Get the storage file path
 */
export function getStoragePath(): string {
  return store.path;
}

/**
 * Generate a unique ID for sites
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the raw store instance (for advanced usage)
 */
export function getRawStore(): Store<StoreSchema> {
  return store;
}
