// This file runs in the renderer process

window.addEventListener('DOMContentLoaded', () => {
  // Display platform information
  const platformElement = document.getElementById('platform');
  if (platformElement && window.electronAPI) {
    platformElement.textContent = window.electronAPI.platform;
  }

  // Display version information
  const electronVersion = document.getElementById('electron-version');
  const nodeVersion = document.getElementById('node-version');
  const chromeVersion = document.getElementById('chrome-version');

  if (electronVersion) {
    electronVersion.textContent = process.versions.electron || 'N/A';
  }
  if (nodeVersion) {
    nodeVersion.textContent = process.versions.node || 'N/A';
  }
  if (chromeVersion) {
    chromeVersion.textContent = process.versions.chrome || 'N/A';
  }

  // Example: Listen for messages from main process
  // Uncomment to use:
  // if (window.electronAPI) {
  //   window.electronAPI.receive('fromMain', (data: any) => {
  //     console.log('Received from main:', data);
  //   });
  // }

  console.log('Renderer process initialized');
});

// Example: Send message to main process
// Uncomment to use:
// function sendToMain(message: string) {
//   if (window.electronAPI) {
//     window.electronAPI.send('toMain', { message });
//   }
// }
