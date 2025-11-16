/**
 * Session Manager - Handles cookie isolation and ad-blocking
 *
 * Features:
 * - Per-site session partitioning for cookie isolation
 * - Ad-blocking via webRequest filtering
 * - Session lifecycle management
 */

import { session, OnBeforeRequestListenerDetails } from 'electron';
import { AD_BLOCK_DOMAINS } from '../common/types';

/**
 * Session Manager for handling isolated sessions and ad-blocking
 */
export class SessionManager {
  private adBlockEnabled: boolean = false;
  private activeSessions: Set<string> = new Set();

  /**
   * Get or create a session for a specific site
   * @param siteId - Unique identifier for the site
   * @returns Electron session instance
   */
  getSessionForSite(siteId: string): Electron.Session {
    const partitionName = `persist:site-${siteId}`;
    const siteSession = session.fromPartition(partitionName);

    // Track active session
    this.activeSessions.add(partitionName);

    // Set up ad-blocking if enabled
    if (this.adBlockEnabled) {
      this.setupAdBlockForSession(siteSession);
    }

    return siteSession;
  }

  /**
   * Enable or disable ad-blocking globally
   * @param enabled - Whether to enable ad-blocking
   */
  setAdBlockEnabled(enabled: boolean): void {
    this.adBlockEnabled = enabled;

    // Apply to all active sessions
    this.activeSessions.forEach(partitionName => {
      const sess = session.fromPartition(partitionName);
      if (enabled) {
        this.setupAdBlockForSession(sess);
      } else {
        this.removeAdBlockFromSession(sess);
      }
    });
  }

  /**
   * Check if ad-blocking is enabled
   */
  isAdBlockEnabled(): boolean {
    return this.adBlockEnabled;
  }

  /**
   * Set up ad-blocking for a specific session
   * @param sess - Electron session to configure
   */
  private setupAdBlockForSession(sess: Electron.Session): void {
    // Remove existing filter if any
    this.removeAdBlockFromSession(sess);

    // Set up webRequest filter for ad-blocking
    sess.webRequest.onBeforeRequest((details: OnBeforeRequestListenerDetails, callback) => {
      const url = details.url.toLowerCase();

      // Check if URL matches any ad domain
      const isAd = AD_BLOCK_DOMAINS.some(domain =>
        url.includes(domain.toLowerCase())
      );

      if (isAd) {
        // Block the request
        callback({ cancel: true });
      } else {
        // Allow the request
        callback({ cancel: false });
      }
    });
  }

  /**
   * Remove ad-blocking from a session
   * @param sess - Electron session to configure
   */
  private removeAdBlockFromSession(sess: Electron.Session): void {
    // Clear all webRequest listeners
    sess.webRequest.onBeforeRequest(null);
  }

  /**
   * Clear all cookies and cache for a specific site
   * @param siteId - Site identifier
   */
  async clearSiteData(siteId: string): Promise<void> {
    const partitionName = `persist:site-${siteId}`;
    const siteSession = session.fromPartition(partitionName);

    // Clear cookies
    await siteSession.cookies.get({}).then(cookies => {
      return Promise.all(
        cookies.map(cookie =>
          siteSession.cookies.remove(cookie.domain || '', cookie.name)
        )
      );
    });

    // Clear cache
    await siteSession.clearCache();
    await siteSession.clearStorageData({
      storages: ['cookies', 'localstorage', 'indexdb', 'websql', 'serviceworkers', 'cachestorage']
    });
  }

  /**
   * Clear data for all sessions
   */
  async clearAllSiteData(): Promise<void> {
    const clearPromises = Array.from(this.activeSessions).map(async partitionName => {
      const sess = session.fromPartition(partitionName);
      await sess.clearCache();
      await sess.clearStorageData();
    });

    await Promise.all(clearPromises);
  }

  /**
   * Get statistics about blocked requests for a session
   * This is a placeholder for future implementation of statistics tracking
   */
  getBlockedRequestsCount(siteId: string): number {
    // TODO: Implement statistics tracking
    return 0;
  }

  /**
   * Clean up sessions that are no longer needed
   * @param activeSiteIds - List of currently active site IDs
   */
  cleanupInactiveSessions(activeSiteIds: string[]): void {
    const activePartitions = new Set(
      activeSiteIds.map(id => `persist:site-${id}`)
    );

    // Remove sessions that are no longer active
    this.activeSessions.forEach(partition => {
      if (!activePartitions.has(partition)) {
        this.activeSessions.delete(partition);
      }
    });
  }

  /**
   * Set custom user agent for a session
   * @param siteId - Site identifier
   * @param userAgent - User agent string
   */
  setUserAgentForSite(siteId: string, userAgent: string): void {
    const partitionName = `persist:site-${siteId}`;
    const siteSession = session.fromPartition(partitionName);
    siteSession.setUserAgent(userAgent);
  }

  /**
   * Configure permission handler for a session
   * @param siteId - Site identifier
   */
  setupPermissionsForSite(siteId: string): void {
    const partitionName = `persist:site-${siteId}`;
    const siteSession = session.fromPartition(partitionName);

    // Handle permission requests (notifications, geolocation, etc.)
    siteSession.setPermissionRequestHandler((webContents, permission, callback) => {
      // Auto-deny for potential tracking permissions
      const denyPermissions = ['media', 'geolocation'];

      if (denyPermissions.includes(permission)) {
        callback(false);
      } else {
        callback(true);
      }
    });
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
