/**
 * Renderer process - UI logic and event handlers
 *
 * This file handles all UI interactions, state management, and communication
 * with the main process via the electronAPI bridge.
 */

// Type imports (the actual API is available via window.electronAPI from preload)
import type { Site, UserAgentMode, NavigationState } from '../common/types';
import type { ElectronAPI } from '../main/preload';

// Debug: Verify renderer is loading and electronAPI is available
console.log('Renderer script loaded');
console.log('electronAPI available:', typeof window.electronAPI !== 'undefined');
if (typeof window.electronAPI === 'undefined') {
  console.error('ERROR: window.electronAPI is not defined! Preload script may have failed.');
}

// Type assertion for window.electronAPI to help TypeScript
declare const window: Window & {
  electronAPI: ElectronAPI;
};

// State
let sites: Site[] = [];
let currentSiteId: string | null = null;
let currentUserAgentMode: UserAgentMode = 'desktop';
let contextMenuTargetSiteId: string | null = null;

// DOM Elements - Navigation
const btnBack = document.getElementById('btn-back') as HTMLButtonElement;
const btnForward = document.getElementById('btn-forward') as HTMLButtonElement;
const btnReload = document.getElementById('btn-reload') as HTMLButtonElement;
const addressUrl = document.getElementById('address-url') as HTMLSpanElement;
const loadingSpinner = document.getElementById('loading-spinner') as HTMLDivElement;

// DOM Elements - User Agent
const btnUaDesktop = document.getElementById('btn-ua-desktop') as HTMLButtonElement;
const btnUaMobile = document.getElementById('btn-ua-mobile') as HTMLButtonElement;

// DOM Elements - Actions
const btnAddSite = document.getElementById('btn-add-site') as HTMLButtonElement;
const btnSettings = document.getElementById('btn-settings') as HTMLButtonElement;
const btnAlwaysOnTop = document.getElementById('btn-always-on-top') as HTMLButtonElement;
const btnAdBlock = document.getElementById('btn-adblock') as HTMLButtonElement;

// DOM Elements - Sites Tabs
const sitesTabs = document.getElementById('sites-tabs') as HTMLDivElement;
const emptyState = document.getElementById('empty-state') as HTMLDivElement;

// DOM Elements - Site Modal
const modalSite = document.getElementById('modal-site') as HTMLDivElement;
const modalSiteTitle = document.getElementById('modal-site-title') as HTMLHeadingElement;
const modalSiteClose = document.getElementById('modal-site-close') as HTMLButtonElement;
const formSite = document.getElementById('form-site') as HTMLFormElement;
const siteId = document.getElementById('site-id') as HTMLInputElement;
const siteName = document.getElementById('site-name') as HTMLInputElement;
const siteUrl = document.getElementById('site-url') as HTMLInputElement;
const siteIcon = document.getElementById('site-icon') as HTMLInputElement;
const btnSiteCancel = document.getElementById('btn-site-cancel') as HTMLButtonElement;

// DOM Elements - Import/Export Modal
const modalImportExport = document.getElementById('modal-import-export') as HTMLDivElement;
const modalIeClose = document.getElementById('modal-ie-close') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const btnImport = document.getElementById('btn-import') as HTMLButtonElement;
const storagePath = document.getElementById('storage-path') as HTMLParagraphElement;

// DOM Elements - Context Menu
const contextMenu = document.getElementById('context-menu') as HTMLDivElement;
const ctxPin = document.getElementById('ctx-pin') as HTMLDivElement;
const ctxEdit = document.getElementById('ctx-edit') as HTMLDivElement;
const ctxOpenBrowser = document.getElementById('ctx-open-browser') as HTMLDivElement;
const ctxDelete = document.getElementById('ctx-delete') as HTMLDivElement;

// DOM Elements - Settings Modal
const modalSettings = document.getElementById('modal-settings') as HTMLDivElement;
const modalSettingsClose = document.getElementById('modal-settings-close') as HTMLButtonElement;
const settingsPopoverAlwaysOnTop = document.getElementById('settings-popover-always-on-top') as HTMLInputElement;
const settingsAdBlock = document.getElementById('settings-adblock') as HTMLInputElement;
const settingsStoragePath = document.getElementById('settings-storage-path') as HTMLParagraphElement;
const settingsBtnImportExport = document.getElementById('settings-btn-import-export') as HTMLButtonElement;

// ============================================================================
// Initialization
// ============================================================================

window.addEventListener('DOMContentLoaded', async () => {
  console.log('Renderer process initialized');
  console.log('DOMContentLoaded event fired');

  try {
    // Load initial data
    console.log('Loading sites...');
    await loadSites();
    console.log('Sites loaded:', sites.length);

    console.log('Loading settings...');
    await loadSettings();
    console.log('Settings loaded');

    console.log('Loading storage path...');
    await loadStoragePath();
    console.log('Storage path loaded');

    // Setup navigation listeners
    console.log('Setting up navigation listeners...');
    window.electronAPI.navigation.onStateChange(handleNavigationStateChange);
    console.log('Navigation listeners set up');

    // Setup event listeners
    console.log('Setting up event listeners...');
    setupEventListeners();
    console.log('Event listeners set up successfully');

    console.log('Initialization complete!');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

/**
 * Load all sites from storage
 */
async function loadSites(): Promise<void> {
  try {
    sites = await window.electronAPI.site.getAll();
    renderSitesTabs();
    updateEmptyState();
  } catch (error) {
    console.error('Failed to load sites:', error);
  }
}

/**
 * Load application settings
 */
async function loadSettings(): Promise<void> {
  try {
    const settings = await window.electronAPI.settings.getAll();
    currentUserAgentMode = settings.userAgentMode;
    updateUserAgentUI();

    // If there's an active site, mark it as current
    if (settings.activeSiteId) {
      currentSiteId = settings.activeSiteId;
      updateSiteTabsActiveState();
    }

    // Initialize always-on-top button state
    const popoverAlwaysOnTop = await window.electronAPI.popover.isAlwaysOnTop();
    updateAlwaysOnTopButton(popoverAlwaysOnTop);

    // Initialize ad-block button state
    const adBlockEnabled = await window.electronAPI.adblock.isEnabled();
    updateAdBlockButton(adBlockEnabled);
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * Load storage path for display
 */
async function loadStoragePath(): Promise<void> {
  try {
    const path = await window.electronAPI.app.getStoragePath();
    storagePath.textContent = path;
  } catch (error) {
    console.error('Failed to load storage path:', error);
    storagePath.textContent = 'Error loading path';
  }
}

// ============================================================================
// Event Listeners Setup
// ============================================================================

function setupEventListeners(): void {
  console.log('Setting up event listeners for buttons...');

  // Debug: Check if DOM elements exist
  console.log('btnBack exists:', !!btnBack);
  console.log('btnAddSite exists:', !!btnAddSite);
  console.log('btnSettings exists:', !!btnSettings);

  // Navigation controls
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      console.log('Back button clicked');
      window.electronAPI.navigation.back();
    });
  }
  if (btnForward) {
    btnForward.addEventListener('click', () => {
      console.log('Forward button clicked');
      window.electronAPI.navigation.forward();
    });
  }
  if (btnReload) {
    btnReload.addEventListener('click', () => {
      console.log('Reload button clicked');
      window.electronAPI.navigation.reload();
    });
  }

  // User agent toggle
  btnUaDesktop.addEventListener('click', () => setUserAgentMode('desktop'));
  btnUaMobile.addEventListener('click', () => setUserAgentMode('mobile'));

  // Action buttons
  if (btnAddSite) {
    console.log('Adding click listener to Add Site button');
    btnAddSite.addEventListener('click', () => {
      console.log('Add Site button clicked!');
      showAddSiteModal();
    });
  }
  if (btnSettings) {
    console.log('Adding click listener to Settings button');
    btnSettings.addEventListener('click', () => {
      console.log('Settings button clicked!');
      showSettingsModal();
    });
  }
  if (btnAlwaysOnTop) {
    btnAlwaysOnTop.addEventListener('click', () => {
      console.log('Always on Top button clicked');
      togglePopoverAlwaysOnTop();
    });
  }
  if (btnAdBlock) {
    btnAdBlock.addEventListener('click', () => {
      console.log('Ad Block button clicked');
      toggleAdBlock();
    });
  }

  // Site modal
  modalSiteClose.addEventListener('click', hideSiteModal);
  btnSiteCancel.addEventListener('click', hideSiteModal);
  formSite.addEventListener('submit', handleSiteFormSubmit);

  // Import/Export modal
  modalIeClose.addEventListener('click', hideImportExportModal);
  btnExport.addEventListener('click', handleExport);
  btnImport.addEventListener('click', handleImport);

  // Settings modal
  modalSettingsClose.addEventListener('click', hideSettingsModal);
  settingsPopoverAlwaysOnTop.addEventListener('change', handlePopoverAlwaysOnTopChange);
  settingsAdBlock.addEventListener('change', handleAdBlockChange);
  settingsBtnImportExport.addEventListener('click', () => {
    hideSettingsModal();
    showImportExportModal();
  });

  // Context menu
  ctxPin.addEventListener('click', handleContextPin);
  ctxEdit.addEventListener('click', handleContextEdit);
  ctxOpenBrowser.addEventListener('click', handleContextOpenBrowser);
  ctxDelete.addEventListener('click', handleContextDelete);

  // Close context menu on outside click
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target as Node)) {
      hideContextMenu();
    }
  });

  // Close modals on outside click
  modalSite.addEventListener('click', (e) => {
    if (e.target === modalSite) {
      hideSiteModal();
    }
  });

  modalImportExport.addEventListener('click', (e) => {
    if (e.target === modalImportExport) {
      hideImportExportModal();
    }
  });

  modalSettings.addEventListener('click', (e) => {
    if (e.target === modalSettings) {
      hideSettingsModal();
    }
  });

  // Listen for site cycle events from keyboard shortcut
  window.electronAPI.site.onSiteCycled((siteId) => {
    currentSiteId = siteId;
    updateSiteTabsActiveState();
  });
}

// ============================================================================
// Navigation State Handler
// ============================================================================

function handleNavigationStateChange(state: NavigationState): void {
  // Update back/forward buttons
  btnBack.disabled = !state.canGoBack;
  btnForward.disabled = !state.canGoForward;

  // Update address bar
  if (state.url && state.url !== 'about:blank') {
    addressUrl.textContent = state.url;
    addressUrl.title = state.url;
  } else {
    addressUrl.textContent = 'No site loaded';
    addressUrl.title = '';
  }

  // Update loading spinner
  if (state.isLoading) {
    loadingSpinner.classList.remove('hidden');
  } else {
    loadingSpinner.classList.add('hidden');
  }
}

// ============================================================================
// Sites Tabs Rendering
// ============================================================================

function renderSitesTabs(): void {
  sitesTabs.innerHTML = '';

  sites.forEach(site => {
    const tab = document.createElement('div');
    tab.className = 'site-tab';
    tab.dataset.siteId = site.id;

    // Icon
    const iconEl = document.createElement('div');
    iconEl.className = 'site-tab-icon';
    if (site.icon) {
      if (site.icon.startsWith('http') || site.icon.startsWith('data:')) {
        const img = document.createElement('img');
        img.src = site.icon;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        iconEl.appendChild(img);
      } else {
        iconEl.textContent = site.name.charAt(0).toUpperCase();
      }
    } else {
      iconEl.textContent = site.name.charAt(0).toUpperCase();
    }

    // Name
    const nameEl = document.createElement('div');
    nameEl.className = 'site-tab-name';
    nameEl.textContent = site.name;

    tab.appendChild(iconEl);
    tab.appendChild(nameEl);

    // Click to switch
    tab.addEventListener('click', () => switchToSite(site.id));

    // Right-click for context menu
    tab.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, site.id);
    });

    sitesTabs.appendChild(tab);
  });

  updateSiteTabsActiveState();
}

function updateSiteTabsActiveState(): void {
  const tabs = sitesTabs.querySelectorAll('.site-tab');
  tabs.forEach(tab => {
    const siteId = (tab as HTMLElement).dataset.siteId;
    if (siteId === currentSiteId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

function updateEmptyState(): void {
  if (sites.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }
}

// ============================================================================
// User Agent Mode
// ============================================================================

async function setUserAgentMode(mode: UserAgentMode): Promise<void> {
  try {
    currentUserAgentMode = mode;
    await window.electronAPI.settings.setUserAgent(mode);
    updateUserAgentUI();
  } catch (error) {
    console.error('Failed to set user agent:', error);
  }
}

function updateUserAgentUI(): void {
  if (currentUserAgentMode === 'desktop') {
    btnUaDesktop.classList.add('active');
    btnUaMobile.classList.remove('active');
  } else {
    btnUaDesktop.classList.remove('active');
    btnUaMobile.classList.add('active');
  }
}

// ============================================================================
// Site Switching
// ============================================================================

async function switchToSite(siteId: string): Promise<void> {
  try {
    await window.electronAPI.site.switch(siteId);
    currentSiteId = siteId;
    updateSiteTabsActiveState();
  } catch (error) {
    console.error('Failed to switch site:', error);
  }
}

// ============================================================================
// Site Modal - Add/Edit
// ============================================================================

function showAddSiteModal(): void {
  modalSiteTitle.textContent = 'Add Site';
  siteId.value = '';
  siteName.value = '';
  siteUrl.value = '';
  siteIcon.value = '';
  modalSite.classList.add('active');
  siteName.focus();
}

function showEditSiteModal(site: Site): void {
  modalSiteTitle.textContent = 'Edit Site';
  siteId.value = site.id;
  siteName.value = site.name;
  siteUrl.value = site.url;
  siteIcon.value = site.icon || '';
  modalSite.classList.add('active');
  siteName.focus();
}

function hideSiteModal(): void {
  modalSite.classList.remove('active');
}

async function handleSiteFormSubmit(e: Event): Promise<void> {
  e.preventDefault();

  const id = siteId.value;
  const name = siteName.value.trim();
  const url = siteUrl.value.trim();
  const icon = siteIcon.value.trim();

  if (!name || !url) {
    alert('Please fill in required fields');
    return;
  }

  try {
    if (id) {
      // Update existing site
      await window.electronAPI.site.update({ id, name, url, icon });
    } else {
      // Create new site
      await window.electronAPI.site.create({ name, url, icon });
    }

    await loadSites();
    hideSiteModal();
  } catch (error) {
    console.error('Failed to save site:', error);
    alert('Failed to save site. See console for details.');
  }
}

// ============================================================================
// Context Menu
// ============================================================================

async function showContextMenu(x: number, y: number, siteId: string): Promise<void> {
  contextMenuTargetSiteId = siteId;

  // Update pin text based on current state
  const isPinned = await window.electronAPI.pin.isPinned(siteId);
  ctxPin.textContent = isPinned ? 'Unpin Site' : 'Pin Site';

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.remove('hidden');
}

function hideContextMenu(): void {
  contextMenu.classList.add('hidden');
  contextMenuTargetSiteId = null;
}

async function handleContextEdit(): Promise<void> {
  if (!contextMenuTargetSiteId) return;

  const site = sites.find(s => s.id === contextMenuTargetSiteId);
  if (site) {
    showEditSiteModal(site);
  }
  hideContextMenu();
}

async function handleContextDelete(): Promise<void> {
  if (!contextMenuTargetSiteId) return;

  const site = sites.find(s => s.id === contextMenuTargetSiteId);
  if (!site) return;

  const confirmed = confirm(`Are you sure you want to delete "${site.name}"?`);
  if (!confirmed) {
    hideContextMenu();
    return;
  }

  try {
    await window.electronAPI.site.delete(contextMenuTargetSiteId);
    await loadSites();

    // If we deleted the current site, clear currentSiteId
    if (currentSiteId === contextMenuTargetSiteId) {
      currentSiteId = null;
    }
  } catch (error) {
    console.error('Failed to delete site:', error);
    alert('Failed to delete site. See console for details.');
  }

  hideContextMenu();
}

async function handleContextPin(): Promise<void> {
  if (!contextMenuTargetSiteId) return;

  try {
    const result = await window.electronAPI.pin.toggle(contextMenuTargetSiteId);
    if (result.success) {
      await loadSites(); // Reload to show pinned state
    } else {
      alert(`Failed to toggle pin: ${result.error}`);
    }
  } catch (error) {
    console.error('Failed to toggle pin:', error);
    alert('Failed to toggle pin. See console for details.');
  }

  hideContextMenu();
}

async function handleContextOpenBrowser(): Promise<void> {
  if (!contextMenuTargetSiteId) return;

  try {
    await window.electronAPI.site.openInBrowser(contextMenuTargetSiteId);
  } catch (error) {
    console.error('Failed to open in browser:', error);
    alert('Failed to open site in browser. See console for details.');
  }

  hideContextMenu();
}

// ============================================================================
// Import/Export Modal
// ============================================================================

function showImportExportModal(): void {
  modalImportExport.classList.add('active');
}

function hideImportExportModal(): void {
  modalImportExport.classList.remove('active');
}

async function handleExport(): Promise<void> {
  try {
    const filePath = await window.electronAPI.importExport.showExportDialog();
    if (!filePath) return; // User canceled

    const result = await window.electronAPI.importExport.exportToFile(filePath);

    if (result.success) {
      alert(`Sites exported successfully to:\n${filePath}`);
    } else {
      alert(`Export failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Export error:', error);
    alert('Export failed. See console for details.');
  }
}

async function handleImport(): Promise<void> {
  try {
    const filePath = await window.electronAPI.importExport.showImportDialog();
    if (!filePath) return; // User canceled

    // Get the selected import mode
    const importModeRadios = document.getElementsByName('import-mode') as NodeListOf<HTMLInputElement>;
    let merge = false;
    for (const radio of importModeRadios) {
      if (radio.checked && radio.value === 'merge') {
        merge = true;
        break;
      }
    }

    const result = await window.electronAPI.importExport.importFromFile(filePath, merge);

    if (result.success) {
      alert(`Sites imported successfully from:\n${filePath}`);
      await loadSites();
      hideImportExportModal();
    } else {
      alert(`Import failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Import error:', error);
    alert('Import failed. See console for details.');
  }
}

// ============================================================================
// Settings Modal
// ============================================================================

async function showSettingsModal(): Promise<void> {
  // Load current settings
  try {
    const popoverAlwaysOnTop = await window.electronAPI.popover.isAlwaysOnTop();
    settingsPopoverAlwaysOnTop.checked = popoverAlwaysOnTop;

    const adBlockEnabled = await window.electronAPI.adblock.isEnabled();
    settingsAdBlock.checked = adBlockEnabled;

    const storagePath = await window.electronAPI.app.getStoragePath();
    settingsStoragePath.textContent = storagePath;

    // Update button states
    updateAlwaysOnTopButton(popoverAlwaysOnTop);
    updateAdBlockButton(adBlockEnabled);
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  modalSettings.classList.add('active');
}

function hideSettingsModal(): void {
  modalSettings.classList.remove('active');
}

async function handlePopoverAlwaysOnTopChange(): Promise<void> {
  try {
    const enabled = settingsPopoverAlwaysOnTop.checked;
    await window.electronAPI.popover.setAlwaysOnTop(enabled);
    updateAlwaysOnTopButton(enabled);
  } catch (error) {
    console.error('Failed to set always on top:', error);
    alert('Failed to update always on top setting.');
  }
}

async function handleAdBlockChange(): Promise<void> {
  try {
    const enabled = settingsAdBlock.checked;
    await window.electronAPI.adblock.setEnabled(enabled);
    updateAdBlockButton(enabled);
  } catch (error) {
    console.error('Failed to set ad-block:', error);
    alert('Failed to update ad-block setting.');
  }
}

// ============================================================================
// Popover Always-on-Top Toggle
// ============================================================================

async function togglePopoverAlwaysOnTop(): Promise<void> {
  try {
    const currentState = await window.electronAPI.popover.isAlwaysOnTop();
    const newState = !currentState;

    await window.electronAPI.popover.setAlwaysOnTop(newState);
    updateAlwaysOnTopButton(newState);

    // Update settings modal if open
    settingsPopoverAlwaysOnTop.checked = newState;
  } catch (error) {
    console.error('Failed to toggle always on top:', error);
    alert('Failed to toggle always on top.');
  }
}

function updateAlwaysOnTopButton(enabled: boolean): void {
  if (enabled) {
    btnAlwaysOnTop.classList.add('active');
    btnAlwaysOnTop.title = 'Always on Top (Enabled)';
  } else {
    btnAlwaysOnTop.classList.remove('active');
    btnAlwaysOnTop.title = 'Always on Top (Disabled)';
  }
}

// ============================================================================
// Ad-Blocking Toggle
// ============================================================================

async function toggleAdBlock(): Promise<void> {
  try {
    const currentState = await window.electronAPI.adblock.isEnabled();
    const newState = !currentState;

    await window.electronAPI.adblock.setEnabled(newState);
    updateAdBlockButton(newState);

    // Update settings modal if open
    settingsAdBlock.checked = newState;
  } catch (error) {
    console.error('Failed to toggle ad-block:', error);
    alert('Failed to toggle ad-block.');
  }
}

function updateAdBlockButton(enabled: boolean): void {
  if (enabled) {
    btnAdBlock.classList.add('active');
    btnAdBlock.title = 'Ad Blocker (Enabled)';
  } else {
    btnAdBlock.classList.remove('active');
    btnAdBlock.title = 'Ad Blocker (Disabled)';
  }
}
