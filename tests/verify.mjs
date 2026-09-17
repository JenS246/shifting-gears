import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const engine = await readFile(new URL("../gear-engine.js", import.meta.url), "utf8");

const requiredIds = ["gear-canvas", "game-start", "zen-start", "stop-button", "guess-form", "pause-button", "customize-drawer", "reset-button"];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing required UI element: ${id}`);
}

if (!css.includes("prefers-reduced-motion")) throw new Error("Reduced motion support is missing");
if (!css.includes("prefers-color-scheme: dark")) throw new Error("Dark mode support is missing");
if (!engine.includes("requestAnimationFrame")) throw new Error("Animation loop is missing");
if (!engine.includes("parentId")) throw new Error("Gear connection model is missing");
if (!app.includes("engine.gears.length")) throw new Error("Deterministic gear count is missing");
if (!html.includes('id="count-button"')) throw new Error("Visual count verification control is missing");
if (!css.includes(".game-dock")) throw new Error("Compact game dock is missing");
if (css.includes(".game-panel")) throw new Error("Obstructive full-screen game panel remains");
if (!engine.includes("parent.angularVelocity * parent.teeth / gear.teeth")) throw new Error("Parent-derived gear ratio is missing");
if (!engine.includes("drawCountOverlay")) throw new Error("Numbered gear overlay is missing");
if (!engine.includes('this.mode === "zen" ? 180')) throw new Error("Extended Zen growth limit is missing");
if (!engine.includes("updateCamera(dt)")) throw new Error("Zen camera reframing is missing");
if (!engine.includes("bottomReserve")) throw new Error("Game control clearance is missing");
if (!engine.includes("overlapConnections")) throw new Error("Controlled gear overlap scoring is missing");
if (!engine.includes("relaxed: true")) throw new Error("Crowded-field placement fallback is missing");
if (!engine.includes('this.mode === "game" ? 650')) throw new Error("Game challenge cadence is missing");
if (html.includes("—") || html.includes("–")) throw new Error("Disallowed dash character found in visible copy");

console.log("Static verification passed.");
