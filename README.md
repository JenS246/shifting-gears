# Shifting Gears

Shifting Gears is a browser-based kinetic counting game and generative art toy. A connected mechanical composition grows one gear at a time, with varied tooth forms, spoke patterns, scale, depth, color, and direction.

## How it works

- Game Mode follows a simple watch, stop, guess, reveal, again loop. The exact count comes directly from the gear data model.
- Zen Mode grows continuously and includes pause, reset, optional quiet synthesized clicks, and a compact customization drawer.
- New gears are placed relative to an existing parent gear. Collision checks preserve legibility while density settings allow more overlap.
- Connected gears alternate direction. Smaller gears rotate faster than larger ones.
- Six procedural interior variants and three tooth profiles keep the machine visually varied.
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

No backend, database, user account, analytics service, API key, or external asset host is required. Sound is synthesized locally with the Web Audio API and is off by default.

## Maintenance

Palette values live in `PALETTES` near the top of `gear-engine.js`. Growth speed and rotation multipliers live in `SPEEDS`. The generation limit is set in `GearEngine.frame()`.

Because all state is ephemeral, backup and restore consist of cloning the GitHub repository. There is no user data to export.
