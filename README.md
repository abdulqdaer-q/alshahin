# Web Apps Menubar

A feature-rich Electron menubar application for managing multiple web apps in a single, convenient menubar interface. Built with TypeScript and BrowserView for secure, performant web content rendering.

## Features

### Core Functionality

- **Multiple Web Apps**: Add, edit, and delete multiple websites with custom names and icons
- **BrowserView Integration**: Each site renders in a secure, isolated BrowserView
- **Tab-based Navigation**: Quick switching between sites via tabs
- **Address Bar with Controls**: Back, Forward, Reload, and Stop buttons for navigation
- **Responsive Mode Toggle**: Switch between desktop and mobile user agents to test responsive designs
- **Persistent Storage**: All sites and settings saved automatically using electron-store
- **Import/Export**: Backup and restore your sites collection as JSON

### Advanced Features (NEW)

- **Pin Sites**: Open sites as standalone always-on-top windows with dedicated tray icons
- **Cookie Isolation**: Each site runs in a separate session partition for complete cookie/storage isolation
- **Ad-Blocking**: Built-in ad-blocker that blocks common ad and tracking domains
- **Always-on-Top**: Toggle always-on-top mode for both popover and pinned windows
- **Custom Icons**: Set custom icons for sites (shown in tabs and tray for pinned windows)
- **Keyboard Shortcuts**: Global shortcuts for toggling popover, cycling sites, and opening DevTools
- **Enhanced Context Menu**: Right-click sites for Pin, Edit, Delete, and Open in Browser options
- **Session Persistence**: Pinned windows and settings restore automatically on app restart

### UI Features

- Clean, modern interface with navigation controls
- Real-time address bar showing current URL
- Loading indicators
- Empty state guidance for new users
- Context menu for quick site editing/deletion
- Modal dialogs for site management

### Security

- **Context Isolation**: Enabled by default
- **Node Integration**: Disabled in renderer
- **Sandbox Mode**: BrowserView runs in sandboxed environment
- **Secure IPC**: All channels whitelisted and validated
- **Preload Bridge**: Safe communication between processes

## Prerequisites

- **Node.js** 18.x or later
- **npm** 9.x or later
- **macOS** (recommended, though it can run on other platforms)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Application

```bash
npm run build
```

### 3. Run in Development Mode

```bash
npm run dev
```

### 4. Using the App

1. Look for the app icon in your macOS menu bar
2. Click the icon to toggle the popover window
3. Click the **+ button** to add your first web app

## Project Structure

```
electron-menubar-app/
├── src/
│   ├── common/
│   │   └── types.ts               # Shared TypeScript types, constants, ad-block domains
│   ├── main/
│   │   ├── main.ts                # Main process with BrowserView management & keyboard shortcuts
│   │   ├── preload.ts             # Secure IPC bridge with extended API
│   │   ├── store.ts               # Persistent storage using electron-store
│   │   ├── sessionManager.ts      # Cookie isolation & ad-blocking (NEW)
│   │   └── pinManager.ts          # Pinned window management (NEW)
│   └── renderer/
│       ├── index.html             # UI markup with controls, modals, and settings
│       ├── renderer.ts            # UI logic and event handlers
│       └── styles.css             # Modern, responsive styling
├── tests/
│   ├── main/
│   │   ├── sessionManager.test.ts # Session manager tests (NEW)
│   │   ├── pinManager.test.ts     # Pin manager tests (NEW)
│   │   └── ...                    # Other test files
│   └── ...
├── assets/
│   └── iconTemplate.png           # Tray icon (16x16 PNG)
├── dist/                          # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Build TypeScript and run the app |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run watch` | Watch mode for TypeScript compilation |
| `npm start` | Run the app (requires prior build) |
| `npm run clean` | Remove compiled files |
| `npm test` | Run tests with Jest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Feature Documentation

### Adding a Site

1. Click the **+** button in the header
2. Fill in the site details:
   - **Name**: Display name (e.g., "Gmail")
   - **URL**: Full URL including protocol (e.g., "https://mail.google.com")
   - **Icon** (optional): URL to an icon or base64-encoded image
3. Click **Save**

Example sites to try:
```
Name: GitHub
URL: https://github.com
Icon: https://github.githubassets.com/favicons/favicon.svg

Name: Hacker News
URL: https://news.ycombinator.com
Icon: https://news.ycombinator.com/favicon.ico
```

### Editing a Site

1. Right-click on a site tab
2. Select **Edit Site** from the context menu
3. Modify the details
4. Click **Save**

### Deleting a Site

1. Right-click on a site tab
2. Select **Delete Site** from the context menu
3. Confirm the deletion

### Navigation Controls

- **Back (←)**: Navigate to the previous page
- **Forward (→)**: Navigate to the next page
- **Reload (↻)**: Refresh the current page
- **Address Bar**: Shows the current URL and loading state

### Responsive Mode Toggle

Toggle between desktop and mobile user agents:

- **Desktop Mode (💻)**: Uses desktop Chrome user agent
  ```
  Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
  (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
  ```

- **Mobile Mode (📱)**: Uses iPhone user agent
  ```
  Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15
  (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1
  ```

When you switch modes, the current site automatically reloads with the new user agent.

### Advanced Features

#### Pinning Sites

Pin any site to create a standalone window that stays open independently of the popover:

1. Right-click on a site tab
2. Select **Pin Site** from the context menu
3. A new window opens with the site, plus a tray icon for quick access
4. The pinned window can be configured as always-on-top
5. Right-click on the pinned window's tray icon for options

**Benefits of Pinning:**
- Keep important sites always visible
- Each pinned window has its own dedicated tray icon
- Custom icons (if set) appear in the tray
- Pinned windows persist across app restarts
- Independent always-on-top control per window

**Unpinning:**
- Right-click the site tab and select "Unpin Site"
- Or close the pinned window directly

#### Cookie & Session Isolation

Every site runs in a completely isolated session partition:

```
persist:site-[site-id]
```

This means:
- **No Shared Cookies**: Site A cannot access Site B's cookies
- **Separate LocalStorage**: Each site has independent storage
- **Isolated Cache**: Cache is not shared between sites
- **Independent Sessions**: Login sessions are completely separate

**Testing Cookie Isolation:**
1. Add the same site twice (e.g., "Gmail Work" and "Gmail Personal")
2. Log in to different accounts on each
3. Both will maintain separate sessions without conflicts

**Clearing Site Data:**
Deleting a site automatically clears all associated cookies, cache, and storage.

#### Ad-Blocking

Built-in ad-blocker that blocks requests to common ad and tracking domains.

**Enabling Ad-Blocking:**
1. Click the Settings button (⚙️) or the Shield button in the header
2. Toggle "Enable ad-blocking"
3. All sites will immediately start blocking ads

**How It Works:**
- Uses Electron's `webRequest` API to intercept network requests
- Blocks requests to ~27 common ad/tracking domains including:
  - doubleclick.net, googlesyndication.com
  - facebook.com/tr, platform.twitter.com
  - outbrain.com, taboola.com
  - And many more (see `AD_BLOCK_DOMAINS` in types.ts)

**Testing Ad-Blocking:**
1. Enable ad-blocking in settings
2. Visit a news site with ads (e.g., cnn.com)
3. Observe blocked ads in the console (if DevTools are open)
4. Disable ad-blocking to compare

**Limitations:**
- Basic domain-based blocking (not as comprehensive as uBlock Origin)
- Some ads may still appear if served from the same domain
- Does not block first-party tracking

#### Always-on-Top

Keep windows visible above other applications:

**Popover Always-on-Top:**
1. Click the Always-on-Top button (↑) in the header
2. Or toggle in Settings
3. The popover will stay above other windows

**Pinned Window Always-on-Top:**
- Each pinned window can independently be set as always-on-top
- Right-click the pinned window's tray icon
- Select "Enable Always on Top" / "Disable Always on Top"

#### Keyboard Shortcuts

Global shortcuts work even when the app is in the background:

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + X` | Toggle popover window |
| `Cmd/Ctrl + Tab` | Cycle through sites (when popover is open) |
| `Cmd/Ctrl + Alt + I` | Open DevTools for current site |

**Notes:**
- Shortcuts are registered at app startup
- They work system-wide, even when the app is not focused
- Customize by editing `registerKeyboardShortcuts()` in main.ts

#### Custom Icons

Set custom icons for your sites:

**Setting an Icon:**
1. When adding/editing a site, enter an icon URL or base64 data
2. Examples:
   ```
   URL: https://github.com/favicon.ico
   Base64: data:image/png;base64,iVBORw0KG...
   ```

**Icon Storage:**
- Icons are saved to: `[app-data]/icons/[site-id].png`
- Automatically deleted when site is deleted
- Used in site tabs and pinned window tray icons

#### Enhanced Context Menu

Right-click any site tab for quick actions:

- **Pin Site** / **Unpin Site**: Toggle pinned window
- **Edit Site**: Modify name, URL, or icon
- **Open in Browser**: Open site in default browser
- **Delete Site**: Remove site and clear all data

### Import/Export

#### Export Sites

1. Click the **Import/Export** button (↑)
2. Click **Export to File**
3. Choose a location to save the JSON file
4. Your sites and settings are backed up

The export file contains:
```json
{
  "version": "1.0.0",
  "exportedAt": 1234567890,
  "sites": [...],
  "settings": {...}
}
```

#### Import Sites

1. Click the **Import/Export** button (↑)
2. Choose import mode:
   - **Replace all sites**: Deletes existing sites and imports new ones
   - **Merge with existing sites**: Adds imported sites without deleting existing ones
3. Click **Import from File**
4. Select a previously exported JSON file

### Storage Location

All data is automatically saved to your OS-specific app data directory:

- **macOS**: `~/Library/Application Support/electron-menubar-app/config.json`
- **Linux**: `~/.config/electron-menubar-app/config.json`
- **Windows**: `%APPDATA%/electron-menubar-app/config.json`

You can view the exact path in the Import/Export modal under "Storage Location".

## Testing the Application

### Basic Testing Flow

1. **Add Sample Sites** (via UI):
   ```
   Site 1:
   - Name: Example Site
   - URL: https://example.com
   - Icon: (leave empty)

   Site 2:
   - Name: Google
   - URL: https://www.google.com
   - Icon: https://www.google.com/favicon.ico
   ```

2. **Test Site Switching**:
   - Click on each tab to switch between sites
   - Verify the BrowserView loads the correct URL
   - Check the address bar updates

3. **Test Navigation**:
   - Navigate to different pages within a site
   - Use Back/Forward buttons
   - Use Reload button

4. **Test Responsive Mode**:
   - Click the mobile icon (📱)
   - Verify the page reloads in mobile view
   - Switch back to desktop (💻)
   - Verify the page reloads in desktop view

5. **Test Edit/Delete**:
   - Right-click on a site tab
   - Edit the site name or URL
   - Try deleting a site

6. **Test Export**:
   - Click Import/Export button
   - Export your sites to a file
   - Verify the JSON file is created

7. **Test Import**:
   - Delete all sites (or create a backup first)
   - Import the previously exported file
   - Verify sites are restored

### Verifying User Agent

To verify the user agent is being set correctly:

1. Add a site: `https://www.whatsmyua.info/`
2. Switch to **Desktop Mode** - you should see the desktop Chrome user agent
3. Switch to **Mobile Mode** - you should see the iPhone Safari user agent

## Architecture Details

### Main Process (src/main/main.ts)

The main process handles:
- **BrowserView Management**: Creates, destroys, and switches between BrowserViews
- **Window Positioning**: Positions the menubar window near the tray icon
- **IPC Handlers**: Processes all requests from the renderer
- **Storage Operations**: Delegates to store.ts
- **User Agent Switching**: Applies the correct user agent to BrowserViews

Key functions:
- `createBrowserView(site)`: Creates a sandboxed BrowserView for a site
- `switchToSite(siteId)`: Destroys current view and creates a new one
- `setUserAgentMode(mode)`: Updates settings and reloads the current site

### Storage Layer (src/main/store.ts)

Uses `electron-store` for persistent JSON storage:
- **siteStore**: CRUD operations for sites
- **settingsStore**: Manage application settings
- **importExport**: Handle backup and restore

All operations are synchronous and immediately persisted to disk.

### Preload Script (src/main/preload.ts)

Exposes a type-safe API to the renderer:
```typescript
window.electronAPI = {
  site: { getAll, getById, create, update, delete, switch },
  navigation: { back, forward, reload, stop, loadUrl, onStateChange },
  settings: { getAll, update, setUserAgent },
  importExport: { showImportDialog, importFromFile, showExportDialog, exportToFile, exportToJson },
  app: { getStoragePath },
  platform: process.platform
}
```

All IPC channels use `ipcRenderer.invoke` for request/response patterns.

### Renderer Process (src/renderer/)

Pure web technologies:
- **HTML**: Semantic markup with modals and forms
- **CSS**: Modern, responsive styling with flexbox and grid
- **TypeScript**: Type-safe UI logic with async/await

The renderer never directly accesses Node.js or Electron APIs - all communication goes through the preload bridge.

## BrowserView vs WebView

This application uses **BrowserView** instead of `<webview>` for several reasons:

- **Better Performance**: BrowserView runs in a separate process
- **Enhanced Security**: Proper process isolation
- **Official Recommendation**: Electron team recommends BrowserView
- **Better Control**: Programmatic control from main process
- **No Layout Engine**: BrowserView renders outside the normal DOM flow

The BrowserView is positioned below the UI chrome (120px offset) and automatically resizes with the window.

## Customization

### Changing Window Size

Edit the default dimensions in `src/common/types.ts`:
```typescript
const DEFAULT_SETTINGS: AppSettings = {
  userAgentMode: 'desktop',
  windowWidth: 800,    // Change width
  windowHeight: 600,   // Change height
};
```

### Adjusting UI Chrome Height

If you modify the header or tabs height, update `UI_CHROME_HEIGHT` in `src/main/main.ts`:
```typescript
const UI_CHROME_HEIGHT = 120; // Height reserved for UI controls
```

### Custom User Agents

Edit the user agent strings in `src/common/types.ts`:
```typescript
export const USER_AGENTS = {
  desktop: 'Your custom desktop UA',
  mobile: 'Your custom mobile UA'
} as const;
```

### Custom Icon

Replace `assets/iconTemplate.png` with your own 16x16 PNG. Use a monochrome icon for best results on macOS menu bar.

## Troubleshooting

### Sites not loading

- Check the browser console (enable dev tools in main.ts)
- Verify the URL includes the protocol (`https://`)
- Check for CORS or X-Frame-Options restrictions

### BrowserView not visible

- Verify `UI_CHROME_HEIGHT` matches your actual header height
- Check window dimensions are sufficient
- Look for errors in the main process console

### Import fails

- Verify the JSON file is valid (use a JSON validator)
- Check the file follows the export format
- Look for error messages in the console

### Storage path not accessible

- Check file system permissions
- On macOS, ensure the app has necessary permissions
- Try manually creating the directory

## Known Limitations

1. **BrowserView and DevTools**: DevTools for BrowserView must be opened programmatically from the main process
2. **Cross-Origin Content**: Some sites may block embedding (X-Frame-Options, CSP)
3. **Tab Overflow**: With many sites, tabs may require horizontal scrolling
4. **Window Focus**: Menubar window hides on blur (expected behavior)

## Performance Tips

1. **Limit Active Sites**: Each BrowserView consumes memory. Only one is active at a time.
2. **Clear Cache**: BrowserView instances have their own cache. Consider adding clear cache functionality.
3. **Throttle Switching**: Destroying and recreating BrowserViews is expensive. Consider caching if switching frequently.

## Security Considerations

### Content Security

- BrowserView runs in sandbox mode with `webSecurity: true`
- No Node.js integration in web content
- Isolated storage per origin

### IPC Security

- All IPC channels are explicitly whitelisted
- No arbitrary code execution from renderer
- Type validation on all inputs

### Storage Security

- Config file stored in user-accessible location
- No sensitive data should be stored unencrypted
- Consider encryption for sensitive sites

## Known Limitations & Caveats

### Cookie Isolation
- **Not 100% identical to separate browsers**: While session partitions provide strong isolation, they still run within the same Electron app
- **Shared process pool**: Sites share the same Chromium process pool (though data is isolated)
- **Browser fingerprinting**: Sites may still detect they're running in Electron

### Ad-Blocking
- **Basic domain-based blocking**: Not as comprehensive as browser extensions like uBlock Origin
- **No cosmetic filtering**: Only blocks network requests, doesn't hide ad placeholders
- **First-party ads**: Cannot block ads served from the same domain as the site
- **Requires restart**: Changes to the ad-block domains list require app recompilation

### Pinned Windows
- **Memory usage**: Each pinned window runs a separate BrowserView (memory intensive)
- **No synchronization**: Pinned windows and popover views are independent
- **Tray icon limitations**: macOS menubar has limited space for many pinned windows

### Browser Detection
- **Some sites may detect**: Certain sites can detect they're running in Electron
- **X-Frame-Options**: Some sites block embedding entirely
- **Service workers**: May behave differently than in regular browsers

## Future Enhancements

Possible additions for future versions:

- [x] Keyboard shortcuts for site switching ✅
- [x] Session management (cookies, storage) ✅
- [x] Pin to standalone windows ✅
- [ ] Search/filter sites
- [ ] Site groups or folders
- [ ] Custom CSS injection per site
- [ ] Screenshot/thumbnail for each site
- [ ] Notification badges
- [ ] Auto-update checking
- [ ] Offline mode detection
- [ ] Enhanced ad-blocking with cosmetic filtering
- [ ] Sync settings across devices

## Contributing

Contributions welcome! Areas for improvement:

1. Better error handling and user feedback
2. Keyboard navigation support
3. Accessibility improvements
4. Performance optimizations
5. Cross-platform testing

## License

MIT

---

**Built with:**
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [electron-store](https://github.com/sindresorhus/electron-store) - Persistent storage
