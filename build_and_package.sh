#!/bin/bash

################################################################################
# build_and_package.sh
#
# Comprehensive build and packaging script for macOS Electron app
# Produces Universal .app (arm64 + x64) and .pkg installer
#
# Usage:
#   ./build_and_package.sh [OPTIONS]
#
# Options:
#   --arm64-only        Build for Apple Silicon only (smaller size)
#   --x64-only          Build for Intel only
#   --universal         Build Universal binary (default)
#   --skip-signing      Skip code signing (for development)
#   --skip-notarize     Skip notarization (for development)
#   --clean             Clean build artifacts before building
#   --skip-tests        Skip running tests
#   --help              Show this help message
#
# Environment Variables (for signing):
#   IDENTITY_APP        - Developer ID Application certificate
#   IDENTITY_INSTALLER  - Developer ID Installer certificate
#   APPLE_ID            - Apple ID for notarization
#   APPLE_ID_PASSWORD   - App-specific password for notarization
#   APPLE_TEAM_ID       - Apple Developer Team ID
#
# Examples:
#   ./build_and_package.sh                    # Build Universal binary
#   ./build_and_package.sh --arm64-only       # Build for Apple Silicon only
#   ./build_and_package.sh --clean            # Clean build
#   ./build_and_package.sh --skip-signing     # Build without signing
################################################################################

set -e  # Exit on error
# set -x  # Uncomment for debugging

################################################################################
# Configuration Variables
################################################################################

APP_NAME="Web Apps Menubar"
BUNDLE_ID="com.electron.menubar.app"
VERSION="1.0.0"

# Code signing identities (placeholders)
# Replace these with your actual Developer ID certificates
# Example: "Developer ID Application: Your Name (TEAM_ID)"
IDENTITY_APP="${IDENTITY_APP:-}"
IDENTITY_INSTALLER="${IDENTITY_INSTALLER:-}"

# Notarization credentials (optional)
APPLE_ID="${APPLE_ID:-}"
APPLE_ID_PASSWORD="${APPLE_ID_PASSWORD:-}"
APPLE_TEAM_ID="${APPLE_TEAM_ID:-}"

# Build configuration
BUILD_ARCH="universal"  # Can be: universal, arm64, x64
SKIP_SIGNING=false
SKIP_NOTARIZE=false
SKIP_TESTS=false
CLEAN_BUILD=false
OUTPUT_DIR="dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

show_help() {
    head -n 40 "$0" | grep "^#" | sed 's/^# //g' | sed 's/^#//g'
    exit 0
}

################################################################################
# Parse Command Line Arguments
################################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --arm64-only)
            BUILD_ARCH="arm64"
            shift
            ;;
        --x64-only)
            BUILD_ARCH="x64"
            shift
            ;;
        --universal)
            BUILD_ARCH="universal"
            shift
            ;;
        --skip-signing)
            SKIP_SIGNING=true
            shift
            ;;
        --skip-notarize)
            SKIP_NOTARIZE=true
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

################################################################################
# Pre-flight Checks
################################################################################

print_header "Pre-flight Checks"

# Check for required commands
print_info "Checking for required tools..."
check_command node
check_command npm
check_command tsc

print_success "All required tools are installed"

# Check Node version
NODE_VERSION=$(node --version)
print_info "Node version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
print_info "npm version: $NPM_VERSION"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_warning "This script is designed for macOS. Some features may not work on other platforms."
fi

# Print build configuration
print_info "Build Configuration:"
echo "  App Name: $APP_NAME"
echo "  Bundle ID: $BUNDLE_ID"
echo "  Version: $VERSION"
echo "  Architecture: $BUILD_ARCH"
echo "  Output Directory: $OUTPUT_DIR"
echo "  Skip Signing: $SKIP_SIGNING"
echo "  Skip Notarization: $SKIP_NOTARIZE"
echo "  Skip Tests: $SKIP_TESTS"
echo "  Clean Build: $CLEAN_BUILD"

################################################################################
# Clean (if requested)
################################################################################

if [ "$CLEAN_BUILD" = true ]; then
    print_header "Cleaning Build Artifacts"

    print_info "Removing dist/ directory..."
    rm -rf dist/

    print_info "Removing node_modules/.cache..."
    rm -rf node_modules/.cache/

    print_success "Clean completed"
fi

################################################################################
# Install Dependencies
################################################################################

print_header "Installing Dependencies"

print_info "Running npm ci (clean install)..."
if npm ci; then
    print_success "Dependencies installed successfully"
else
    print_warning "npm ci failed, falling back to npm install..."
    npm install
fi

################################################################################
# Run Tests
################################################################################

if [ "$SKIP_TESTS" = false ]; then
    print_header "Running Tests"

    print_info "Running Jest tests..."
    if npm test; then
        print_success "All tests passed"
    else
        print_error "Tests failed. Build aborted."
        exit 1
    fi
else
    print_warning "Skipping tests (--skip-tests flag set)"
fi

################################################################################
# Build TypeScript
################################################################################

print_header "Building TypeScript"

print_info "Compiling TypeScript to JavaScript..."
if npm run build; then
    print_success "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Verify compiled files exist
if [ ! -f "dist/main/main.js" ]; then
    print_error "Compiled main.js not found. Build failed."
    exit 1
fi

print_success "Build artifacts verified"

################################################################################
# Configure Signing
################################################################################

print_header "Configuring Code Signing"

if [ "$SKIP_SIGNING" = true ]; then
    print_warning "Code signing will be skipped (--skip-signing flag set)"
    export CSC_IDENTITY_AUTO_DISCOVERY=false
else
    if [ -z "$IDENTITY_APP" ]; then
        print_warning "IDENTITY_APP not set. Building without code signing."
        print_info "To enable signing, set: export IDENTITY_APP=\"Developer ID Application: Your Name (TEAM_ID)\""
        export CSC_IDENTITY_AUTO_DISCOVERY=false
    else
        print_success "App signing identity: $IDENTITY_APP"
        export IDENTITY_APP="$IDENTITY_APP"

        # Verify the certificate exists
        if security find-identity -v -p codesigning | grep -q "$IDENTITY_APP"; then
            print_success "Code signing certificate found in keychain"
        else
            print_warning "Code signing certificate not found in keychain"
            print_info "Available certificates:"
            security find-identity -v -p codesigning
        fi
    fi

    if [ -z "$IDENTITY_INSTALLER" ]; then
        print_warning "IDENTITY_INSTALLER not set. PKG will not be signed."
        print_info "To enable PKG signing, set: export IDENTITY_INSTALLER=\"Developer ID Installer: Your Name (TEAM_ID)\""
    else
        print_success "Installer signing identity: $IDENTITY_INSTALLER"
        export IDENTITY_INSTALLER="$IDENTITY_INSTALLER"
    fi
fi

################################################################################
# Configure Notarization
################################################################################

print_header "Configuring Notarization"

if [ "$SKIP_NOTARIZE" = true ]; then
    print_warning "Notarization will be skipped (--skip-notarize flag set)"
elif [ -z "$APPLE_ID" ] || [ -z "$APPLE_ID_PASSWORD" ] || [ -z "$APPLE_TEAM_ID" ]; then
    print_warning "Notarization credentials not set. Skipping notarization."
    print_info "To enable notarization, set the following environment variables:"
    print_info "  export APPLE_ID=\"your-apple-id@example.com\""
    print_info "  export APPLE_ID_PASSWORD=\"xxxx-xxxx-xxxx-xxxx\""
    print_info "  export APPLE_TEAM_ID=\"XXXXXXXXXX\""
else
    print_success "Notarization credentials configured"
    export APPLE_ID="$APPLE_ID"
    export APPLE_ID_PASSWORD="$APPLE_ID_PASSWORD"
    export APPLE_TEAM_ID="$APPLE_TEAM_ID"
fi

################################################################################
# Build Electron App
################################################################################

print_header "Building Electron App"

# Set the build command based on architecture
case $BUILD_ARCH in
    arm64)
        BUILD_CMD="npm run dist:mac:arm64"
        print_info "Building for Apple Silicon (arm64) only..."
        ;;
    x64)
        BUILD_CMD="npm run dist:mac:x64"
        print_info "Building for Intel (x64) only..."
        ;;
    universal)
        BUILD_CMD="npm run dist:mac:universal"
        print_info "Building Universal binary (arm64 + x64)..."
        ;;
    *)
        print_error "Unknown architecture: $BUILD_ARCH"
        exit 1
        ;;
esac

# Run the build
print_info "Running electron-builder..."
if eval "$BUILD_CMD"; then
    print_success "Electron app built successfully"
else
    print_error "Electron build failed"
    exit 1
fi

################################################################################
# Verify Build Artifacts
################################################################################

print_header "Verifying Build Artifacts"

# Check for .app
APP_FILE=$(find "$OUTPUT_DIR" -name "*.app" -type d | head -n 1)
if [ -n "$APP_FILE" ]; then
    print_success "Found .app: $APP_FILE"

    # Get app size
    APP_SIZE=$(du -sh "$APP_FILE" | cut -f1)
    print_info "App size: $APP_SIZE"

    # Verify code signature (if signed)
    if [ "$SKIP_SIGNING" = false ] && [ -n "$IDENTITY_APP" ]; then
        print_info "Verifying code signature..."
        if codesign --verify --deep --strict --verbose=2 "$APP_FILE" 2>&1; then
            print_success "Code signature is valid"
        else
            print_warning "Code signature verification failed"
        fi

        # Display signature info
        print_info "Signature information:"
        codesign -dv --verbose=4 "$APP_FILE" 2>&1 | grep -E "(Authority|TeamIdentifier|Identifier)"
    fi
else
    print_error ".app file not found in $OUTPUT_DIR"
    exit 1
fi

# Check for .dmg
DMG_FILE=$(find "$OUTPUT_DIR" -name "*.dmg" -type f | head -n 1)
if [ -n "$DMG_FILE" ]; then
    print_success "Found .dmg: $DMG_FILE"
    DMG_SIZE=$(du -sh "$DMG_FILE" | cut -f1)
    print_info "DMG size: $DMG_SIZE"
else
    print_warning ".dmg file not found"
fi

# Check for .pkg
PKG_FILE=$(find "$OUTPUT_DIR" -name "*.pkg" -type f | head -n 1)
if [ -n "$PKG_FILE" ]; then
    print_success "Found .pkg: $PKG_FILE"
    PKG_SIZE=$(du -sh "$PKG_FILE" | cut -f1)
    print_info "PKG size: $PKG_SIZE"

    # Verify PKG signature (if signed)
    if [ "$SKIP_SIGNING" = false ] && [ -n "$IDENTITY_INSTALLER" ]; then
        print_info "Verifying PKG signature..."
        if pkgutil --check-signature "$PKG_FILE"; then
            print_success "PKG signature is valid"
        else
            print_warning "PKG signature verification failed"
        fi
    fi
else
    print_warning ".pkg file not found"
fi

# Check for .zip
ZIP_FILE=$(find "$OUTPUT_DIR" -name "*.zip" -type f | head -n 1)
if [ -n "$ZIP_FILE" ]; then
    print_success "Found .zip: $ZIP_FILE"
    ZIP_SIZE=$(du -sh "$ZIP_FILE" | cut -f1)
    print_info "ZIP size: $ZIP_SIZE"
fi

################################################################################
# Summary
################################################################################

print_header "Build Summary"

echo ""
print_success "Build completed successfully!"
echo ""
print_info "Build artifacts location: $OUTPUT_DIR/"
echo ""
print_info "Generated files:"

if [ -n "$APP_FILE" ]; then
    echo "  • .app  : $(basename "$APP_FILE") ($APP_SIZE)"
fi
if [ -n "$DMG_FILE" ]; then
    echo "  • .dmg  : $(basename "$DMG_FILE") ($DMG_SIZE)"
fi
if [ -n "$PKG_FILE" ]; then
    echo "  • .pkg  : $(basename "$PKG_FILE") ($PKG_SIZE)"
fi
if [ -n "$ZIP_FILE" ]; then
    echo "  • .zip  : $(basename "$ZIP_FILE") ($ZIP_SIZE)"
fi

echo ""
print_info "Next steps:"

if [ "$SKIP_SIGNING" = true ] || [ -z "$IDENTITY_APP" ]; then
    echo "  1. Configure code signing (see BUILDING.md)"
    echo "  2. Re-run with signing: ./build_and_package.sh"
fi

if [ "$SKIP_NOTARIZE" = true ] || [ -z "$APPLE_ID" ]; then
    echo "  • Configure notarization for distribution (see BUILDING.md)"
fi

echo "  • Test the .app: open \"$APP_FILE\""
if [ -n "$DMG_FILE" ]; then
    echo "  • Test the .dmg: open \"$DMG_FILE\""
fi
if [ -n "$PKG_FILE" ]; then
    echo "  • Test the .pkg: sudo installer -pkg \"$PKG_FILE\" -target /"
fi

echo ""
print_success "All done! 🎉"
echo ""

################################################################################
# End of Script
################################################################################
