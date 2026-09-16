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
if (html.includes("—") || html.includes("–")) throw new Error("Disallowed dash character found in visible copy");

console.log("Static verification passed.");
