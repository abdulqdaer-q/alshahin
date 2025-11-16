// Optional notarization script for macOS
// This script is called after signing (if configured in electron-builder.yml)
//
// To enable notarization:
// 1. Install electron-notarize: npm install --save-dev electron-notarize
// 2. Set environment variables:
//    - APPLE_ID: Your Apple ID email
//    - APPLE_ID_PASSWORD: App-specific password (https://support.apple.com/en-us/HT204397)
//    - APPLE_TEAM_ID: Your Apple Developer Team ID
// 3. Uncomment the code below

const { notarize } = require('electron-notarize');
const path = require('path');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize for macOS
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Check if notarization is configured
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_ID_PASSWORD;
  const appleTeamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !appleTeamId) {
    console.log('Skipping notarization: APPLE_ID, APPLE_ID_PASSWORD, or APPLE_TEAM_ID not set');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`Notarizing ${appName} at ${appPath}...`);
  console.log('This may take several minutes...');

  try {
    await notarize({
      appBundleId: 'com.electron.menubar.app',
      appPath: appPath,
      appleId: appleId,
      appleIdPassword: appleIdPassword,
      teamId: appleTeamId,
    });
    console.log('Notarization successful!');
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
};

// To use this script:
// 1. Uncomment the line in electron-builder.yml:
//    afterSign: build/notarize.js
// 2. Install electron-notarize:
//    npm install --save-dev electron-notarize
// 3. Set environment variables before building:
//    export APPLE_ID="your-apple-id@example.com"
//    export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
//    export APPLE_TEAM_ID="XXXXXXXXXX"  # Your 10-character Team ID
// 4. Run the build:
//    ./build_and_package.sh
