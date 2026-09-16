import { GearEngine } from "./gear-engine.js";

const $ = (selector) => document.querySelector(selector);
const app = $("#app");
const opening = $("#opening");
const modeLabel = $("#mode-label");
const guessPanel = $("#guess-panel");
const resultPanel = $("#result-panel");
const guessInput = $("#guess-input");
const resultTitle = $("#result-title");
const resultDetail = $("#result-detail");
const liveResult = $("#live-result");
const drawer = $("#customize-drawer");
const drawerScrim = $("#drawer-scrim");
const customizeButton = $("#customize-button");
const pauseButton = $("#pause-button");
const soundButton = $("#sound-button");
const canvas = $("#gear-canvas");

const state = {
  mode: "opening",
  paused: false,
  sound: false,
  audioContext: null,
  closest: null,
  exact: 0,
  settings: { palette: "mixed", speed: "slow", density: "balanced", direction: "organic", variety: "mixed" }
};

function playClick(count) {
  if (!state.sound || document.hidden) return;
  if (!state.audioContext) state.audioContext = new AudioContext();
  const context = state.audioContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 190 + (count % 7) * 13;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.012, context.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.085);
}

const engine = new GearEngine(canvas, {
  onGearAdded(_gear, count) {
    playClick(count);
    if (state.mode === "zen") canvas.setAttribute("aria-label", `A growing mechanical composition with ${count} visible gears.`);
  }
});

function setScreen(screen) {
  app.dataset.screen = screen;
  opening.setAttribute("aria-hidden", String(screen !== "opening"));
}

function closePanels() {
  [guessPanel, resultPanel].forEach((panel) => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  });
  closeDrawer();
}

function startMode(mode) {
  state.mode = mode;
  state.paused = false;
  engine.setMode(mode);
  engine.setSettings(state.settings);
  engine.reset();
  closePanels();
  pauseButton.textContent = "Pause";
  liveResult.textContent = "";
  modeLabel.textContent = mode === "game" ? "Game mode" : "Zen mode";
  canvas.setAttribute("aria-label", mode === "game" ? "A growing mechanical composition. The number of gears is hidden until you make a guess." : "A growing mechanical composition with one visible gear.");
  setScreen(mode === "game" ? "game-running" : "zen");
}

function goHome() {
  state.mode = "opening";
  closePanels();
  setScreen("opening");
  modeLabel.textContent = "";
  canvas.setAttribute("aria-label", "A mechanical composition that grows one gear at a time.");
  engine.startOpening();
  $("#game-start").focus();
}

function openGuess() {
  if (state.mode !== "game") return;
  engine.stopSmoothly();
  setScreen("game-guess");
  window.setTimeout(() => {
    guessPanel.classList.add("is-open");
    guessPanel.setAttribute("aria-hidden", "false");
    guessInput.value = "";
    guessInput.focus();
  }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 720);
}

function restrainedResponse(distance, count) {
  if (distance === 0) return { title: "Exactly right.", detail: "You read the machine perfectly." };
  if (distance === 1) return { title: "Off by 1.", detail: "Nearly every gear accounted for." };
  if (distance <= 3) return { title: `Only ${distance} gears away.`, detail: "A remarkably close look." };
  if (count >= 35) return { title: `Off by ${distance}.`, detail: "That machine got complicated fast." };
  return { title: `Off by ${distance}.`, detail: "The overlaps make it trickier than it looks." };
}

function submitGuess(event) {
  event.preventDefault();
  const guess = Number.parseInt(guessInput.value, 10);
  if (!Number.isFinite(guess) || guess < 1) {
    guessInput.setCustomValidity("Enter a number greater than zero.");
    guessInput.reportValidity();
    return;
  }
  guessInput.setCustomValidity("");
  const actual = engine.gears.length;
  const distance = Math.abs(actual - guess);
  if (distance === 0) state.exact += 1;
  state.closest = state.closest === null ? distance : Math.min(state.closest, distance);
  const response = restrainedResponse(distance, actual);
  $("#actual-count").textContent = actual;
  resultTitle.textContent = response.title;
  resultDetail.textContent = response.detail;
  $("#closest-stat").textContent = `±${state.closest}`;
  $("#exact-stat").textContent = state.exact;
  liveResult.textContent = `There were ${actual} gears. Your guess was ${guess}. ${response.title}`;
  guessPanel.classList.remove("is-open");
  guessPanel.setAttribute("aria-hidden", "true");
  resultPanel.classList.add("is-open");
  resultPanel.setAttribute("aria-hidden", "false");
  setScreen("game-result");
  resultTitle.focus();
}

function togglePause() {
  state.paused = !state.paused;
  if (state.paused) engine.pause(); else engine.resume();
  pauseButton.textContent = state.paused ? "Resume" : "Pause";
}

function openDrawer() {
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  drawerScrim.classList.add("is-open");
  drawerScrim.setAttribute("aria-hidden", "false");
  customizeButton.setAttribute("aria-expanded", "true");
  $("#close-drawer").focus();
}

function closeDrawer() {
  const wasOpen = drawer.classList.contains("is-open");
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  drawerScrim.classList.remove("is-open");
  drawerScrim.setAttribute("aria-hidden", "true");
  customizeButton.setAttribute("aria-expanded", "false");
  if (wasOpen && state.mode === "zen") customizeButton.focus();
}

function toggleSound() {
  state.sound = !state.sound;
  soundButton.textContent = state.sound ? "Sound on" : "Sound off";
  soundButton.setAttribute("aria-pressed", String(state.sound));
  if (state.sound) playClick(engine.gears.length);
}

function updateSetting(event) {
  const button = event.target.closest("button[data-value]");
  if (!button) return;
  const group = button.closest("[data-setting]");
  const setting = group.dataset.setting;
  const value = button.dataset.value;
  group.querySelectorAll("button").forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
  state.settings[setting] = value;
  engine.setSettings({ [setting]: value });
}

$("#game-start").addEventListener("click", () => startMode("game"));
$("#zen-start").addEventListener("click", () => startMode("zen"));
$("#home-button").addEventListener("click", goHome);
$("#stop-button").addEventListener("click", openGuess);
$("#guess-form").addEventListener("submit", submitGuess);
$("#again-button").addEventListener("click", () => startMode("game"));
pauseButton.addEventListener("click", togglePause);
$("#reset-button").addEventListener("click", () => { engine.reset(); state.paused = false; pauseButton.textContent = "Pause"; });
customizeButton.addEventListener("click", openDrawer);
$("#close-drawer").addEventListener("click", closeDrawer);
drawerScrim.addEventListener("click", closeDrawer);
soundButton.addEventListener("click", toggleSound);
drawer.addEventListener("click", updateSetting);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.mode === "zen" && !state.paused) engine.targetMotion = 0;
  if (!document.hidden && state.mode === "zen" && !state.paused) engine.targetMotion = 1;
});

engine.start();
engine.startOpening();
