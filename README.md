# Shifting Gears

Shifting Gears is a browser-based kinetic counting game and generative art toy. A connected mechanical composition grows one gear at a time, with varied tooth forms, spoke patterns, scale, depth, color, and direction.

## How it works

- Game Mode follows a simple watch, stop, guess, reveal, again loop. A shallow bottom dock keeps the frozen machine visible while the player counts.
- Results stay attached to the artwork, and an optional numbered overlay lets the player verify every gear after guessing.
- Zen Mode grows continuously to a much larger composition. A nearly imperceptible camera reframe follows expansion beyond the initial viewport.
- New gears are placed relative to an existing parent gear. Controlled overlap, bridge placement, and multi-gear contact scoring produce dense interlocking compositions in both modes.
- Game Mode reserves the control area and uses a tighter small-gear fallback pass when the field gets crowded, so growth continues instead of stalling.
- Connected gears alternate direction and use parent-derived tooth ratios. Placement also aligns tooth phase at the contact point.
- Eight procedural interior variants, four tooth profiles, fine and chunky teeth, varied hubs, pinions, and anchor gears create stronger visual contrast.
- Palette changes gently recolor existing gears and affect newly generated gears.
- Canvas rendering uses cached `Path2D` geometry and transform-only animation for smooth performance with 50 or more visible gears.
- The experience supports keyboard navigation, visible focus, semantic controls, live result announcements, reduced motion, dark mode, and responsive layouts.

## Run locally

No install step or backend is required.

```bash
cd /config/projects/shifting-gears
npm run dev
```

Open <http://127.0.0.1:4173>.

Run the static verification suite:

```bash
npm test
```

## Publishing

The project is a dependency-free static site. Pushes to `main` run the GitHub Actions workflow in `.github/workflows/pages.yml`, verify the source, and deploy the repository root to GitHub Pages.

- Source: <https://github.com/JenS246/shifting-gears>
- Live site: <https://jens246.github.io/shifting-gears/>

In the GitHub repository settings, set Pages to use GitHub Actions if it is not selected automatically.

## Architecture

- `index.html`: semantic interface and controls
- `styles.css`: responsive visual system and accessibility preferences
- `app.js`: interface state, game loop, session statistics, sound, and settings
- `gear-engine.js`: gear data model, placement, procedural geometry, animation, and Canvas rendering
- `tests/verify.mjs`: dependency-free structural checks

No backend, database, user account, analytics service, API key, or external asset host is required. Sound is synthesized locally from short filtered noise impulses and is off by default.

## Maintenance

Palette values live in `PALETTES` near the top of `gear-engine.js`. Growth speed and rotation multipliers live in `SPEEDS`. The generation limit is set in `GearEngine.frame()`.

Because all state is ephemeral, backup and restore consist of cloning the GitHub repository. There is no user data to export.
