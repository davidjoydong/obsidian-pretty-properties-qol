# Pretty Properties QoL

An independent Obsidian plugin for quickly assigning local images to image-related note properties.

## Current features

- Use the native Obsidian image context menu to set a local image as Icon, Cover, or Banner.
- Choose an external image from the operating system file picker, import it into the vault, and assign it to the selected property.
- Use command palette fallbacks for all three image roles.
- Configure the property names, import directory, imported file naming strategy, and image property link style.

The plugin does not require Pretty Properties, but its default property names are compatible with Pretty Properties: `icon`, `cover`, and `banner`.

## Documentation

- [Technical plan](TECHNICAL-PLAN.md)
- [Domain context](CONTEXT.md)
- [First-stage task summary](docs/TASK-SUMMARY-2026-09-14.md)

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` into a vault's `.obsidian/plugins/pretty-properties-qol/` directory for manual testing.
