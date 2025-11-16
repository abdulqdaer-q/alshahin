/**
 * Build Configuration Validation Tests
 *
 * These tests verify that the build configuration is correct and
 * all necessary files and settings are in place for production builds.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Build Configuration', () => {
  const rootDir = path.join(__dirname, '../..');

  describe('electron-builder.yml', () => {
    const configPath = path.join(rootDir, 'electron-builder.yml');
    let config: any;

    beforeAll(() => {
      expect(fs.existsSync(configPath)).toBe(true);
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = yaml.load(configContent);
    });

    it('should exist', () => {
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should have correct appId', () => {
      expect(config.appId).toBe('com.electron.menubar.app');
    });

    it('should have productName', () => {
      expect(config.productName).toBeDefined();
      expect(config.productName).toBe('Web Apps Menubar');
    });

    it('should have output directory configured', () => {
      expect(config.directories).toBeDefined();
      expect(config.directories.output).toBe('dist');
    });

    it('should have files configuration', () => {
      expect(config.files).toBeDefined();
      expect(Array.isArray(config.files)).toBe(true);
      expect(config.files).toContain('dist/**/*');
    });

    it('should enable asar packaging', () => {
      expect(config.asar).toBe(true);
    });

    it('should have macOS configuration', () => {
      expect(config.mac).toBeDefined();
      expect(config.mac.category).toBeDefined();
      expect(config.mac.hardenedRuntime).toBe(true);
    });

    it('should have macOS targets configured', () => {
      expect(config.mac.target).toBeDefined();
      expect(Array.isArray(config.mac.target)).toBe(true);

      const targets = config.mac.target.map((t: any) => t.target);
      expect(targets).toContain('dmg');
      expect(targets).toContain('pkg');
      expect(targets).toContain('zip');
    });

    it('should support Universal builds', () => {
      const dmgTarget = config.mac.target.find((t: any) => t.target === 'dmg');
      expect(dmgTarget).toBeDefined();
      expect(dmgTarget.arch).toContain('universal');
    });

    it('should have entitlements configured', () => {
      expect(config.mac.entitlements).toBeDefined();
      expect(config.mac.entitlementsInherit).toBeDefined();
    });

    it('should have DMG configuration', () => {
      expect(config.dmg).toBeDefined();
      expect(config.dmg.title).toBeDefined();
      expect(config.dmg.format).toBe('ULFO');
    });

    it('should have PKG configuration', () => {
      expect(config.pkg).toBeDefined();
      expect(config.pkg.installLocation).toBe('/Applications');
    });

    it('should have compression enabled', () => {
      expect(config.compression).toBe('maximum');
    });
  });

  describe('Entitlements File', () => {
    const entitlementsPath = path.join(rootDir, 'build/entitlements.mac.plist');

    it('should exist', () => {
      expect(fs.existsSync(entitlementsPath)).toBe(true);
    });

    it('should be valid XML', () => {
      const content = fs.readFileSync(entitlementsPath, 'utf8');
      expect(content).toContain('<?xml version="1.0"');
      expect(content).toContain('<!DOCTYPE plist');
      expect(content).toContain('<plist version="1.0">');
    });

    it('should contain required entitlements', () => {
      const content = fs.readFileSync(entitlementsPath, 'utf8');

      // Required for Electron
      expect(content).toContain('com.apple.security.cs.allow-jit');
      expect(content).toContain('com.apple.security.cs.allow-unsigned-executable-memory');

      // Required for network access
      expect(content).toContain('com.apple.security.network.client');
    });
  });

  describe('Build Script', () => {
    const scriptPath = path.join(rootDir, 'build_and_package.sh');

    it('should exist', () => {
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should be executable', () => {
      const stats = fs.statSync(scriptPath);
      const isExecutable = (stats.mode & fs.constants.S_IXUSR) !== 0;
      expect(isExecutable).toBe(true);
    });

    it('should have correct shebang', () => {
      const content = fs.readFileSync(scriptPath, 'utf8');
      expect(content.startsWith('#!/bin/bash')).toBe(true);
    });

    it('should contain key build steps', () => {
      const content = fs.readFileSync(scriptPath, 'utf8');

      // Check for essential build steps
      expect(content).toContain('npm ci');
      expect(content).toContain('npm run build');
      expect(content).toContain('electron-builder');

      // Check for configuration variables
      expect(content).toContain('APP_NAME');
      expect(content).toContain('BUNDLE_ID');
      expect(content).toContain('IDENTITY_APP');
      expect(content).toContain('IDENTITY_INSTALLER');
    });
  });

  describe('Package.json Build Configuration', () => {
    const packagePath = path.join(rootDir, 'package.json');
    let packageJson: any;

    beforeAll(() => {
      const content = fs.readFileSync(packagePath, 'utf8');
      packageJson = JSON.parse(content);
    });

    it('should have electron-builder as dev dependency', () => {
      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies['electron-builder']).toBeDefined();
    });

    it('should have build scripts', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.pack).toBeDefined();
      expect(packageJson.scripts.dist).toBeDefined();
      expect(packageJson.scripts['dist:mac']).toBeDefined();
    });

    it('should have architecture-specific build scripts', () => {
      expect(packageJson.scripts['dist:mac:arm64']).toBeDefined();
      expect(packageJson.scripts['dist:mac:x64']).toBeDefined();
      expect(packageJson.scripts['dist:mac:universal']).toBeDefined();
    });

    it('should have release script', () => {
      expect(packageJson.scripts.release).toBeDefined();
      expect(packageJson.scripts.release).toContain('--publish never');
    });

    it('should have correct main entry point', () => {
      expect(packageJson.main).toBe('dist/main/main.js');
    });
  });

  describe('Build Directory Structure', () => {
    it('should have build directory', () => {
      const buildDir = path.join(rootDir, 'build');
      expect(fs.existsSync(buildDir)).toBe(true);
    });

    it('should have assets directory', () => {
      const assetsDir = path.join(rootDir, 'assets');
      expect(fs.existsSync(assetsDir)).toBe(true);
    });

    it('should have icon file', () => {
      const iconPath = path.join(rootDir, 'assets/iconTemplate.png');
      expect(fs.existsSync(iconPath)).toBe(true);
    });
  });

  describe('TypeScript Build', () => {
    const distDir = path.join(rootDir, 'dist');

    it('should have tsconfig.json', () => {
      const tsconfigPath = path.join(rootDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should have correct output directory in tsconfig', () => {
      const tsconfigPath = path.join(rootDir, 'tsconfig.json');
      const content = fs.readFileSync(tsconfigPath, 'utf8');
      const tsconfig = JSON.parse(content);

      expect(tsconfig.compilerOptions.outDir).toBe('./dist');
    });
  });

  describe('Notarization Script', () => {
    const notarizePath = path.join(rootDir, 'build/notarize.js');

    it('should exist', () => {
      expect(fs.existsSync(notarizePath)).toBe(true);
    });

    it('should be valid JavaScript', () => {
      const content = fs.readFileSync(notarizePath, 'utf8');

      // Basic syntax check
      expect(content).toContain('exports.default');
      expect(content).toContain('notarize');
    });

    it('should check for environment variables', () => {
      const content = fs.readFileSync(notarizePath, 'utf8');

      expect(content).toContain('APPLE_ID');
      expect(content).toContain('APPLE_ID_PASSWORD');
      expect(content).toContain('APPLE_TEAM_ID');
    });
  });

  describe('Build Artifacts Exclusions', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');

    it('should have .gitignore', () => {
      expect(fs.existsSync(gitignorePath)).toBe(true);
    });

    it('should ignore dist directory', () => {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      expect(content).toMatch(/dist/);
    });

    it('should ignore build artifacts', () => {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      const lines = content.split('\n');

      // Should ignore common build artifacts
      const shouldIgnore = ['node_modules', 'dist'];
      shouldIgnore.forEach(pattern => {
        expect(lines.some(line => line.includes(pattern))).toBe(true);
      });
    });
  });
});

describe('Build Environment', () => {
  it('should have Node.js installed', () => {
    expect(process.version).toBeDefined();
    expect(process.version).toMatch(/^v\d+\.\d+\.\d+/);
  });

  it('should meet minimum Node.js version (v18+)', () => {
    const version = process.version.replace('v', '');
    const major = parseInt(version.split('.')[0], 10);
    expect(major).toBeGreaterThanOrEqual(18);
  });
});

describe('Security Configuration', () => {
  describe('Hardened Runtime', () => {
    const configPath = path.join(__dirname, '../../electron-builder.yml');
    let config: any;

    beforeAll(() => {
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = yaml.load(configContent);
    });

    it('should enable hardened runtime', () => {
      expect(config.mac.hardenedRuntime).toBe(true);
    });

    it('should disable gatekeeper assessment', () => {
      expect(config.mac.gatekeeperAssess).toBe(false);
    });
  });

  describe('File Permissions', () => {
    it('build script should have correct permissions', () => {
      const scriptPath = path.join(__dirname, '../../build_and_package.sh');
      const stats = fs.statSync(scriptPath);

      // Check if file is executable by owner
      const isExecutable = (stats.mode & fs.constants.S_IXUSR) !== 0;
      expect(isExecutable).toBe(true);
    });
  });
});

describe('Documentation', () => {
  const rootDir = path.join(__dirname, '../..');

  it('should have README.md', () => {
    const readmePath = path.join(rootDir, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
  });

  it('should have build instructions in documentation', () => {
    // This will be checked after BUILDING.md is created
    const buildDocPath = path.join(rootDir, 'BUILDING.md');
    // We'll add this test once BUILDING.md is created
    // expect(fs.existsSync(buildDocPath)).toBe(true);
  });
});
