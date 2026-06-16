# Make → Design System

A Figma plugin that turns raw layers pasted in from **Figma Make** into **instances
of your design-system components**. It auto-suggests a component for each layer by
name, lets you confirm or override every mapping, then swaps the layers in place —
carrying text content and position across.

## How it works

1. **Catalog** — the plugin builds a list of available design-system components:
   - **Local** components and component sets defined in the current file.
   - **Team-library** components that are *already referenced* by an instance
     somewhere in the file. Figma's plugin API can't enumerate a published
     library without a component key, so the plugin harvests keys from existing
     instances. The easy way to expose a whole library: drop a **stickersheet**
     or a sample frame containing one instance of each component into the file.
2. **Candidates** — every `FRAME` / `GROUP` / `INSTANCE` / `COMPONENT` inside your
   selection becomes a swap candidate.
3. **Matching** — each candidate is scored against the catalog by name similarity
   (camelCase / kebab / snake aware, stop-words stripped). The best match is
   pre-selected; anything above ~35% confidence is enabled by default.
4. **Swap** — for each confirmed mapping the plugin imports the component, creates
   an instance at the original layer's position/size, copies text content into
   matching text layers (by name, then by order), inserts it at the same spot in
   the parent, and removes the original.

## Install (development)

1. In Figma desktop: **Plugins → Development → Import plugin from manifest…**
2. Select `figma-make-to-ds/manifest.json`.
3. Run it from **Plugins → Development → Make → Design System**.

## Usage

1. Make sure your design-system components are present in the file (in use, or via
   a stickersheet — see Catalog above).
2. Paste the layers copied from Figma Make onto the canvas and **select** them.
3. Run the plugin. Review the suggested mappings:
   - Toggle a row's checkbox to include/exclude it.
   - Change the dropdown to pick a different component (or **— skip —**).
   - Uncheck **Hide unlikely** to map low-confidence layers manually.
4. Press **Swap**. New instances are selected when done.

## Notes & limitations

- **Library must be reachable.** A team-library component only appears in the
  catalog if at least one instance of it already exists in the file. Local
  components always appear.
- **Variants.** Component sets are instantiated from their *default* variant.
  Variant property matching from layer names isn't done automatically — adjust
  variants after swapping if needed.
- **Resize is best-effort.** The instance is resized to the original layer's box
  where the component allows it; fixed-size components keep their own dimensions.
- **Text transfer** matches text layers by name first, then by document order.
  Mixed-font text nodes are skipped (left at the component default).
- No network access; everything runs locally in the file.

## Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Plugin manifest (`documentAccess: dynamic-page`). |
| `code.js` | Main thread: catalog, matching, swap logic. |
| `ui.html` | Mapping panel UI. |
