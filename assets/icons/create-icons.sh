#!/bin/bash
# Script to create Privacy Guard extension icons
# Requires ImageMagick (install with: brew install imagemagick)

# Colors
PRIMARY="#6366f1"
SECONDARY="#8b5cf6"
WHITE="#ffffff"

# Create 128x128 base icon
convert -size 128x128 xc:none \
  -fill "$PRIMARY" \
  -draw "roundrectangle 0,0 128,128 20,20" \
  -fill "$WHITE" \
  -font "Arial-Bold" \
  -pointsize 80 \
  -gravity center \
  -annotate +0+0 "🛡️" \
  icon128.png

# Resize to other sizes
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 32x32 icon32.png
convert icon128.png -resize 16x16 icon16.png

echo "Icons created successfully!"
echo "Files: icon16.png, icon32.png, icon48.png, icon128.png"

