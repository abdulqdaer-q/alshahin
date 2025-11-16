// Mock Electron modules for testing

export const app = {
  whenReady: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  quit: jest.fn(),
  dock: {
    hide: jest.fn(),
  },
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
  webContents: {
    isDevToolsOpened: jest.fn(() => false),
  },
  removeAllListeners: jest.fn(),
  close: jest.fn(),
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
};

export const contextBridge = {
  exposeInMainWorld: jest.fn(),
};
