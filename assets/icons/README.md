# Privacy Guard Icons

This directory should contain the following icon files:

- `icon16.png` - 16x16 pixels
- `icon32.png` - 32x32 pixels  
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## Icon Design Guidelines

The icon should represent privacy protection:
- Shield or lock symbol
- Privacy-focused color scheme (blue/purple)
- Clean, modern design
- Recognizable at small sizes

## Generating Icons

You can use tools like:
- Figma
- Adobe Illustrator
- Online icon generators
- Or create simple SVG and convert to PNG

For now, you can use placeholder icons or generate them using:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

## Quick Placeholder

To quickly create placeholder icons, you can use ImageMagick:

```bash
convert -size 128x128 xc:#6366f1 -pointsize 72 -fill white -gravity center -annotate +0+0 "🛡️" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 32x32 icon32.png
convert icon128.png -resize 16x16 icon16.png
```

Or use any image editor to create a simple shield icon in the brand colors (#6366f1).

