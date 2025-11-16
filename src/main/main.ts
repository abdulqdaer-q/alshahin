import { app, BrowserWindow, Tray, screen, nativeImage } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;
let window: BrowserWindow | null = null;

const WINDOW_WIDTH = 360;
const WINDOW_HEIGHT = 400;

function createWindow(): void {
  window = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,
    frame: false,
    resizable: true,
    transparent: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Hide window when it loses focus
  window.on('blur', () => {
    if (window && !window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });

  window.on('closed', () => {
    window = null;
  });
}

function createTray(): void {
  const iconPath = path.join(__dirname, '../../assets/iconTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);

  // Resize icon to appropriate size for menu bar (16x16 for macOS)
  const resizedIcon = icon.resize({ width: 16, height: 16 });
  resizedIcon.setTemplateImage(true);

  tray = new Tray(resizedIcon);
  tray.setToolTip('Electron Menubar App');

  tray.on('click', () => {
    toggleWindow();
  });
}

function toggleWindow(): void {
  if (!window) {
    createWindow();
  }

  if (window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
}

function showWindow(): void {
  if (!tray || !window) return;

  const trayBounds = tray.getBounds();
  const windowBounds = window.getBounds();
  const primaryDisplay = screen.getPrimaryDisplay();
  const displayBounds = primaryDisplay.bounds;

  // Calculate position to center window below/above tray icon
  let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  let y: number;

  // Check if we're on macOS (menu bar at top)
  if (process.platform === 'darwin') {
    // Position below the menu bar
    y = Math.round(trayBounds.y + trayBounds.height);
  } else {
    // For other platforms, position above the tray
    y = Math.round(trayBounds.y - windowBounds.height);
  }

  // Ensure window stays within screen bounds
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

app.whenReady().then(() => {
  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', (event: Event) => {
  // Prevent app from quitting when all windows are closed (menubar app behavior)
  event.preventDefault();
});

// Quit when user quits from the tray or uses Cmd+Q
app.on('before-quit', () => {
  if (window) {
    window.removeAllListeners('close');
    window.close();
  }
});
