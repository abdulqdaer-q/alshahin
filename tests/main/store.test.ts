/**
 * Tests for the storage layer (store.ts)
 */

import { siteStore, settingsStore, importExport, getStoragePath } from '../../src/main/store';
import { Site, AppSettings } from '../../src/common/types';
import * as fs from 'fs';

// Mock fs for file operations
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(() => Promise.resolve()),
    readFile: jest.fn(() => Promise.resolve('{}')),
  },
}));

describe('Storage Layer', () => {
  beforeEach(() => {
    // Clear all sites before each test
    siteStore.clear();
    settingsStore.reset();
    jest.clearAllMocks();
  });

  describe('siteStore', () => {
    describe('getAll', () => {
      it('should return empty array when no sites exist', () => {
        const sites = siteStore.getAll();
        expect(sites).toEqual([]);
      });

      it('should return all sites', () => {
        const site1 = siteStore.add({ name: 'Test 1', url: 'https://test1.com' });
        const site2 = siteStore.add({ name: 'Test 2', url: 'https://test2.com' });

        const sites = siteStore.getAll();
        expect(sites).toHaveLength(2);
        expect(sites).toContainEqual(site1);
        expect(sites).toContainEqual(site2);
      });
    });

    describe('getById', () => {
      it('should return undefined for non-existent site', () => {
        const site = siteStore.getById('non-existent-id');
        expect(site).toBeUndefined();
      });

      it('should return the correct site by ID', () => {
        const created = siteStore.add({ name: 'Test', url: 'https://test.com' });
        const found = siteStore.getById(created.id);

        expect(found).toBeDefined();
        expect(found?.id).toBe(created.id);
        expect(found?.name).toBe('Test');
      });
    });

    describe('add', () => {
      it('should add a new site with auto-generated fields', () => {
        const site = siteStore.add({
          name: 'GitHub',
          url: 'https://github.com',
          icon: 'https://github.com/favicon.ico',
        });

        expect(site).toMatchObject({
          name: 'GitHub',
          url: 'https://github.com',
          icon: 'https://github.com/favicon.ico',
        });
        expect(site.id).toBeDefined();
        expect(site.createdAt).toBeDefined();
        expect(site.updatedAt).toBeDefined();
        expect(typeof site.id).toBe('string');
        expect(typeof site.createdAt).toBe('number');
        expect(typeof site.updatedAt).toBe('number');
      });

      it('should add a site without optional icon', () => {
        const site = siteStore.add({
          name: 'Test',
          url: 'https://test.com',
        });

        expect(site.name).toBe('Test');
        expect(site.icon).toBeUndefined();
      });

      it('should generate unique IDs for different sites', () => {
        const site1 = siteStore.add({ name: 'Site 1', url: 'https://site1.com' });
        const site2 = siteStore.add({ name: 'Site 2', url: 'https://site2.com' });

        expect(site1.id).not.toBe(site2.id);
      });
    });

    describe('update', () => {
      it('should return null for non-existent site', () => {
        const result = siteStore.update('non-existent-id', { name: 'Updated' });
        expect(result).toBeNull();
      });

      it('should update site name', () => {
        const site = siteStore.add({ name: 'Original', url: 'https://test.com' });
        const updated = siteStore.update(site.id, { name: 'Updated' });

        expect(updated).toBeDefined();
        expect(updated?.name).toBe('Updated');
        expect(updated?.url).toBe('https://test.com');
      });

      it('should update site URL', () => {
        const site = siteStore.add({ name: 'Test', url: 'https://old.com' });
        const updated = siteStore.update(site.id, { url: 'https://new.com' });

        expect(updated?.url).toBe('https://new.com');
      });

      it('should update site icon', () => {
        const site = siteStore.add({ name: 'Test', url: 'https://test.com' });
        const updated = siteStore.update(site.id, { icon: 'https://new-icon.png' });

        expect(updated?.icon).toBe('https://new-icon.png');
      });

      it('should update multiple fields at once', () => {
        const site = siteStore.add({ name: 'Test', url: 'https://test.com' });
        const updated = siteStore.update(site.id, {
          name: 'New Name',
          url: 'https://new.com',
          icon: 'https://icon.png',
        });

        expect(updated?.name).toBe('New Name');
        expect(updated?.url).toBe('https://new.com');
        expect(updated?.icon).toBe('https://icon.png');
      });

      it('should update updatedAt timestamp', () => {
        const site = siteStore.add({ name: 'Test', url: 'https://test.com' });
        const originalUpdatedAt = site.updatedAt;

        // Wait a bit to ensure timestamp difference
        jest.advanceTimersByTime(10);

        const updated = siteStore.update(site.id, { name: 'Updated' });
        expect(updated?.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
      });

      it('should not modify createdAt timestamp', () => {
        const site = siteStore.add({ name: 'Test', url: 'https://test.com' });
        const updated = siteStore.update(site.id, { name: 'Updated' });

        expect(updated?.createdAt).toBe(site.createdAt);
      });
    });

    describe('delete', () => {
      it('should return false for non-existent site', () => {
        const result = siteStore.delete('non-existent-id');
        expect(result).toBe(false);
      });

      it('should delete a site and return true', () => {
        const site = siteStore.add({ name: 'Test', url: 'https://test.com' });
        const result = siteStore.delete(site.id);

        expect(result).toBe(true);
        expect(siteStore.getById(site.id)).toBeUndefined();
      });

      it('should remove site from the list', () => {
        const site1 = siteStore.add({ name: 'Site 1', url: 'https://site1.com' });
        const site2 = siteStore.add({ name: 'Site 2', url: 'https://site2.com' });

        siteStore.delete(site1.id);

        const sites = siteStore.getAll();
        expect(sites).toHaveLength(1);
        expect(sites[0].id).toBe(site2.id);
      });
    });

    describe('clear', () => {
      it('should remove all sites', () => {
        siteStore.add({ name: 'Site 1', url: 'https://site1.com' });
        siteStore.add({ name: 'Site 2', url: 'https://site2.com' });

        siteStore.clear();

        expect(siteStore.getAll()).toHaveLength(0);
      });
    });
  });

  describe('settingsStore', () => {
    describe('getAll', () => {
      it('should return default settings', () => {
        const settings = settingsStore.getAll();

        expect(settings).toMatchObject({
          userAgentMode: 'desktop',
          windowWidth: 800,
          windowHeight: 600,
        });
      });
    });

    describe('update', () => {
      it('should update user agent mode', () => {
        const updated = settingsStore.update({ userAgentMode: 'mobile' });
        expect(updated.userAgentMode).toBe('mobile');
      });

      it('should update window dimensions', () => {
        const updated = settingsStore.update({
          windowWidth: 1024,
          windowHeight: 768,
        });

        expect(updated.windowWidth).toBe(1024);
        expect(updated.windowHeight).toBe(768);
      });

      it('should update active site ID', () => {
        const updated = settingsStore.update({ activeSiteId: 'test-site-id' });
        expect(updated.activeSiteId).toBe('test-site-id');
      });

      it('should preserve existing settings when updating', () => {
        settingsStore.update({ userAgentMode: 'mobile' });
        const updated = settingsStore.update({ windowWidth: 1024 });

        expect(updated.userAgentMode).toBe('mobile');
        expect(updated.windowWidth).toBe(1024);
      });
    });

    describe('reset', () => {
      it('should reset settings to defaults', () => {
        settingsStore.update({
          userAgentMode: 'mobile',
          windowWidth: 1024,
          activeSiteId: 'test-id',
        });

        const reset = settingsStore.reset();

        expect(reset).toMatchObject({
          userAgentMode: 'desktop',
          windowWidth: 800,
          windowHeight: 600,
        });
        expect(reset.activeSiteId).toBeUndefined();
      });
    });
  });

  describe('importExport', () => {
    describe('exportToFile', () => {
      it('should export sites and settings to a file', async () => {
        siteStore.add({ name: 'Test Site', url: 'https://test.com' });
        settingsStore.update({ userAgentMode: 'mobile' });

        await importExport.exportToFile('/mock/path/export.json');

        expect(fs.promises.writeFile).toHaveBeenCalled();
        const writeCall = (fs.promises.writeFile as jest.Mock).mock.calls[0];
        expect(writeCall[0]).toBe('/mock/path/export.json');

        const exportedData = JSON.parse(writeCall[1]);
        expect(exportedData).toHaveProperty('version');
        expect(exportedData).toHaveProperty('exportedAt');
        expect(exportedData).toHaveProperty('sites');
        expect(exportedData).toHaveProperty('settings');
        expect(exportedData.sites).toHaveLength(1);
      });
    });

    describe('exportToJson', () => {
      it('should export data as JSON string', () => {
        siteStore.add({ name: 'Test', url: 'https://test.com' });

        const json = importExport.exportToJson();
        const data = JSON.parse(json);

        expect(data).toHaveProperty('version');
        expect(data).toHaveProperty('sites');
        expect(data.sites).toHaveLength(1);
      });
    });

    describe('importFromFile', () => {
      it('should import sites from a file (replace mode)', async () => {
        // Add initial sites
        siteStore.add({ name: 'Existing', url: 'https://existing.com' });

        // Mock file content
        const importData = {
          version: '1.0.0',
          exportedAt: Date.now(),
          sites: [
            {
              id: 'imported-1',
              name: 'Imported Site',
              url: 'https://imported.com',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          settings: {
            userAgentMode: 'mobile' as const,
            windowWidth: 1024,
            windowHeight: 768,
          },
        };

        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(importData));

        await importExport.importFromFile('/mock/path/import.json', false);

        // Should replace existing sites
        const sites = siteStore.getAll();
        expect(sites).toHaveLength(1);
        expect(sites[0].name).toBe('Imported Site');

        // Should update settings
        const settings = settingsStore.getAll();
        expect(settings.userAgentMode).toBe('mobile');
      });

      it('should import sites from a file (merge mode)', async () => {
        // Add initial sites
        siteStore.add({ name: 'Existing', url: 'https://existing.com' });

        const importData = {
          version: '1.0.0',
          exportedAt: Date.now(),
          sites: [
            {
              id: 'imported-1',
              name: 'Imported Site',
              url: 'https://imported.com',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          settings: {
            userAgentMode: 'mobile' as const,
            windowWidth: 1024,
            windowHeight: 768,
          },
        };

        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(importData));

        await importExport.importFromFile('/mock/path/import.json', true);

        // Should merge with existing sites
        const sites = siteStore.getAll();
        expect(sites).toHaveLength(2);
      });

      it('should not import duplicate URLs in merge mode', async () => {
        siteStore.add({ name: 'Existing', url: 'https://test.com' });

        const importData = {
          version: '1.0.0',
          exportedAt: Date.now(),
          sites: [
            {
              id: 'imported-1',
              name: 'Duplicate',
              url: 'https://test.com', // Same URL
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          settings: {},
        };

        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(importData));

        await importExport.importFromFile('/mock/path/import.json', true);

        const sites = siteStore.getAll();
        expect(sites).toHaveLength(1); // Should not add duplicate
      });
    });

    describe('importFromJson', () => {
      it('should import from JSON string', () => {
        const importData = {
          version: '1.0.0',
          exportedAt: Date.now(),
          sites: [
            {
              id: 'test-1',
              name: 'Test Site',
              url: 'https://test.com',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          settings: {
            userAgentMode: 'mobile' as const,
            windowWidth: 1024,
            windowHeight: 768,
          },
        };

        importExport.importFromJson(JSON.stringify(importData), false);

        const sites = siteStore.getAll();
        expect(sites).toHaveLength(1);
        expect(sites[0].name).toBe('Test Site');
      });
    });
  });

  describe('getStoragePath', () => {
    it('should return the storage path', () => {
      const path = getStoragePath();
      expect(typeof path).toBe('string');
      expect(path).toContain('config.json');
    });
  });
});
