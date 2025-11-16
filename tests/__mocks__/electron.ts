// Mock Electron modules for testing

export const app = {
  whenReady: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  quit: jest.fn(),
  dock: {
    hide: jest.fn(),
  },
  getPath: jest.fn((name: string) => {
    const paths: { [key: string]: string } = {
      userData: '/mock/user/data',
      documents: '/mock/documents',
      appData: '/mock/appdata',
    };
    return paths[name] || '/mock/path';
  }),
};

export const BrowserWindow = jest.fn().mockImplementation(() => ({
  loadFile: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  show: jest.fn(),
  hide: jest.fn(),
  isVisible: jest.fn(() => false),
  focus: jest.fn(),
  setPosition: jest.fn(),
  getBounds: jest.fn(() => ({ x: 0, y: 0, width: 360, height: 400 })),
  getSize: jest.fn(() => [800, 600]),
  webContents: {
    isDevToolsOpened: jest.fn(() => false),
    send: jest.fn(),
  },
  removeAllListeners: jest.fn(),
  close: jest.fn(),
  addBrowserView: jest.fn(),
  removeBrowserView: jest.fn(),
}));

export const BrowserView = jest.fn().mockImplementation(() => ({
  setBounds: jest.fn(),
  setAutoResize: jest.fn(),
  webContents: {
    loadURL: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    canGoBack: jest.fn(() => false),
    canGoForward: jest.fn(() => false),
    isLoading: jest.fn(() => false),
    getURL: jest.fn(() => 'https://example.com'),
    getTitle: jest.fn(() => 'Example'),
    goBack: jest.fn(),
    goForward: jest.fn(),
    reload: jest.fn(),
    stop: jest.fn(),
    setUserAgent: jest.fn(),
    destroy: jest.fn(),
  },
}));

export const Tray = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
  setToolTip: jest.fn(),
  getBounds: jest.fn(() => ({ x: 100, y: 0, width: 22, height: 22 })),
}));

export const screen = {
  getPrimaryDisplay: jest.fn(() => ({
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
  })),
};

export const nativeImage = {
  createFromPath: jest.fn(() => ({
    resize: jest.fn(function(this: any) { return this; }),
    setTemplateImage: jest.fn(),
  })),
};

export const ipcMain = {
  on: jest.fn(),
  handle: jest.fn(),
  removeHandler: jest.fn(),
};

export const ipcRenderer = {
  on: jest.fn(),
  send: jest.fn(),
  invoke: jest.fn(),
  removeAllListeners: jest.fn(),
};

export const contextBridge = {
  exposeInMainWorld: jest.fn(),
};

export const dialog = {
  showOpenDialog: jest.fn(() => Promise.resolve({
    canceled: false,
    filePaths: ['/mock/path/file.json']
  })),
  showSaveDialog: jest.fn(() => Promise.resolve({
    canceled: false,
    filePath: '/mock/path/export.json'
  })),
};
