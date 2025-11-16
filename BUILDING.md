# Building & Packaging Guide

This guide provides comprehensive instructions for building, signing, and distributing the Web Apps Menubar application for macOS.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Build Configurations](#build-configurations)
- [Code Signing](#code-signing)
- [Notarization](#notarization)
- [Build Script Reference](#build-script-reference)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)
- [Advanced Topics](#advanced-topics)

---

## Prerequisites

### Required Software

1. **macOS**: 10.15 (Catalina) or later recommended
2. **Node.js**: v18.x or later
3. **npm**: v9.x or later
4. **Xcode Command Line Tools**: Required for code signing

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Verify installation
xcode-select -p
```

### Apple Developer Account

For distribution outside of development:

- **Apple Developer Program** membership ($99/year)
- **Developer ID Application** certificate
- **Developer ID Installer** certificate
- **App-specific password** for notarization

### Dependencies

```bash
# Install project dependencies
npm install

# Key build dependencies (installed automatically):
# - electron-builder: Build and packaging tool
# - electron-notarize: Notarization automation
# - typescript: TypeScript compiler
```

---

## Quick Start

### Development Build (Unsigned)

For local development and testing:

```bash
# Clean build
npm run clean

# Build TypeScript
npm run build

# Run the app
npm run dev

# Or use the build script
./build_and_package.sh --skip-signing --skip-notarize
```

### Production Build (Signed & Notarized)

For distribution:

```bash
# 1. Set up code signing (see Code Signing section)
export IDENTITY_APP="Developer ID Application: Your Name (TEAM_ID)"
export IDENTITY_INSTALLER="Developer ID Installer: Your Name (TEAM_ID)"

# 2. Set up notarization (see Notarization section)
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

# 3. Build
./build_and_package.sh
```

---

## Build Configurations

### Architecture Options

#### Universal Binary (Recommended)

Supports both Apple Silicon and Intel Macs:

```bash
# Using build script
./build_and_package.sh --universal

# Using npm
npm run dist:mac:universal
```

**Pros:**
- Single binary works on all Macs
- Best user experience

**Cons:**
- Larger file size (~2x)
- Longer build time

#### Apple Silicon Only (arm64)

For M1/M2/M3/M4 Macs only:

```bash
# Using build script
./build_and_package.sh --arm64-only

# Using npm
npm run dist:mac:arm64
```

**Pros:**
- Smaller file size
- Faster build time
- Native performance on Apple Silicon

**Cons:**
- Won't run on Intel Macs

#### Intel Only (x64)

For older Intel Macs:

```bash
# Using build script
./build_and_package.sh --x64-only

# Using npm
npm run dist:mac:x64
```

**Pros:**
- Smaller file size
- Supports older Macs

**Cons:**
- Won't run on Apple Silicon (unless using Rosetta)
- Rosetta emulation reduces performance

### Package Formats

The build produces three distribution formats:

1. **DMG (Disk Image)**
   - Drag-and-drop installer
   - Most common distribution format
   - User-friendly installation

2. **PKG (Installer Package)**
   - Traditional macOS installer
   - Supports installation scripts
   - Can install to system locations
   - Required for enterprise deployment

3. **ZIP (Archive)**
   - Direct app distribution
   - No installation required
   - Useful for updates

---

## Code Signing

Code signing is **required** for:
- Distribution outside the Mac App Store
- Avoiding Gatekeeper warnings
- Notarization (mandatory for macOS 10.14.5+)

### Step 1: Get Developer ID Certificates

1. **Join Apple Developer Program**: https://developer.apple.com/programs/

2. **Create Certificates**:
   - Go to https://developer.apple.com/account/resources/certificates
   - Click "+" to create a new certificate
   - Select **"Developer ID Application"** (for signing .app)
   - Select **"Developer ID Installer"** (for signing .pkg)
   - Follow the prompts to generate a Certificate Signing Request (CSR)
   - Download and install both certificates

3. **Verify Certificates**:
   ```bash
   # List all code signing certificates
   security find-identity -v -p codesigning

   # You should see entries like:
   # 1) XXXXXXXXXX "Developer ID Application: Your Name (TEAM_ID)"
   # 2) YYYYYYYYYY "Developer ID Installer: Your Name (TEAM_ID)"
   ```

### Step 2: Configure Signing

#### Option 1: Environment Variables (Recommended)

```bash
# Set signing identities
export IDENTITY_APP="Developer ID Application: Your Name (TEAM_ID)"
export IDENTITY_INSTALLER="Developer ID Installer: Your Name (TEAM_ID)"

# Build
./build_and_package.sh
```

#### Option 2: Modify electron-builder.yml

Edit `electron-builder.yml`:

```yaml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"

pkg:
  identity: "Developer ID Installer: Your Name (TEAM_ID)"
```

**Note**: Using environment variables is preferred to avoid committing credentials.

### Step 3: Verify Signing

After building:

```bash
# Verify .app signature
codesign --verify --deep --strict --verbose=2 "dist/mac-arm64/Web Apps Menubar.app"

# Display signature info
codesign -dv --verbose=4 "dist/mac-arm64/Web Apps Menubar.app"

# Check entitlements
codesign -d --entitlements - "dist/mac-arm64/Web Apps Menubar.app"

# Verify PKG signature
pkgutil --check-signature "dist/Web Apps Menubar-1.0.0-arm64.pkg"

# Assess Gatekeeper compatibility
spctl -a -v "dist/mac-arm64/Web Apps Menubar.app"
```

### Entitlements

The app uses hardened runtime with entitlements defined in `build/entitlements.mac.plist`:

**Required Entitlements:**
- `com.apple.security.cs.allow-jit` - Required for V8 JavaScript engine
- `com.apple.security.cs.allow-unsigned-executable-memory` - Required for Electron
- `com.apple.security.cs.disable-library-validation` - Required for native modules
- `com.apple.security.network.client` - Required for web content

**Optional Entitlements** (commented out by default):
- `com.apple.security.device.audio-input` - Enable if using microphone
- `com.apple.security.device.camera` - Enable if using camera
- `com.apple.security.personal-information.location` - Enable if using location services

To modify entitlements, edit `build/entitlements.mac.plist`.

---

## Notarization

Notarization is **required** for:
- macOS 10.14.5 and later
- Distribution outside the Mac App Store
- Avoiding Gatekeeper blocks

### Step 1: Create App-Specific Password

1. Go to https://appleid.apple.com/account/manage
2. Sign in with your Apple ID
3. Under **Security** → **App-Specific Passwords**, click **Generate Password**
4. Label it "Notarization" and save the password (xxxx-xxxx-xxxx-xxxx)

### Step 2: Find Your Team ID

```bash
# List all Developer ID certificates with Team IDs
security find-identity -v -p codesigning

# Or check your Apple Developer account:
# https://developer.apple.com/account → Membership
```

Your Team ID is a 10-character alphanumeric string (e.g., `ABC123DEFG`).

### Step 3: Configure Notarization

```bash
# Set environment variables
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
export APPLE_TEAM_ID="ABC123DEFG"  # Your 10-character Team ID
```

### Step 4: Enable Notarization

The notarization script is in `build/notarize.js`. It's configured in `electron-builder.yml`:

```yaml
afterSign: build/notarize.js
```

When you build with notarization credentials set, the script will:
1. Upload the signed app to Apple's notarization service
2. Wait for notarization to complete (can take 5-30 minutes)
3. Staple the notarization ticket to the app

### Step 5: Build with Notarization

```bash
# All-in-one: Sign and notarize
./build_and_package.sh

# The script will:
# 1. Sign the .app
# 2. Submit for notarization
# 3. Wait for Apple's response
# 4. Staple the ticket
```

### Step 6: Verify Notarization

```bash
# Check if notarization ticket is stapled
stapler validate "dist/mac-arm64/Web Apps Menubar.app"

# Check notarization status
spctl -a -vv "dist/mac-arm64/Web Apps Menubar.app"

# You should see: "accepted" and "source=Notarized Developer ID"
```

### Manual Notarization

If automatic notarization fails, you can notarize manually:

```bash
# 1. Create a ZIP of the signed .app
ditto -c -k --keepParent "dist/mac-arm64/Web Apps Menubar.app" "app.zip"

# 2. Submit for notarization
xcrun notarytool submit "app.zip" \
  --apple-id "your-apple-id@example.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "ABC123DEFG" \
  --wait

# 3. Staple the ticket (after success)
xcrun stapler staple "dist/mac-arm64/Web Apps Menubar.app"
```

---

## Build Script Reference

The `build_and_package.sh` script automates the entire build process.

### Usage

```bash
./build_and_package.sh [OPTIONS]
```

### Options

| Option | Description |
|--------|-------------|
| `--arm64-only` | Build for Apple Silicon only (smaller size) |
| `--x64-only` | Build for Intel only |
| `--universal` | Build Universal binary (default) |
| `--skip-signing` | Skip code signing (for development) |
| `--skip-notarize` | Skip notarization (for development) |
| `--clean` | Clean build artifacts before building |
| `--skip-tests` | Skip running tests |
| `--help` | Show help message |

### Examples

```bash
# Development build (no signing)
./build_and_package.sh --skip-signing --skip-notarize

# Clean Universal build with signing
./build_and_package.sh --clean --universal

# Apple Silicon only, skip tests
./build_and_package.sh --arm64-only --skip-tests

# Production release
./build_and_package.sh
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `IDENTITY_APP` | Developer ID Application certificate | `"Developer ID Application: John Doe (ABC123)"` |
| `IDENTITY_INSTALLER` | Developer ID Installer certificate | `"Developer ID Installer: John Doe (ABC123)"` |
| `APPLE_ID` | Apple ID for notarization | `john@example.com` |
| `APPLE_ID_PASSWORD` | App-specific password | `xxxx-xxxx-xxxx-xxxx` |
| `APPLE_TEAM_ID` | Apple Developer Team ID | `ABC123DEFG` |

### Build Output

The script creates the following in `dist/`:

```
dist/
├── mac-arm64/
│   └── Web Apps Menubar.app       # Signed .app bundle
├── Web Apps Menubar-1.0.0-arm64.dmg
├── Web Apps Menubar-1.0.0-arm64.pkg
└── Web Apps Menubar-1.0.0-arm64-mac.zip
```

---

## Troubleshooting

### Common Issues

#### 1. "Developer cannot be verified" Error

**Symptom**: Gatekeeper blocks the app when users try to open it.

**Cause**: App is not signed or notarized.

**Solution**:
```bash
# Ensure proper signing and notarization
./build_and_package.sh

# Verify signature
codesign --verify --deep --strict --verbose=2 "path/to/app"

# Verify notarization
spctl -a -vv "path/to/app"
```

#### 2. Code Signing Failed

**Symptom**: `errSecInternalComponent` or certificate not found errors.

**Cause**: Certificate not installed or keychain locked.

**Solution**:
```bash
# Unlock keychain
security unlock-keychain ~/Library/Keychains/login.keychain-db

# List available certificates
security find-identity -v -p codesigning

# Ensure certificate is installed
# If not, re-download from Apple Developer portal
```

#### 3. Notarization Stuck or Times Out

**Symptom**: Notarization doesn't complete after 30+ minutes.

**Cause**: Apple's servers are slow or there's an issue with the submission.

**Solution**:
```bash
# Check notarization history
xcrun notarytool history \
  --apple-id "your@email.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "TEAM_ID"

# Get submission details
xcrun notarytool info SUBMISSION_ID \
  --apple-id "your@email.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "TEAM_ID"

# If stuck, cancel and resubmit
./build_and_package.sh --skip-tests
```

#### 4. Invalid Signature Error

**Symptom**: `codesign --verify` fails with "invalid signature" error.

**Cause**: Hardened runtime entitlements issue or corrupted binary.

**Solution**:
```bash
# Clean rebuild
npm run clean
./build_and_package.sh --clean

# Check entitlements
codesign -d --entitlements - "path/to/app"

# Ensure build/entitlements.mac.plist is valid
xmllint --noout build/entitlements.mac.plist
```

#### 5. "The application is not signed" Error

**Symptom**: App appears unsigned even though you signed it.

**Cause**: electron-builder config issue or environment variable not set.

**Solution**:
```bash
# Verify environment variables are set
echo $IDENTITY_APP
echo $IDENTITY_INSTALLER

# Ensure electron-builder picks up the identity
export CSC_NAME="$IDENTITY_APP"

# Rebuild
./build_and_package.sh
```

#### 6. PKG Installation Fails

**Symptom**: Installer package won't install or shows security warning.

**Cause**: PKG not signed with Developer ID Installer certificate.

**Solution**:
```bash
# Set installer identity
export IDENTITY_INSTALLER="Developer ID Installer: Your Name (TEAM_ID)"

# Rebuild
./build_and_package.sh

# Verify PKG signature
pkgutil --check-signature "dist/Web Apps Menubar-1.0.0-arm64.pkg"
```

#### 7. Gatekeeper "Damaged" Error

**Symptom**: macOS says the app is "damaged and can't be opened."

**Cause**: App was modified after signing or quarantine flag is set.

**Solution**:
```bash
# Remove quarantine attribute
xattr -cr "path/to/Web Apps Menubar.app"

# For users: right-click → Open (first time only)
# Or use:
spctl --add "path/to/app"
spctl --enable --label "Web Apps Menubar"
```

#### 8. Native Module Errors

**Symptom**: App crashes on launch with native module errors.

**Cause**: Native modules not rebuilt for Electron.

**Solution**:
```bash
# Install electron-rebuild
npm install --save-dev electron-rebuild

# Rebuild native modules
npx electron-rebuild

# Rebuild for specific architecture
npx electron-rebuild --arch=arm64
```

#### 9. Build Fails with "ENOENT" Error

**Symptom**: electron-builder can't find files.

**Cause**: TypeScript not compiled or wrong paths.

**Solution**:
```bash
# Ensure TypeScript is compiled
npm run build

# Check dist/ directory exists
ls -la dist/main/main.js

# Verify package.json main field
grep '"main"' package.json
# Should be: "main": "dist/main/main.js"
```

#### 10. Notarization Rejected

**Symptom**: Notarization fails with "Invalid" status.

**Cause**: Missing entitlements or invalid hardened runtime config.

**Solution**:
```bash
# Get detailed rejection info
xcrun notarytool info SUBMISSION_ID \
  --apple-id "your@email.com" \
  --password "xxxx" \
  --team-id "TEAM"

# Common fixes:
# 1. Ensure hardened runtime is enabled (check electron-builder.yml)
# 2. Add required entitlements to build/entitlements.mac.plist
# 3. Sign with proper timestamp
codesign --force --deep --timestamp \
  --options runtime \
  --entitlements build/entitlements.mac.plist \
  --sign "$IDENTITY_APP" \
  "path/to/app"
```

### Debugging Tips

#### Enable Verbose Logging

```bash
# electron-builder debug mode
DEBUG=electron-builder npm run dist

# Build script debug mode
# Edit build_and_package.sh and uncomment:
# set -x
```

#### Test Signing Locally

```bash
# Build without packaging
npm run pack

# Manually sign the .app
codesign --force --deep --timestamp \
  --options runtime \
  --entitlements build/entitlements.mac.plist \
  --sign "$IDENTITY_APP" \
  "dist/mac-arm64/Web Apps Menubar.app"

# Verify
codesign --verify --deep --strict --verbose=2 "dist/mac-arm64/Web Apps Menubar.app"
```

#### Check System Requirements

```bash
# macOS version
sw_vers

# Xcode Command Line Tools
xcode-select -p

# Node.js version (should be 18+)
node --version

# npm version
npm --version

# Check for required tools
which codesign
which pkgutil
which xcrun
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: macos-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Import certificates
        env:
          CERTIFICATE_APP_BASE64: ${{ secrets.CERTIFICATE_APP_BASE64 }}
          CERTIFICATE_INSTALLER_BASE64: ${{ secrets.CERTIFICATE_INSTALLER_BASE64 }}
          CERTIFICATE_PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
        run: |
          # Create temporary keychain
          security create-keychain -p "$CERTIFICATE_PASSWORD" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "$CERTIFICATE_PASSWORD" build.keychain

          # Import certificates
          echo "$CERTIFICATE_APP_BASE64" | base64 --decode > cert_app.p12
          echo "$CERTIFICATE_INSTALLER_BASE64" | base64 --decode > cert_installer.p12

          security import cert_app.p12 -k build.keychain -P "$CERTIFICATE_PASSWORD" -T /usr/bin/codesign
          security import cert_installer.p12 -k build.keychain -P "$CERTIFICATE_PASSWORD" -T /usr/bin/codesign

          # Set key partition list
          security set-key-partition-list -S apple-tool:,apple: -s -k "$CERTIFICATE_PASSWORD" build.keychain

      - name: Build and package
        env:
          IDENTITY_APP: ${{ secrets.IDENTITY_APP }}
          IDENTITY_INSTALLER: ${{ secrets.IDENTITY_INSTALLER }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: ./build_and_package.sh

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: macos-installers
          path: |
            dist/*.dmg
            dist/*.pkg
            dist/*.zip

      - name: Create Release
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: |
            dist/*.dmg
            dist/*.pkg
            dist/*.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Required Secrets

In GitHub repository settings → Secrets and variables → Actions, add:

- `CERTIFICATE_APP_BASE64`: Base64-encoded .p12 file for Developer ID Application
- `CERTIFICATE_INSTALLER_BASE64`: Base64-encoded .p12 file for Developer ID Installer
- `CERTIFICATE_PASSWORD`: Password for .p12 files
- `IDENTITY_APP`: Full certificate name (e.g., "Developer ID Application: Your Name (TEAM_ID)")
- `IDENTITY_INSTALLER`: Full installer certificate name
- `APPLE_ID`: Your Apple ID email
- `APPLE_ID_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Your 10-character Team ID

### Preparing Certificates for CI

```bash
# Export Developer ID Application certificate
security find-identity -v -p codesigning  # Find the identity hash
security export -k ~/Library/Keychains/login.keychain-db \
  -t identities \
  -f pkcs12 \
  -o cert_app.p12 \
  -P "password123"

# Export Developer ID Installer certificate
security export -k ~/Library/Keychains/login.keychain-db \
  -t identities \
  -f pkcs12 \
  -o cert_installer.p12 \
  -P "password123"

# Convert to base64
base64 -i cert_app.p12 | pbcopy  # Copy to clipboard
base64 -i cert_installer.p12 | pbcopy

# Add to GitHub Secrets
```

---

## Advanced Topics

### Custom Build Configuration

Edit `electron-builder.yml` to customize:

```yaml
mac:
  # Custom app category
  category: public.app-category.productivity

  # Custom minimum macOS version
  minimumSystemVersion: "11.0.0"

  # File associations
  fileAssociations:
    - ext: html
      name: HTML Document
      role: Viewer

  # Protocol associations
  protocols:
    - name: web-apps-menubar
      schemes:
        - wam

  # Dark mode icon
  darkModeSupport: true
```

### ASAR Archive Customization

Modify `electron-builder.yml`:

```yaml
asar: true
asarUnpack:
  - "**/node_modules/electron-store/**/*"
  - "**/native-modules/**/*"  # Add your native modules

# Or disable ASAR (not recommended):
# asar: false
```

### Custom PKG Scripts

Create installation scripts in `build/pkg-scripts/`:

```bash
build/pkg-scripts/
├── preinstall      # Runs before installation
├── postinstall     # Runs after installation
└── preflight       # Checks before installation
```

Example `postinstall`:

```bash
#!/bin/bash
# build/pkg-scripts/postinstall

# Open app after installation
open "/Applications/Web Apps Menubar.app"
exit 0
```

Make executable and configure in `electron-builder.yml`:

```bash
chmod +x build/pkg-scripts/*
```

```yaml
pkg:
  scripts: build/pkg-scripts
```

### Electron Rebuild for Native Modules

If using native modules (beyond electron-store):

```bash
# Install electron-rebuild
npm install --save-dev electron-rebuild

# Add to package.json scripts
"postinstall": "electron-rebuild"

# Or rebuild manually
npx electron-rebuild --force --arch=arm64
npx electron-rebuild --force --arch=x64
```

### Size Optimization

Reduce app size:

```bash
# 1. Use arm64-only builds (smaller than universal)
./build_and_package.sh --arm64-only

# 2. Enable ASAR (already enabled by default)
# See electron-builder.yml: asar: true

# 3. Exclude unnecessary files
# Edit electron-builder.yml files section

# 4. Production dependencies only
npm ci --production

# 5. Remove source maps
# Edit tsconfig.json: "sourceMap": false
```

### Multi-Platform Builds

To add Windows/Linux support:

```yaml
# electron-builder.yml

win:
  target:
    - nsis
    - portable
  icon: assets/icon.ico

linux:
  target:
    - AppImage
    - deb
    - rpm
  category: Utility
```

```bash
# Build for all platforms
npm run dist

# Platform-specific
npm run dist:win
npm run dist:linux
```

---

## Resources

### Documentation

- [electron-builder](https://www.electron.build/)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Hardened Runtime](https://developer.apple.com/documentation/security/hardened_runtime)

### Tools

- [Xcode](https://developer.apple.com/xcode/)
- [Apple Developer Portal](https://developer.apple.com/account)
- [macOS Keychain Access](https://support.apple.com/guide/keychain-access)

### Support

- Open an issue: [GitHub Issues](https://github.com/your-repo/issues)
- Documentation: [README.md](README.md)

---

## Checklist

Before releasing:

- [ ] Update version in `package.json`
- [ ] Run all tests: `npm test`
- [ ] Build locally: `./build_and_package.sh`
- [ ] Test the .app on Apple Silicon
- [ ] Test the .app on Intel (if Universal)
- [ ] Test the .dmg installer
- [ ] Test the .pkg installer
- [ ] Verify code signature: `codesign --verify`
- [ ] Verify notarization: `spctl -a -vv`
- [ ] Test on a fresh Mac (no dev tools)
- [ ] Update CHANGELOG.md
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push release: `git push --tags`

---

**Happy Building! 🚀**
