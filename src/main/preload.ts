import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: send message to main process
  send: (channel: string, data: any) => {
    // Whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Example: receive message from main process
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes sender
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // Platform detection
  platform: process.platform,
});

// Type definitions for TypeScript (optional, for better IDE support)
export interface IElectronAPI {
  send: (channel: string, data: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
  platform: string;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
