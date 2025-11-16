/**
 * Main process for Electron menubar application
 *
 * Manages:
 * - Tray icon and menubar window
 * - BrowserView instances for each site
 * - IPC communication with renderer
 * - Navigation controls and user agent switching
 */

import { app, BrowserWindow, BrowserView, Tray, screen, nativeImage, ipcMain, dialog, globalShortcut } from 'electron';
import * as path from 'path';
import { siteStore, settingsStore, importExport, getStoragePath, iconStore } from './store';
import { Site, CreateSiteInput, UpdateSiteInput, UserAgentMode, USER_AGENTS, NavigationState } from '../common/types';
import { sessionManager } from './sessionManager';
import { pinManager } from './pinManager';

let tray: Tray | null = null;
let window: BrowserWindow | null = null;
let currentBrowserView: BrowserView | null = null;
let currentSiteId: string | null = null;

// Window dimensions for the UI chrome (toolbar, tabs, etc.)
const UI_CHROME_HEIGHT = 120; // Height reserved for UI controls

/**
 * Create the main menubar window
 */
function createWindow(): void {
  const settings = settingsStore.getAll();

  window = new BrowserWindow({
    width: settings.windowWidth,
    height: settings.windowHeight,
    show: false,
    frame: false,
    resizable: true,
    transparent: false,
    alwaysOnTop: settings.popoverAlwaysOnTop || false,
    backgroundColor: '#f5f5f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Hide window when it loses focus (menubar behavior)
  window.on('blur', () => {
    if (window && !window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });

  // Save window dimensions on resize
  window.on('resize', () => {
    if (window) {
      const [width, height] = window.getSize();
      settingsStore.update({ windowWidth: width, windowHeight: height });
    }
  });

  window.on('closed', () => {
    destroyCurrentBrowserView();
    window = null;
  });

  // Log storage path to console
  console.log('Storage path:', getStoragePath());
}

/**
 * Create the system tray icon
 */
function createTray(): void {
  const iconPath = path.join(__dirname, '../../assets/iconTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);

  const resizedIcon = icon.resize({ width: 16, height: 16 });
  resizedIcon.setTemplateImage(true);

  tray = new Tray(resizedIcon);
  tray.setToolTip('Web Apps Menubar');

  tray.on('click', () => {
    toggleWindow();
  });
}

/**
 * Toggle window visibility
 */
function toggleWindow(): void {
  if (!window) {
    createWindow();
  }

  if (window && window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
}

/**
 * Show and position the window near the tray icon
 */
function showWindow(): void {
  if (!tray || !window) return;

  const trayBounds = tray.getBounds();
  const windowBounds = window.getBounds();
  const primaryDisplay = screen.getPrimaryDisplay();
  const displayBounds = primaryDisplay.bounds;

  let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  let y: number;

  if (process.platform === 'darwin') {
    y = Math.round(trayBounds.y + trayBounds.height);
  } else {
    y = Math.round(trayBounds.y - windowBounds.height);
  }

  // Keep window within screen bounds
  if (x + windowBounds.width > displayBounds.x + displayBounds.width) {
    x = displayBounds.x + displayBounds.width - windowBounds.width;
  }
  if (x < displayBounds.x) {
    x = displayBounds.x;
  }

  window.setPosition(x, y, false);
  window.show();
  window.focus();
}

/**
 * Create a BrowserView for a site
 */
function createBrowserView(site: Site): BrowserView {
  if (!window) throw new Error('Window not initialized');

  const settings = settingsStore.getAll();
  const userAgent = USER_AGENTS[settings.userAgentMode];

  // Get isolated session for this site
  const siteSession = sessionManager.getSessionForSite(site.id);

  const browserView = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true, // Enhanced security
      webSecurity: true,
      session: siteSession, // Use isolated session for cookie isolation
    },
  });

  // Set custom user agent
  browserView.webContents.setUserAgent(userAgent);

  // Position the BrowserView below the UI chrome
  const [width, height] = window.getSize();
  browserView.setBounds({
    x: 0,
    y: UI_CHROME_HEIGHT,
    width: width,
    height: height - UI_CHROME_HEIGHT,
  });

  browserView.setAutoResize({
    width: true,
    height: true,
  });

  // Load the site URL
  browserView.webContents.loadURL(site.url).catch(err => {
    console.error('Failed to load URL:', err);
  });

  // Navigation event handlers
  browserView.webContents.on('did-start-loading', () => {
    sendNavigationState();
  });

  browserView.webContents.on('did-stop-loading', () => {
    sendNavigationState();
  });

  browserView.webContents.on('did-navigate', () => {
    sendNavigationState();
  });

  browserView.webContents.on('did-navigate-in-page', () => {
    sendNavigationState();
  });

  browserView.webContents.on('page-title-updated', () => {
    sendNavigationState();
  });

  return browserView;
}

/**
 * Destroy the current BrowserView
 */
function destroyCurrentBrowserView(): void {
  if (currentBrowserView && window) {
    window.removeBrowserView(currentBrowserView);
    (currentBrowserView.webContents as any).destroy();
    currentBrowserView = null;
    currentSiteId = null;
  }
}

/**
 * Switch to a different site
 */
function switchToSite(siteId: string): void {
  if (!window) return;

  const site = siteStore.getById(siteId);
  if (!site) {
    console.error('Site not found:', siteId);
    return;
  }

  // Destroy current view
  destroyCurrentBrowserView();

  // Create new view
  currentBrowserView = createBrowserView(site);
  window.addBrowserView(currentBrowserView);
  currentSiteId = siteId;

  // Update settings
  settingsStore.update({ activeSiteId: siteId });

  // Send navigation state to renderer
  sendNavigationState();
}

/**
 * Send current navigation state to renderer
 */
function sendNavigationState(): void {
  if (!window || !currentBrowserView) return;

  const state: NavigationState = {
    canGoBack: currentBrowserView.webContents.canGoBack(),
    canGoForward: currentBrowserView.webContents.canGoForward(),
    isLoading: currentBrowserView.webContents.isLoading(),
    url: currentBrowserView.webContents.getURL(),
    title: currentBrowserView.webContents.getTitle(),
  };

  window.webContents.send('navigation-state-changed', state);
}

/**
 * Update user agent mode and reload current site
 */
function setUserAgentMode(mode: UserAgentMode): void {
  settingsStore.update({ userAgentMode: mode });

  // Reload current site with new user agent
  if (currentSiteId) {
    switchToSite(currentSiteId);
  }
}

// ============================================================================
// IPC Handlers
// ============================================================================

/**
 * Site CRUD operations
 */
ipcMain.handle('site:getAll', () => {
  return siteStore.getAll();
});

ipcMain.handle('site:getById', (_event, id: string) => {
  return siteStore.getById(id);
});

ipcMain.handle('site:create', (_event, input: CreateSiteInput) => {
  const site = siteStore.add(input);
  // If this is the first site, automatically switch to it
  const sites = siteStore.getAll();
  if (sites.length === 1) {
    switchToSite(site.id);
  }
  return site;
});

ipcMain.handle('site:update', (_event, input: UpdateSiteInput) => {
  const updated = siteStore.update(input.id, input);
  // If updating the current site's URL, reload it
  if (updated && currentSiteId === input.id && input.url) {
    switchToSite(input.id);
  }
  return updated;
});

ipcMain.handle('site:delete', async (_event, id: string) => {
  // Close pinned window if exists
  if (pinManager.isPinned(id)) {
    pinManager.closePinnedWindow(id);
  }

  // Clear site data from session
  await sessionManager.clearSiteData(id);

  // Delete from store (this also deletes the icon file)
  const success = await siteStore.delete(id);

  // If deleting the current site, clear the view
  if (success && currentSiteId === id) {
    destroyCurrentBrowserView();
    // Switch to first available site
    const sites = siteStore.getAll();
    if (sites.length > 0) {
      switchToSite(sites[0].id);
    }
  }
  return success;
});

ipcMain.handle('site:switch', (_event, siteId: string) => {
  switchToSite(siteId);
  return true;
});

/**
 * Navigation controls
 */
ipcMain.handle('navigation:back', () => {
  if (currentBrowserView) {
    currentBrowserView.webContents.goBack();
  }
});

ipcMain.handle('navigation:forward', () => {
  if (currentBrowserView) {
    currentBrowserView.webContents.goForward();
  }
});

ipcMain.handle('navigation:reload', () => {
  if (currentBrowserView) {
    currentBrowserView.webContents.reload();
  }
});

ipcMain.handle('navigation:stop', () => {
  if (currentBrowserView) {
    currentBrowserView.webContents.stop();
  }
});

ipcMain.handle('navigation:loadUrl', (_event, url: string) => {
  if (currentBrowserView) {
    currentBrowserView.webContents.loadURL(url);
  }
});

/**
 * Settings
 */
ipcMain.handle('settings:getAll', () => {
  return settingsStore.getAll();
});

ipcMain.handle('settings:update', (_event, updates) => {
  return settingsStore.update(updates);
});

ipcMain.handle('settings:setUserAgent', (_event, mode: UserAgentMode) => {
  setUserAgentMode(mode);
  return settingsStore.getAll();
});

/**
 * Import/Export
 */
ipcMain.handle('import:showDialog', async () => {
  if (!window) return null;

  const result = await dialog.showOpenDialog(window, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('import:fromFile', async (_event, filePath: string, merge: boolean) => {
  try {
    await importExport.importFromFile(filePath, merge);
    // Reload the first site after import
    const sites = siteStore.getAll();
    if (sites.length > 0 && !currentSiteId) {
      switchToSite(sites[0].id);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export:showDialog', async () => {
  if (!window) return null;

  const settings = settingsStore.getAll();
  const defaultPath = settings.lastExportPath || app.getPath('documents');

  const result = await dialog.showSaveDialog(window, {
    defaultPath: path.join(defaultPath, 'menubar-sites-export.json'),
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  return result.filePath;
});

ipcMain.handle('export:toFile', async (_event, filePath: string) => {
  try {
    await importExport.exportToFile(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export:toJson', () => {
  return importExport.exportToJson();
});

/**
 * Utility
 */
ipcMain.handle('app:getStoragePath', () => {
  return getStoragePath();
});

/**
 * Pin Management
 */
ipcMain.handle('pin:create', (_event, siteId: string) => {
  const site = siteStore.getById(siteId);
  if (!site) return { success: false, error: 'Site not found' };

  const settings = settingsStore.getAll();
  const window = pinManager.createPinnedWindow(site, settings.userAgentMode);

  // Update site as pinned
  siteStore.update(siteId, { pinned: true });

  return { success: true, windowId: window.id };
});

ipcMain.handle('pin:close', (_event, siteId: string) => {
  pinManager.closePinnedWindow(siteId);
  siteStore.update(siteId, { pinned: false });
  return { success: true };
});

ipcMain.handle('pin:toggle', (_event, siteId: string) => {
  const site = siteStore.getById(siteId);
  if (!site) return { success: false, error: 'Site not found' };

  if (pinManager.isPinned(siteId)) {
    pinManager.closePinnedWindow(siteId);
    siteStore.update(siteId, { pinned: false });
    return { success: true, pinned: false };
  } else {
    const settings = settingsStore.getAll();
    pinManager.createPinnedWindow(site, settings.userAgentMode);
    siteStore.update(siteId, { pinned: true });
    return { success: true, pinned: true };
  }
});

ipcMain.handle('pin:isPinned', (_event, siteId: string) => {
  return pinManager.isPinned(siteId);
});

ipcMain.handle('pin:setAlwaysOnTop', (_event, siteId: string, alwaysOnTop: boolean) => {
  pinManager.setAlwaysOnTop(siteId, alwaysOnTop);
  siteStore.update(siteId, { alwaysOnTop });
  return { success: true };
});

ipcMain.handle('pin:openDevTools', (_event, siteId: string) => {
  pinManager.openDevToolsForPinnedWindow(siteId);
  return { success: true };
});

/**
 * Popover Always-on-Top
 */
ipcMain.handle('popover:setAlwaysOnTop', (_event, alwaysOnTop: boolean) => {
  if (window) {
    window.setAlwaysOnTop(alwaysOnTop);
    settingsStore.update({ popoverAlwaysOnTop: alwaysOnTop });
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('popover:isAlwaysOnTop', () => {
  return window ? window.isAlwaysOnTop() : false;
});

/**
 * Ad-Blocking
 */
ipcMain.handle('adblock:setEnabled', (_event, enabled: boolean) => {
  sessionManager.setAdBlockEnabled(enabled);
  settingsStore.update({ adBlockEnabled: enabled });
  return { success: true };
});

ipcMain.handle('adblock:isEnabled', () => {
  return sessionManager.isAdBlockEnabled();
});

/**
 * Icon Management
 */
ipcMain.handle('icon:save', async (_event, siteId: string, iconData: string) => {
  try {
    const iconPath = await iconStore.saveIcon(siteId, iconData);
    siteStore.update(siteId, { iconPath });

    // Update tray icon if site is pinned
    const site = siteStore.getById(siteId);
    if (site && pinManager.isPinned(siteId)) {
      pinManager.updateTrayIcon(site);
    }

    return { success: true, iconPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('icon:delete', async (_event, siteId: string) => {
  try {
    await iconStore.deleteIcon(siteId);
    siteStore.update(siteId, { iconPath: undefined });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('icon:getPath', (_event, siteId: string) => {
  return iconStore.getIconPath(siteId);
});

/**
 * DevTools
 */
ipcMain.handle('devtools:open', () => {
  if (currentBrowserView) {
    currentBrowserView.webContents.openDevTools();
  }
  return { success: true };
});

ipcMain.handle('devtools:openPopover', () => {
  if (window) {
    window.webContents.openDevTools();
  }
  return { success: true };
});

/**
 * Context Menu Actions
 */
ipcMain.handle('site:openInBrowser', (_event, siteId: string) => {
  const site = siteStore.getById(siteId);
  if (site) {
    require('electron').shell.openExternal(site.url);
    return { success: true };
  }
  return { success: false };
});

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

/**
 * Register global keyboard shortcuts
 */
function registerKeyboardShortcuts(): void {
  // Toggle popover window
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    toggleWindow();
  });

  // Cycle through sites (when popover is open)
  globalShortcut.register('CommandOrControl+Tab', () => {
    if (window && window.isVisible()) {
      const sites = siteStore.getAll();
      if (sites.length === 0) return;

      const currentIndex = sites.findIndex(s => s.id === currentSiteId);
      const nextIndex = (currentIndex + 1) % sites.length;
      switchToSite(sites[nextIndex].id);

      // Notify renderer to update UI
      if (window) {
        window.webContents.send('site-cycled', sites[nextIndex].id);
      }
    }
  });

  // Open DevTools for current BrowserView
  globalShortcut.register('CommandOrControl+Alt+I', () => {
    if (currentBrowserView) {
      currentBrowserView.webContents.openDevTools();
    }
  });

  console.log('Keyboard shortcuts registered:');
  console.log('  - CommandOrControl+Shift+X: Toggle popover');
  console.log('  - CommandOrControl+Tab: Cycle sites');
  console.log('  - CommandOrControl+Alt+I: Open DevTools');
}

/**
 * Unregister all keyboard shortcuts
 */
function unregisterKeyboardShortcuts(): void {
  globalShortcut.unregisterAll();
}

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(() => {
  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  createTray();
  createWindow();

  // Register keyboard shortcuts
  registerKeyboardShortcuts();

  // Initialize session manager with saved settings
  const settings = settingsStore.getAll();
  if (settings.adBlockEnabled) {
    sessionManager.setAdBlockEnabled(true);
  }

  // Load the last active site if available
  if (settings.activeSiteId) {
    const site = siteStore.getById(settings.activeSiteId);
    if (site) {
      switchToSite(settings.activeSiteId);
    }
  }

  // Restore pinned windows
  const sites = siteStore.getAll();
  sites.forEach(site => {
    if (site.pinned) {
      pinManager.createPinnedWindow(site, settings.userAgentMode);
      if (site.alwaysOnTop) {
        pinManager.setAlwaysOnTop(site.id, true);
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', (event: Event) => {
  // Prevent app from quitting (menubar app behavior)
  event.preventDefault();
});

app.on('before-quit', () => {
  // Unregister keyboard shortcuts
  unregisterKeyboardShortcuts();

  // Close all pinned windows
  pinManager.closeAllPinnedWindows();

  if (window) {
    window.removeAllListeners('close');
    window.close();
  }
});
