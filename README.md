# Electron Menubar App

A minimal, production-ready Electron menubar application built with TypeScript for macOS.

## Features

- **Menu Bar Integration**: Lives in the macOS menu bar with a tray icon
- **Popover Window**: Click the tray icon to toggle a frameless, resizable popover window
- **TypeScript**: Full TypeScript support for both main and renderer processes
- **Security**: Context isolation enabled with secure IPC via preload script
- **Universal Binary**: Supports both Apple Silicon (ARM64) and Intel (x64) architectures
- **Modern Stack**: Built with latest stable Electron and TypeScript

## Prerequisites

- **Node.js** 18.x or later
- **npm** 9.x or later
- **macOS** (recommended, though it can run on other platforms with minor adjustments)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run in Development Mode

```bash
npm run dev
```

This will:
- Compile TypeScript files to JavaScript
- Launch the Electron app
- Display a tray icon in your menu bar

### 3. Using the App

- Look for the app icon in your macOS menu bar (top-right area)
- Click the icon to toggle the popover window
- Click outside the window or lose focus to hide it
- The window is resizable - drag from any edge

## Project Structure

```
electron-menubar-app/
├── src/
│   ├── main/
│   │   ├── main.ts       # Main process (Electron entry point)
│   │   └── preload.ts    # Preload script (secure IPC bridge)
│   └── renderer/
│       ├── index.html    # UI markup
│       ├── renderer.ts   # Renderer process logic
│       └── styles.css    # Styling
├── assets/
│   └── iconTemplate.png  # Tray icon (16x16 PNG)
├── dist/                 # Compiled JavaScript output (generated)
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

## Development Workflow

1. **Make changes** to TypeScript files in `src/`
2. **Rebuild** by running `npm run build`
3. **Restart** the app with `npm start`

For faster iteration:
- Run `npm run watch` in one terminal (auto-compiles on file changes)
- Run `npm start` in another terminal (restart manually after changes)

## Architecture

### Main Process (`src/main/main.ts`)

- Creates and manages the system tray icon
- Creates a frameless BrowserWindow positioned near the tray icon
- Handles window show/hide toggle logic
- Hides the dock icon on macOS (`app.dock.hide()`)
- Loads the renderer HTML file

### Preload Script (`src/main/preload.ts`)

- Bridges main and renderer processes securely
- Exposes whitelisted IPC channels via `contextBridge`
- Maintains context isolation for security

### Renderer Process (`src/renderer/`)

- Standard web technologies: HTML, CSS, TypeScript
- Communicates with main process via exposed `window.electronAPI`
- Displays version info and platform details

## Customization

### Change Window Size

Edit `WINDOW_WIDTH` and `WINDOW_HEIGHT` in `src/main/main.ts`:

```typescript
const WINDOW_WIDTH = 360;  // Change width
const WINDOW_HEIGHT = 400; // Change height
```

### Replace Tray Icon

Replace `assets/iconTemplate.png` with your own 16x16 PNG icon. For best results on macOS:
- Use a monochrome (black) icon with transparency
- Name it `iconTemplate.png` (suffix tells macOS to use template mode)
- The icon will automatically adapt to light/dark menu bar themes

### Add IPC Communication

1. **Define channels** in `src/main/preload.ts`:

```typescript
const validChannels = ['toMain', 'yourCustomChannel'];
```

2. **Send from renderer**:

```typescript
window.electronAPI.send('toMain', { message: 'Hello from renderer' });
```

3. **Receive in main** (`src/main/main.ts`):

```typescript
import { ipcMain } from 'electron';

ipcMain.on('toMain', (event, data) => {
  console.log('Received:', data);
});
```

## Security

This template follows Electron security best practices:

- **Context Isolation**: Enabled by default
- **Node Integration**: Disabled in renderer
- **Preload Script**: Acts as secure bridge between processes
- **Content Security Policy**: Defined in `index.html`
- **Whitelisted IPC Channels**: Only approved channels exposed

## Platform Compatibility

While designed for macOS, the app can run on Windows and Linux with minor modifications:

- **Windows**: Tray icon appears in system tray; window positions above icon
- **Linux**: Similar to Windows; behavior varies by desktop environment
- **macOS**: Tray icon in menu bar; dock icon hidden; window positions below icon

## Building for Production

For production builds, consider adding:

- **electron-builder** or **electron-forge** for packaging
- Code signing certificates (required for macOS distribution)
- Auto-updater integration
- Error tracking (e.g., Sentry)

Example with electron-builder:

```bash
npm install --save-dev electron-builder
```

Add to `package.json`:

```json
"scripts": {
  "pack": "npm run build && electron-builder --dir",
  "dist": "npm run build && electron-builder"
}
```

## Troubleshooting

### App doesn't appear in menu bar

- Make sure you're on macOS (tray behavior differs on other platforms)
- Check that `assets/iconTemplate.png` exists
- Try logging `tray.getBounds()` to verify tray creation

### TypeScript errors

- Run `npm run build` to see detailed compilation errors
- Ensure `tsconfig.json` is correctly configured
- Verify all dependencies are installed

### Window doesn't show

- Check browser console for errors (enable dev tools in `main.ts`)
- Verify `index.html` path is correct
- Ensure preload script is loading properly

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Note**: Replace the placeholder tray icon (`assets/iconTemplate.png`) with your own icon for production use.
