#!/bin/bash

# Script to package the extension for distribution
# Creates a ZIP file ready for download

echo "📦 Packaging Privacy Guard Extension..."

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$SCRIPT_DIR"
ZIP_NAME="privacy-guard-extension.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

# Remove old ZIP if it exists
if [ -f "$ZIP_PATH" ]; then
    echo "🗑️  Removing old ZIP file..."
    rm "$ZIP_PATH"
fi

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
echo "📁 Creating package in: $TEMP_DIR"

# Copy necessary files
echo "📋 Copying files..."
cd "$PROJECT_ROOT"

# Core files
cp manifest.json "$TEMP_DIR/"
cp content.js "$TEMP_DIR/"

# Directories
cp -r background "$TEMP_DIR/"
cp -r content "$TEMP_DIR/"
cp -r lib "$TEMP_DIR/"
cp -r popup "$TEMP_DIR/"
cp -r options "$TEMP_DIR/"
cp -r onboarding "$TEMP_DIR/"
cp -r assets "$TEMP_DIR/"
cp -r data "$TEMP_DIR/"

# Remove any unnecessary files
find "$TEMP_DIR" -name "*.md" -not -path "*/README.md" -delete
find "$TEMP_DIR" -name ".git*" -delete
find "$TEMP_DIR" -name "*.sh" -delete
find "$TEMP_DIR" -name "test-connection.html" -delete
find "$TEMP_DIR" -name "manifest-firefox.json" -delete

# Create ZIP
echo "🗜️  Creating ZIP file..."
cd "$TEMP_DIR"
zip -r "$ZIP_PATH" . -q

# Cleanup
rm -rf "$TEMP_DIR"

# Get file size
FILE_SIZE=$(du -h "$ZIP_PATH" | cut -f1)

echo "✅ Package created successfully!"
echo "📦 File: $ZIP_PATH"
echo "📊 Size: $FILE_SIZE"
echo ""
echo "🚀 Ready to upload to your hosting!"

