/**
 * Common types shared between main and renderer processes
 */

/**
 * Represents a single web app/site in the menubar
 */
export interface Site {
  /** Unique identifier for the site */
  id: string;
  /** Display name of the site */
  name: string;
  /** URL to load in the BrowserView */
  url: string;
  /** Optional base64 encoded icon or icon URL */
  icon?: string;
  /** Path to local icon file (stored in app data) */
  iconPath?: string;
  /** Whether this site is pinned as a standalone window */
  pinned?: boolean;
  /** Whether pinned window should be always on top */
  alwaysOnTop?: boolean;
  /** Session partition name for cookie isolation */
  partition?: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Input for creating a new site (without auto-generated fields)
 */
export interface CreateSiteInput {
  name: string;
  url: string;
  icon?: string;
}

/**
 * Input for updating an existing site
 */
export interface UpdateSiteInput {
  id: string;
  name?: string;
  url?: string;
  icon?: string;
  iconPath?: string;
  pinned?: boolean;
  alwaysOnTop?: boolean;
}

/**
 * User agent mode for responsive testing
 */
export type UserAgentMode = 'desktop' | 'mobile';

/**
 * Application settings
 */
export interface AppSettings {
  /** Currently active site ID */
  activeSiteId?: string;
  /** User agent mode (desktop or mobile) */
  userAgentMode: UserAgentMode;
  /** Window dimensions */
  windowWidth: number;
  windowHeight: number;
  /** Last export/import path */
  lastExportPath?: string;
  /** Whether popover window should be always on top */
  popoverAlwaysOnTop?: boolean;
  /** Whether ad-blocking is enabled */
  adBlockEnabled?: boolean;
}

/**
 * Data structure for import/export
 */
export interface ExportData {
  version: string;
  exportedAt: number;
  sites: Site[];
  settings: AppSettings;
}

/**
 * Navigation state for the address bar
 */
export interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  url: string;
  title: string;
}

/**
 * User agent strings for desktop and mobile modes
 */
export const USER_AGENTS = {
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
} as const;

/**
 * Pinned window state for tracking standalone windows
 */
export interface PinnedWindowState {
  /** Site ID this window is associated with */
  siteId: string;
  /** The BrowserWindow instance */
  window: any; // Electron.BrowserWindow (type not imported to avoid circular deps)
  /** The BrowserView instance */
  view: any; // Electron.BrowserView
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcuts {
  togglePopover: string; // Default: 'CommandOrControl+Shift+X'
  cycleSites: string; // Default: 'CommandOrControl+Tab'
  openDevTools: string; // Default: 'CommandOrControl+Alt+I'
}

/**
 * Ad-block filter list - common ad/tracking domains to block
 */
export const AD_BLOCK_DOMAINS = [
  // Major ad networks
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',

  // Social media trackers
  'facebook.com/tr',
  'connect.facebook.net',
  'platform.twitter.com',
  'static.ads-twitter.com',

  // Other ad networks
  'adnxs.com',
  'advertising.com',
  'adsystem.com',
  'amazon-adsystem.com',
  'casalemedia.com',
  'criteo.com',
  'outbrain.com',
  'taboola.com',
  'quantserve.com',
  'scorecardresearch.com',
  'moatads.com',
  'pubmatic.com',
  'rubiconproject.com',

  // Analytics & tracking
  'hotjar.com',
  'crazyegg.com',
  'mouseflow.com',
  'mixpanel.com',
  'segment.com',
  'newrelic.com',
] as const;
