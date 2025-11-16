/**
 * Renderer process - UI logic and event handlers
 *
 * This file handles all UI interactions, state management, and communication
 * with the main process via the electronAPI bridge.
 */

// Type import (the actual API is available via window.electronAPI from preload)
import type { Site, UserAgentMode, NavigationState } from '../common/types';

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
const btnImportExport = document.getElementById('btn-import-export') as HTMLButtonElement;

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
const ctxEdit = document.getElementById('ctx-edit') as HTMLDivElement;
const ctxDelete = document.getElementById('ctx-delete') as HTMLDivElement;

// ============================================================================
// Initialization
// ============================================================================

window.addEventListener('DOMContentLoaded', async () => {
  console.log('Renderer process initialized');

  // Load initial data
  await loadSites();
  await loadSettings();
  await loadStoragePath();

  // Setup navigation listeners
  window.electronAPI.navigation.onStateChange(handleNavigationStateChange);

  // Setup event listeners
  setupEventListeners();
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
  // Navigation controls
  btnBack.addEventListener('click', () => window.electronAPI.navigation.back());
  btnForward.addEventListener('click', () => window.electronAPI.navigation.forward());
  btnReload.addEventListener('click', () => window.electronAPI.navigation.reload());

  // User agent toggle
  btnUaDesktop.addEventListener('click', () => setUserAgentMode('desktop'));
  btnUaMobile.addEventListener('click', () => setUserAgentMode('mobile'));

  // Action buttons
  btnAddSite.addEventListener('click', showAddSiteModal);
  btnImportExport.addEventListener('click', showImportExportModal);

  // Site modal
  modalSiteClose.addEventListener('click', hideSiteModal);
  btnSiteCancel.addEventListener('click', hideSiteModal);
  formSite.addEventListener('submit', handleSiteFormSubmit);

  // Import/Export modal
  modalIeClose.addEventListener('click', hideImportExportModal);
  btnExport.addEventListener('click', handleExport);
  btnImport.addEventListener('click', handleImport);

  // Context menu
  ctxEdit.addEventListener('click', handleContextEdit);
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

function showContextMenu(x: number, y: number, siteId: string): void {
  contextMenuTargetSiteId = siteId;
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
