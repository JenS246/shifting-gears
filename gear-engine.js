const TAU = Math.PI * 2;

export const PALETTES = {
  mixed: ["#d2a52c", "#d9674e", "#315ea8", "#388a83", "#90b99a", "#6e7d43", "#795273", "#c47588", "#9b4938", "#db7d32", "#68a9c2"],
  warm: ["#d2a52c", "#df7940", "#c95342", "#b06b47", "#d89a65", "#9b4938", "#c47566"],
  cool: ["#315ea8", "#388a83", "#68a9c2", "#59758e", "#5b7f72", "#726f9b", "#86aaa8"],
  muted: ["#9c8b56", "#a66a5f", "#647a7e", "#79816c", "#7c6878", "#76909a", "#9a795f"],
  bright: ["#e4ad1f", "#e65e45", "#2d65bd", "#199187", "#d34f7a", "#ef8130", "#70a84e"],
  pastel: ["#ddc77a", "#dfa494", "#91afd0", "#8bc1b4", "#b7c897", "#c3a4bd", "#e4b37f"],
  earthy: ["#a48332", "#aa5844", "#5f7460", "#7b783e", "#76586a", "#a16d3f", "#55716f"]
};

const SPEEDS = {
  "very-slow": { rotation: 0.38, growth: 1.7 },
  slow: { rotation: 0.68, growth: 1.15 },
  medium: { rotation: 1, growth: 0.84 },
  lively: { rotation: 1.32, growth: 0.62 }
};

const GAME_PACES = {
  slow: { growth: 1.34, rotation: 0.72, minimumCadence: 0.76, meshDepth: 0.3 },
  medium: { growth: 0.92, rotation: 0.96, minimumCadence: 0.62, meshDepth: 0.33 },
  fast: { growth: 0.58, rotation: 1.2, minimumCadence: 0.48, meshDepth: 0.38 }
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function randomBetween(min, max) { return min + Math.random() * (max - min); }
function choose(items) { return items[Math.floor(Math.random() * items.length)]; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function fraction(value) { return ((value % 1) + 1) % 1; }
function angleDifference(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: value >> 16, g: (value >> 8) & 255, b: value & 255 };
}

function mixColor(from, to, amount) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const n = clamp(amount, 0, 1);
  return `rgb(${Math.round(a.r + (b.r - a.r) * n)}, ${Math.round(a.g + (b.g - a.g) * n)}, ${Math.round(a.b + (b.b - a.b) * n)})`;
}

function makeGearPath(radius, teeth, toothStyle) {
  const path = new Path2D();
  const rootRatios = [0.82, 0.86, 0.77, 0.84];
  const root = radius * rootRatios[toothStyle];
  const shoulder = radius * (toothStyle === 1 ? 0.92 : 0.89);
  const profiles = [
    [root, root, shoulder, radius, radius, shoulder, root, root],
    [root, shoulder, radius, radius, radius, shoulder, root, root],
    [root, root, shoulder, radius, shoulder, root, root, root],
    [root, shoulder, radius, radius, shoulder, root, root, root]
  ];
  const profile = profiles[toothStyle];
  for (let i = 0; i < teeth * 8; i += 1) {
    const angle = (i / (teeth * 8)) * TAU - Math.PI / 2;
    const currentRadius = profile[i % 8];
    const x = Math.cos(angle) * currentRadius;
    const y = Math.sin(angle) * currentRadius;
    if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
  }
  path.closePath();
  return path;
}

function addSpokeCutouts(path, gear, count, innerRatio, outerRatio, widthRatio) {
  const inner = gear.radius * innerRatio;
  const outer = gear.radius * outerRatio;
  const halfWidth = Math.max(2.5, gear.radius * widthRatio);
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * TAU;
    const perpendicular = angle + Math.PI / 2;
    const px = Math.cos(perpendicular) * halfWidth;
    const py = Math.sin(perpendicular) * halfWidth;
    path.moveTo(Math.cos(angle) * inner + px, Math.sin(angle) * inner + py);
    path.lineTo(Math.cos(angle) * outer + px * 0.48, Math.sin(angle) * outer + py * 0.48);
    path.lineTo(Math.cos(angle) * outer - px * 0.48, Math.sin(angle) * outer - py * 0.48);
    path.lineTo(Math.cos(angle) * inner - px, Math.sin(angle) * inner - py);
    path.closePath();
  }
}

function makeInteriorPath(gear) {
  const { radius, variant, spokeCount, holeCount } = gear;
  const path = new Path2D();
  const hub = gear.hubRatio;
  if (variant === 0) {
    path.arc(0, 0, radius * hub, 0, TAU);
  } else if (variant === 1) {
    path.arc(0, 0, radius * hub, 0, TAU);
    addSpokeCutouts(path, gear, spokeCount, hub + 0.08, 0.7, gear.spokeWidth);
  } else if (variant === 2) {
    path.arc(0, 0, radius * gear.ringRatio, 0, TAU);
  } else if (variant === 3) {
    path.arc(0, 0, radius * hub, 0, TAU);
    for (let i = 0; i < holeCount; i += 1) {
      const angle = (i / holeCount) * TAU;
      const distance = radius * 0.49;
      const holeRadius = radius * gear.holeScale;
      path.moveTo(Math.cos(angle) * distance + holeRadius, Math.sin(angle) * distance);
      path.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, holeRadius, 0, TAU);
    }
  } else if (variant === 4) {
    path.arc(0, 0, radius * hub, 0, TAU);
    for (let i = 0; i < spokeCount; i += 1) {
      const angle = (i / spokeCount) * TAU + 0.04;
      const next = angle + TAU / spokeCount * 0.58;
      path.moveTo(Math.cos(angle) * radius * 0.3, Math.sin(angle) * radius * 0.3);
      path.arc(0, 0, radius * 0.69, angle, next);
      path.lineTo(Math.cos(next) * radius * 0.3, Math.sin(next) * radius * 0.3);
      path.closePath();
    }
  } else if (variant === 5) {
    path.arc(0, 0, radius * hub, 0, TAU);
    for (let i = 0; i < spokeCount; i += 1) {
      const angle = (i / spokeCount) * TAU + 0.12;
      const distance = radius * 0.49;
      path.moveTo(Math.cos(angle) * distance + radius * 0.17, Math.sin(angle) * distance);
      path.ellipse(Math.cos(angle) * distance, Math.sin(angle) * distance, radius * 0.17, radius * 0.075, angle, 0, TAU);
    }
  } else if (variant === 6) {
    path.arc(0, 0, radius * 0.5, 0, TAU);
    addSpokeCutouts(path, gear, Math.max(3, spokeCount - 1), 0.55, 0.72, 0.055);
  } else {
    path.arc(0, 0, radius * hub, 0, TAU);
    for (let i = 0; i < holeCount; i += 1) {
      const angle = (i / holeCount) * TAU;
      const distance = radius * (i % 2 ? 0.56 : 0.43);
      const holeRadius = radius * (i % 2 ? 0.07 : 0.11);
      path.moveTo(Math.cos(angle) * distance + holeRadius, Math.sin(angle) * distance);
      path.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, holeRadius, 0, TAU);
    }
  }
  return path;
}

export class GearEngine {
  constructor(canvas, { onGearAdded } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.onGearAdded = onGearAdded;
    this.gears = [];
    this.pathCache = new Map();
    this.width = 0;
    this.height = 0;
    this.lastFrame = 0;
    this.nextGrowthAt = 0;
    this.running = false;
    this.growing = false;
    this.motion = 1;
    this.targetMotion = 1;
    this.stopResponse = 5.1;
    this.mode = "opening";
    this.gamePace = "medium";
    this.compositionPhase = Math.random() * TAU;
    this.sequence = 0;
    this.lastCadenceKind = "normal";
    this.nextSizeIntent = null;
    this.countOverlay = false;
    this.countOverlayStarted = 0;
    this.camera = { x: 0, y: 0, scale: 1, targetX: 0, targetY: 0, targetScale: 1 };
    this.settings = { palette: "mixed", speed: "slow", density: "balanced", direction: "organic", variety: "mixed" };
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.darkMode = matchMedia("(prefers-color-scheme: dark)").matches;
    this.frame = this.frame.bind(this);
    this.resize = this.resize.bind(this);
    new ResizeObserver(this.resize).observe(document.documentElement);
    this.resize();
  }

  resize() {
    const previousWidth = this.width || innerWidth;
    const previousHeight = this.height || innerHeight;
    this.width = innerWidth;
    this.height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    const scaleX = this.width / previousWidth;
    const scaleY = this.height / previousHeight;
    this.gears.forEach((gear) => { gear.x *= scaleX; gear.y *= scaleY; });
    this.camera.x = this.camera.x ? this.camera.x * scaleX : this.width / 2;
    this.camera.y = this.camera.y ? this.camera.y * scaleY : this.height / 2;
    this.camera.targetX = this.camera.x;
    this.camera.targetY = this.camera.y;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    requestAnimationFrame(this.frame);
  }

  setMode(mode) { this.mode = mode; }

  setTheme(theme) {
    this.darkMode = theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  }

  setGamePace(pace) {
    this.gamePace = GAME_PACES[pace] ? pace : "medium";
    if (this.mode === "game") this.scheduleNextGrowth(performance.now(), null, true);
  }

  setSettings(next) {
    const paletteChanged = next.palette && next.palette !== this.settings.palette;
    this.settings = { ...this.settings, ...next };
    if (paletteChanged) this.recolor();
    if (next.speed || next.density) this.scheduleNextGrowth(performance.now(), null, true);
  }

  setCountOverlay(show) {
    this.countOverlay = show;
    this.countOverlayStarted = performance.now();
  }

  reset({ opening = false } = {}) {
    this.gears = [];
    this.pathCache.clear();
    this.sequence = 0;
    this.compositionPhase = Math.random() * TAU;
    this.lastCadenceKind = "normal";
    this.nextSizeIntent = null;
    this.countOverlay = false;
    this.motion = 1;
    this.targetMotion = 1;
    this.stopResponse = 5.1;
    this.growing = !opening;
    this.camera = { x: this.width / 2, y: this.height / 2, scale: 1, targetX: this.width / 2, targetY: this.height / 2, targetScale: 1 };
    if (!opening) {
      const first = this.addFirstGear();
      this.scheduleNextGrowth(performance.now(), first);
    }
  }

  startOpening() {
    this.mode = "opening";
    this.reset({ opening: true });
    window.setTimeout(() => {
      if (this.mode !== "opening") return;
      const first = this.addFirstGear(this.width * (this.width < 640 ? 0.5 : 0.76), this.height * (this.width < 640 ? 0.39 : 0.48), Math.min(this.width, this.height) * 0.15);
      this.growing = true;
      this.scheduleNextGrowth(performance.now(), first, true);
    }, this.reducedMotion ? 50 : 520);
  }

  pause() { this.growing = false; this.targetMotion = 0; this.stopResponse = 3.4; }
  resume() { this.growing = true; this.targetMotion = 1; this.stopResponse = 4.2; this.scheduleNextGrowth(performance.now(), null, true); }
  stopSmoothly() { this.growing = false; this.targetMotion = 0; this.stopResponse = 2.35; }

  addFirstGear(x = this.width * 0.5, y = this.height * 0.43, radius) {
    const mobile = this.width < 640;
    const resolvedRadius = radius || Math.min(this.width, this.height) * (mobile ? 0.145 : 0.112);
    const gear = this.makeGear({ x, y, radius: resolvedRadius, parent: null, meshAngle: 0 });
    gear.angularVelocity = (Math.random() > 0.5 ? 1 : -1) * 0.34 * (48 / gear.radius);
    gear.direction = Math.sign(gear.angularVelocity);
    this.gears.push(gear);
    this.onGearAdded?.(gear, this.gears.length);
    return gear;
  }

  designParameters(radius) {
    const variety = this.settings.variety;
    const maxVariant = variety === "simple" ? 3 : variety === "mixed" ? 6 : 8;
    const fineChance = variety === "wild" ? 0.38 : 0.21;
    const chunkyChance = variety === "simple" ? 0.13 : 0.27;
    const roll = Math.random();
    let toothPitch = randomBetween(5, 7.3);
    let toothStyle = 0;
    if (roll < fineChance) { toothPitch = randomBetween(2.9, 4.15); toothStyle = 1; }
    else if (roll < fineChance + chunkyChance) { toothPitch = randomBetween(7.5, 10.2); toothStyle = 2; }
    else toothStyle = Math.floor(Math.random() * (variety === "wild" ? 4 : 3));
    return {
      variant: Math.floor(Math.random() * maxVariant),
      teeth: clamp(Math.round(radius / toothPitch), 7, variety === "wild" ? 42 : 34),
      toothStyle,
      spokeCount: Math.floor(randomBetween(3, variety === "wild" ? 8 : 7)),
      holeCount: Math.floor(randomBetween(5, variety === "wild" ? 11 : 9)),
      hubRatio: randomBetween(variety === "wild" ? 0.09 : 0.12, variety === "simple" ? 0.28 : 0.37),
      ringRatio: randomBetween(variety === "wild" ? 0.31 : 0.37, variety === "wild" ? 0.64 : 0.53),
      spokeWidth: randomBetween(variety === "wild" ? 0.052 : 0.064, variety === "wild" ? 0.175 : 0.145),
      holeScale: randomBetween(variety === "wild" ? 0.062 : 0.072, variety === "wild" ? 0.158 : 0.126),
      edgeHighlight: randomBetween(0.11, 0.25),
      shadowLift: randomBetween(0.035, 0.075),
      ringStrokeRatio: randomBetween(0.082, 0.138)
    };
  }

  makeGear({ x, y, radius, parent, meshAngle }) {
    const design = this.designParameters(radius);
    const palette = PALETTES[this.settings.palette];
    const color = choose(palette);
    const gear = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      sequence: ++this.sequence,
      x, y, radius, ...design,
      color, fromColor: color, targetColor: color, colorMix: 1,
      angle: randomBetween(0, TAU), angularVelocity: 0, direction: 1,
      depth: parent ? clamp(parent.depth + randomBetween(-0.24, 0.24), -0.8, 0.8) : 0,
      parentId: parent?.id || null, born: performance.now(), entrance: Math.floor(Math.random() * 4),
      path: null, interior: null
    };
    if (parent) {
      const parentPhase = fraction(((meshAngle - parent.angle + Math.PI / 2) / TAU) * parent.teeth);
      const childPhase = fraction(0.5 - parentPhase);
      gear.angle = meshAngle + Math.PI * 1.5 - (childPhase * TAU) / gear.teeth;
      gear.angularVelocity = clamp(-parent.angularVelocity * parent.teeth / gear.teeth, -1.55, 1.55);
      if (Math.abs(gear.angularVelocity) < 0.075) gear.angularVelocity = -Math.sign(parent.angularVelocity || 1) * 0.075;
      gear.direction = Math.sign(gear.angularVelocity);
    }
    const key = `${Math.round(radius)}-${gear.teeth}-${gear.toothStyle}`;
    if (!this.pathCache.has(key)) this.pathCache.set(key, makeGearPath(radius, gear.teeth, gear.toothStyle));
    gear.path = this.pathCache.get(key);
    gear.interior = makeInteriorPath(gear);
    return gear;
  }

  nextRadius(parent, strategy, ignoreIntent = false) {
    const minDimension = Math.min(this.width, this.height);
    const mobile = this.width < 640;
    const variety = this.settings.variety;
    const game = this.mode === "game";
    const min = Math.max(mobile ? (game ? 20 : 14) : (game ? 17 : 12), minDimension * (game ? 0.023 : 0.018));
    const max = Math.min(mobile ? 74 : 128, minDimension * (mobile ? 0.14 : 0.178));
    const roll = Math.random();
    const anchorChance = variety === "wild" ? 0.14 : 0.08;
    const pinionChance = variety === "wild" ? 0.34 : 0.25;
    let radius;
    if (!ignoreIntent && this.nextSizeIntent === "anchor") radius = randomBetween(max * 0.88, max * (game ? 1.06 : 1.48));
    else if ((!ignoreIntent && this.nextSizeIntent === "pinion") || strategy === "fill" || roll < pinionChance) radius = randomBetween(min, min * (variety === "wild" ? 1.42 : 1.68));
    else if (strategy === "bridge") radius = randomBetween(min * 2.1, max * 0.74);
    else if (roll < pinionChance + anchorChance) radius = randomBetween(max * 0.84, max * (game ? 1.06 : 1.48));
    else radius = randomBetween(min * 1.65, max * 0.72);
    if (parent && radius / parent.radius > 0.75 && radius / parent.radius < 1.25 && Math.random() < 0.65) radius *= Math.random() > 0.5 ? 0.62 : 1.38;
    return clamp(radius, min, max * (game ? 1.06 : 1.48));
  }

  chooseStrategy() {
    const roll = Math.random();
    if (this.settings.density === "dense" && roll < 0.42) return "fill";
    if (this.settings.density === "sparse" && roll < 0.56) return "extend";
    if (this.mode === "game") {
      if (roll < 0.36) return "fill";
      if (roll < 0.58) return "extend";
      if (roll < 0.79) return "branch";
      return "bridge";
    }
    if (roll < 0.3) return "fill";
    if (roll < 0.61) return "extend";
    if (roll < 0.82) return "branch";
    return "bridge";
  }

  chooseParent(strategy) {
    const withCounts = this.gears.map((gear) => ({
      gear,
      children: this.gears.reduce((count, item) => count + (item.parentId === gear.id ? 1 : 0), 0),
      centerDistance: Math.hypot(gear.x - this.width / 2, gear.y - this.height / 2)
    }));
    let pool = withCounts;
    if (strategy === "extend" && this.mode === "game") {
      const targetAngle = this.compositionPhase + this.gears.length * GOLDEN_ANGLE;
      pool = [...withCounts].sort((a, b) => {
        const aAngle = Math.atan2(a.gear.y - this.height * 0.45, a.gear.x - this.width / 2);
        const bAngle = Math.atan2(b.gear.y - this.height * 0.45, b.gear.x - this.width / 2);
        const aScore = a.centerDistance - Math.abs(angleDifference(aAngle, targetAngle)) * 70;
        const bScore = b.centerDistance - Math.abs(angleDifference(bAngle, targetAngle)) * 70;
        return bScore - aScore;
      }).slice(0, Math.max(4, Math.ceil(withCounts.length * 0.28)));
    } else if (strategy === "extend") {
      pool = [...withCounts].sort((a, b) => b.centerDistance - a.centerDistance).slice(0, Math.max(4, Math.ceil(withCounts.length * 0.35)));
    }
    if (strategy === "branch") pool = withCounts.filter((item) => item.children < 2);
    if (strategy === "fill" || strategy === "bridge") pool = withCounts.filter((item) => item.children < 4);
    if (!pool.length) pool = withCounts;
    return choose(pool).gear;
  }

  preferredAngle(parent, strategy) {
    const direction = this.settings.direction;
    const centerAngle = Math.atan2(parent.y - this.height / 2, parent.x - this.width / 2);
    if (this.mode === "game") {
      const patternAngle = this.compositionPhase + this.gears.length * GOLDEN_ANGLE;
      const sway = Math.sin(this.gears.length * 0.72) * 0.34;
      if (strategy === "extend") return patternAngle + sway + randomBetween(-0.42, 0.42);
      if (strategy === "branch") return patternAngle + randomBetween(-0.78, 0.78);
      if (strategy === "bridge") return patternAngle + Math.PI / 2 + randomBetween(-0.9, 0.9);
      return Math.random() < 0.68 ? patternAngle + randomBetween(-0.7, 0.7) : randomBetween(0, TAU);
    }
    if (direction === "upward") return -Math.PI / 2 + randomBetween(-0.7, 0.7);
    if (direction === "downward") return Math.PI / 2 + randomBetween(-0.7, 0.7);
    if (direction === "sideways") return (Math.random() > 0.5 ? 0 : Math.PI) + randomBetween(-0.52, 0.52);
    if (direction === "center") return centerAngle + randomBetween(-0.58, 0.58);
    if (strategy === "extend") return centerAngle + randomBetween(-0.82, 0.82);
    return randomBetween(0, TAU);
  }

  candidateScore(candidate, strategy, relaxed = false) {
    const { x, y, radius, parent } = candidate;
    let nearestGap = Infinity;
    let nearConnections = 0;
    let overlapConnections = 0;
    let similarNeighbors = 0;
    for (const other of this.gears) {
      if (other === parent) continue;
      const distance = Math.hypot(x - other.x, y - other.y);
      const sum = radius + other.radius;
      const ratio = distance / sum;
      const baseMinimum = this.mode === "game" ? 0.62 : (this.settings.density === "dense" ? 0.61 : this.settings.density === "sparse" ? 0.74 : 0.66);
      const minimum = relaxed ? baseMinimum - 0.09 : baseMinimum;
      const larger = Math.max(radius, other.radius);
      const smaller = Math.min(radius, other.radius);
      if (distance < larger - smaller * 0.42) return -Infinity;
      if (ratio < minimum) return -Infinity;
      nearestGap = Math.min(nearestGap, Math.abs(distance - sum));
      if (ratio > 0.64 && ratio < 1.09) nearConnections += 1;
      if (ratio < 0.94) overlapConnections += 1;
      if (ratio < 1.08 && Math.min(radius, other.radius) / Math.max(radius, other.radius) > 0.74) similarNeighbors += 1;
    }
    if (this.mode === "game") {
      const bottomReserve = this.width < 640 ? 94 : 88;
      if (y + radius > this.height - bottomReserve) return -Infinity;
      const edgeVisibility = relaxed ? 0.28 : 0.18;
      if (x + radius * edgeVisibility < 0 || x - radius * edgeVisibility > this.width || y + radius * edgeVisibility < 50) return -Infinity;
    } else {
      const worldPaddingX = this.width * 0.72;
      const worldPaddingY = this.height * 0.62;
      if (x < -worldPaddingX || x > this.width + worldPaddingX || y < -worldPaddingY || y > this.height + worldPaddingY) return -Infinity;
    }
    const columns = 4;
    const rows = 4;
    const cellX = clamp(Math.floor((x / this.width) * columns), 0, columns - 1);
    const cellY = clamp(Math.floor((y / this.height) * rows), 0, rows - 1);
    const occupancy = this.gears.reduce((count, gear) => {
      const gx = clamp(Math.floor((gear.x / this.width) * columns), 0, columns - 1);
      const gy = clamp(Math.floor((gear.y / this.height) * rows), 0, rows - 1);
      return count + (gx === cellX && gy === cellY ? 1 : 0);
    }, 0);
    const openSpace = Math.min(nearestGap / Math.max(radius, 1), 2.5);
    let score = Math.random() * 0.8 - occupancy * (this.settings.density === "sparse" ? 0.68 : 0.18);
    score += overlapConnections * (this.mode === "game" ? 1.65 : 1.35);
    score -= similarNeighbors * (this.mode === "game" ? 0.72 : 0.94);
    const parentScaleContrast = Math.abs(Math.log(radius / Math.max(parent.radius, 1)));
    score += Math.min(parentScaleContrast, 1.05) * (strategy === "bridge" ? 0.45 : 0.72);
    if (this.mode === "game") {
      const centerX = this.width / 2;
      const centerY = (50 + this.height - (this.width < 640 ? 94 : 88)) / 2;
      const sectors = Array(8).fill(0);
      for (const gear of this.gears) {
        const angle = fraction(Math.atan2(gear.y - centerY, gear.x - centerX) / TAU);
        sectors[Math.floor(angle * sectors.length) % sectors.length] += 1;
      }
      const candidateAngle = Math.atan2(y - centerY, x - centerX);
      const candidateSector = Math.floor(fraction(candidateAngle / TAU) * sectors.length) % sectors.length;
      const mostUsed = Math.max(...sectors);
      score += (mostUsed - sectors[candidateSector]) * 1.35;
      const patternAngle = this.compositionPhase + this.gears.length * GOLDEN_ANGLE;
      score += (1 - Math.abs(angleDifference(candidateAngle, patternAngle)) / Math.PI) * 1.6;
      const centroidX = (this.gears.reduce((sum, gear) => sum + gear.x, 0) + x) / (this.gears.length + 1);
      const centroidY = (this.gears.reduce((sum, gear) => sum + gear.y, 0) + y) / (this.gears.length + 1);
      const drift = Math.hypot((centroidX - centerX) / this.width, (centroidY - centerY) / this.height);
      score -= drift * 12;
    }
    if (strategy === "fill") score += nearConnections * 2.25 - openSpace;
    if (strategy === "bridge") score += nearConnections * 2.9;
    if (strategy === "extend") score += Math.hypot(x - this.width / 2, y - this.height / 2) / Math.max(this.width, this.height);
    if (strategy === "branch") score += occupancy === 0 ? 1.2 : 0;
    return score;
  }

  addGear() {
    if (!this.gears.length) return this.addFirstGear();
    const strategy = this.chooseStrategy();
    let best = null;
    const passes = this.mode === "game"
      ? [{ attempts: 180, relaxed: false, forceSmall: false }, { attempts: 260, relaxed: true, forceSmall: true }]
      : [{ attempts: 150, relaxed: false, forceSmall: false }, { attempts: 180, relaxed: true, forceSmall: true }];
    for (const pass of passes) {
      for (let attempt = 0; attempt < pass.attempts; attempt += 1) {
        const parent = this.chooseParent(pass.forceSmall ? "fill" : strategy);
        let radius = this.nextRadius(parent, pass.forceSmall ? "fill" : strategy, pass.forceSmall);
        if (pass.forceSmall) radius *= randomBetween(0.72, 0.94);
        const angle = this.preferredAngle(parent, pass.forceSmall ? "fill" : strategy);
        const gameMeshDepth = GAME_PACES[this.gamePace].meshDepth;
        const meshDepth = pass.relaxed
          ? (this.mode === "game" ? gameMeshDepth + 0.07 : 0.35)
          : (this.mode === "game" ? gameMeshDepth : 0.3);
        const distance = parent.radius + radius - Math.min(parent.radius, radius) * meshDepth;
        const x = parent.x + Math.cos(angle) * distance;
        const y = parent.y + Math.sin(angle) * distance;
        const score = this.candidateScore({ x, y, radius, parent }, strategy, pass.relaxed);
        if (!best || score > best.score) best = { x, y, radius, parent, meshAngle: angle, score };
        if (score > (strategy === "bridge" ? 5.1 : 3.5)) break;
      }
      if (best && Number.isFinite(best.score)) break;
    }
    if (!best || !Number.isFinite(best.score)) return null;
    const gear = this.makeGear(best);
    this.gears.push(gear);
    this.nextSizeIntent = null;
    this.gears.sort((a, b) => a.depth - b.depth || b.radius - a.radius || a.sequence - b.sequence);
    this.onGearAdded?.(gear, this.gears.length);
    return gear;
  }

  recolor() {
    const palette = PALETTES[this.settings.palette];
    const ordered = [...this.gears].sort((a, b) => a.sequence - b.sequence);
    ordered.forEach((gear, index) => {
      gear.fromColor = gear.colorMix < 1 ? mixColor(gear.fromColor, gear.targetColor, gear.colorMix) : gear.targetColor;
      gear.targetColor = palette[(index * 3 + gear.teeth) % palette.length];
      gear.colorMix = 0;
    });
  }

  scheduleNextGrowth(now, gear, immediate = false) {
    const base = this.mode === "opening" ? 1050 : this.mode === "game" ? 540 : 790;
    const densityFactor = this.settings.density === "sparse" ? 1.62 : this.settings.density === "dense" ? 0.7 : 1;
    const rhythmRoll = Math.random();
    let cadence;
    if (rhythmRoll < 0.17) {
      cadence = randomBetween(1.48, 2.02);
      this.lastCadenceKind = "rest";
      this.nextSizeIntent = Math.random() < 0.58 ? "anchor" : null;
    } else if (rhythmRoll < 0.39 && this.lastCadenceKind !== "quick") {
      cadence = randomBetween(0.38, 0.62);
      this.lastCadenceKind = "quick";
      this.nextSizeIntent = Math.random() < 0.48 ? "pinion" : null;
    } else {
      cadence = randomBetween(0.82, 1.22);
      this.lastCadenceKind = "normal";
      this.nextSizeIntent = null;
    }
    const averageRadius = Math.min(this.width, this.height) * 0.075;
    if (gear && gear.radius > averageRadius * 1.55) cadence *= 1.28;
    if (gear && gear.radius < averageRadius * 0.58 && Math.random() < 0.28) cadence *= 0.62;
    const pace = GAME_PACES[this.gamePace];
    const gameAcceleration = this.mode === "game"
      ? Math.max(pace.minimumCadence, 1 - Math.max(0, this.gears.length - 3) * 0.014)
      : 1;
    const speedFactor = this.mode === "game" ? pace.growth : SPEEDS[this.settings.speed].growth;
    this.nextGrowthAt = now + (immediate ? 80 : base * speedFactor * densityFactor * cadence * gameAcceleration);
  }

  updateCamera(dt) {
    if (this.mode !== "zen" || this.gears.length < 16 || this.reducedMotion) {
      this.camera.targetX = this.width / 2;
      this.camera.targetY = this.height / 2;
      this.camera.targetScale = 1;
    } else {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const gear of this.gears) {
        minX = Math.min(minX, gear.x - gear.radius);
        maxX = Math.max(maxX, gear.x + gear.radius);
        minY = Math.min(minY, gear.y - gear.radius);
        maxY = Math.max(maxY, gear.y + gear.radius);
      }
      this.camera.targetScale = clamp(Math.min((this.width * 0.94) / Math.max(1, maxX - minX), (this.height * 0.88) / Math.max(1, maxY - minY)), 0.43, 1);
      this.camera.targetX = (minX + maxX) / 2;
      this.camera.targetY = (minY + maxY) / 2;
    }
    const cameraEase = 1 - Math.exp(-dt * 0.22);
    this.camera.x += (this.camera.targetX - this.camera.x) * cameraEase;
    this.camera.y += (this.camera.targetY - this.camera.y) * cameraEase;
    this.camera.scale += (this.camera.targetScale - this.camera.scale) * cameraEase;
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    const ease = 1 - Math.exp(-dt * this.stopResponse);
    this.motion += (this.targetMotion - this.motion) * ease;
    if (Math.abs(this.motion - this.targetMotion) < 0.001) this.motion = this.targetMotion;
    const maxGears = this.mode === "opening" ? 18 : this.mode === "zen" ? 180 : 100;
    if (this.growing && this.gears.length < maxGears && now >= this.nextGrowthAt) {
      const gear = this.addGear();
      this.scheduleNextGrowth(now, gear);
    }
    const rotationSpeed = this.mode === "game" ? GAME_PACES[this.gamePace].rotation : SPEEDS[this.settings.speed].rotation;
    const speedFactor = rotationSpeed * (this.reducedMotion ? 0.16 : 1);
    for (const gear of this.gears) {
      gear.angle += gear.angularVelocity * speedFactor * this.motion * dt;
      if (gear.colorMix < 1) gear.colorMix = Math.min(1, gear.colorMix + dt * 0.58);
    }
    this.updateCamera(dt);
    this.draw(now);
    requestAnimationFrame(this.frame);
  }

  applyCamera(ctx) {
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.camera.scale, this.camera.scale);
    ctx.translate(-this.camera.x, -this.camera.y);
  }

  drawGear(ctx, gear, now) {
    const age = now - gear.born;
    const progress = this.reducedMotion ? 1 : clamp(age / 720, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const scale = gear.entrance === 0 ? 0.86 + eased * 0.14 : 1;
    const slide = gear.entrance === 2 ? (1 - eased) * gear.radius * 0.2 : 0;
    const alpha = gear.entrance === 1 ? eased : Math.min(1, progress * 1.7);
    const fill = gear.colorMix < 1 ? mixColor(gear.fromColor, gear.targetColor, gear.colorMix) : gear.targetColor;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(gear.x + slide, gear.y);
    ctx.rotate(gear.angle);
    ctx.scale(scale, scale);
    const depthLift = (gear.depth + 0.8) / 1.6;
    ctx.shadowColor = this.darkMode
      ? `rgba(0,0,0,${0.2 + depthLift * 0.12})`
      : `rgba(76,62,38,${0.105 + depthLift * 0.085})`;
    ctx.shadowBlur = gear.radius * (0.065 + depthLift * 0.055);
    ctx.shadowOffsetY = gear.radius * (gear.shadowLift + depthLift * 0.018);
    ctx.fillStyle = fill;
    ctx.fill(gear.path);
    ctx.shadowColor = "transparent";
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(gear.interior, "evenodd");
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = this.darkMode
      ? `rgba(255,255,255,${gear.edgeHighlight})`
      : `rgba(255,255,255,${0.32 + gear.edgeHighlight})`;
    ctx.lineWidth = Math.max(1, gear.radius * (0.013 + depthLift * 0.007));
    ctx.stroke(gear.path);
    if (gear.variant === 2 || gear.variant === 6) {
      ctx.strokeStyle = fill;
      ctx.lineWidth = Math.max(3.5, gear.radius * (gear.variant === 6 ? gear.ringStrokeRatio * 0.68 : gear.ringStrokeRatio));
      ctx.beginPath();
      ctx.arc(0, 0, gear.radius * (gear.variant === 6 ? 0.62 : 0.56), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawCountOverlay(ctx, now) {
    const elapsed = now - this.countOverlayStarted;
    const ordered = [...this.gears].sort((a, b) => a.sequence - b.sequence);
    const step = clamp(2800 / Math.max(ordered.length, 1), 50, 85);
    const activeIndex = this.reducedMotion ? ordered.length - 1 : Math.floor(elapsed / step);
    for (let index = 0; index < ordered.length; index += 1) {
      const gear = ordered[index];
      const reveal = this.reducedMotion ? 1 : clamp((elapsed - index * step) / 150, 0, 1);
      if (reveal <= 0) continue;
      const labelRadius = clamp(gear.radius * 0.24, 9, 16);
      ctx.save();
      if (!this.reducedMotion && index === activeIndex) {
        const ringProgress = clamp((elapsed - index * step) / 170, 0, 1);
        ctx.globalAlpha = (1 - ringProgress) * 0.52;
        ctx.strokeStyle = this.darkMode ? "rgba(240,237,227,.9)" : "rgba(34,40,35,.82)";
        ctx.lineWidth = 2 / Math.max(this.camera.scale, 0.5);
        ctx.beginPath();
        ctx.arc(gear.x, gear.y, gear.radius + 7 + ringProgress * 8, 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = reveal * 0.96;
      ctx.translate(gear.x, gear.y);
      ctx.scale(0.8 + reveal * 0.2, 0.8 + reveal * 0.2);
      ctx.fillStyle = this.darkMode ? "rgba(240,237,227,.94)" : "rgba(34,40,35,.92)";
      ctx.beginPath();
      ctx.arc(0, 0, labelRadius, 0, TAU);
      ctx.fill();
      ctx.fillStyle = this.darkMode ? "#20231f" : "#f2efe7";
      ctx.font = `800 ${clamp(labelRadius * 0.9, 8, 12)}px Avenir Next, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(gear.sequence), 0, 0.5);
      ctx.restore();
    }
  }

  draw(now) {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.canvas.width / this.width, 0, 0, this.canvas.height / this.height, 0, 0);
    ctx.fillStyle = this.darkMode ? "#20231f" : "#f2efe7";
    ctx.fillRect(0, 0, this.width, this.height);
    this.applyCamera(ctx);
    for (const gear of this.gears) this.drawGear(ctx, gear, now);
    if (this.countOverlay) this.drawCountOverlay(ctx, now);
    ctx.restore();
  }
}
