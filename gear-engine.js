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

function randomBetween(min, max) { return min + Math.random() * (max - min); }
function choose(items) { return items[Math.floor(Math.random() * items.length)]; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function fraction(value) { return ((value % 1) + 1) % 1; }

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
    this.sequence = 0;
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
    const fineChance = variety === "wild" ? 0.34 : 0.18;
    const chunkyChance = variety === "simple" ? 0.12 : 0.24;
    const roll = Math.random();
    let toothPitch = randomBetween(5, 7.3);
    let toothStyle = 0;
    if (roll < fineChance) { toothPitch = randomBetween(3.1, 4.2); toothStyle = 1; }
    else if (roll < fineChance + chunkyChance) { toothPitch = randomBetween(7.4, 9.5); toothStyle = 2; }
    else toothStyle = Math.floor(Math.random() * (variety === "wild" ? 4 : 3));
    return {
      variant: Math.floor(Math.random() * maxVariant),
      teeth: clamp(Math.round(radius / toothPitch), 7, variety === "wild" ? 42 : 34),
      toothStyle,
      spokeCount: Math.floor(randomBetween(3, variety === "wild" ? 8 : 7)),
      holeCount: Math.floor(randomBetween(5, variety === "wild" ? 11 : 9)),
      hubRatio: randomBetween(variety === "wild" ? 0.1 : 0.14, variety === "simple" ? 0.27 : 0.34),
      ringRatio: randomBetween(variety === "wild" ? 0.34 : 0.39, variety === "wild" ? 0.61 : 0.5),
      spokeWidth: randomBetween(0.07, variety === "wild" ? 0.16 : 0.13),
      holeScale: randomBetween(0.075, variety === "wild" ? 0.145 : 0.115)
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
      angle: randomBetween(0, TAU), angularVelocity: 0, direction: 1, depth: 0,
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

  nextRadius(parent, strategy) {
    const minDimension = Math.min(this.width, this.height);
    const mobile = this.width < 640;
    const variety = this.settings.variety;
    const min = Math.max(mobile ? (this.mode === "game" ? 19 : 17) : 14, minDimension * 0.021);
    const max = Math.min(mobile ? 72 : 122, minDimension * (mobile ? 0.135 : 0.17));
    const roll = Math.random();
    const anchorChance = variety === "wild" ? 0.11 : 0.065;
    const pinionChance = variety === "wild" ? 0.3 : 0.22;
    let radius;
    if (strategy === "fill" || roll < pinionChance) radius = randomBetween(min, min * (variety === "wild" ? 1.45 : 1.7));
    else if (roll < pinionChance + anchorChance) radius = randomBetween(max * 0.82, max * (this.mode === "game" ? 1.12 : 1.4));
    else radius = randomBetween(min * 1.65, max * 0.72);
    if (parent && radius / parent.radius > 0.75 && radius / parent.radius < 1.25 && Math.random() < 0.65) radius *= Math.random() > 0.5 ? 0.62 : 1.38;
    return clamp(radius, min, max * (this.mode === "game" ? 1.12 : 1.4));
  }

  chooseStrategy() {
    const roll = Math.random();
    if (this.settings.density === "dense" && roll < 0.42) return "fill";
    if (this.settings.density === "sparse" && roll < 0.56) return "extend";
    if (roll < 0.24) return "fill";
    if (roll < 0.62) return "extend";
    if (roll < 0.84) return "branch";
    return "bridge";
  }

  chooseParent(strategy) {
    const withCounts = this.gears.map((gear) => ({
      gear,
      children: this.gears.reduce((count, item) => count + (item.parentId === gear.id ? 1 : 0), 0),
      centerDistance: Math.hypot(gear.x - this.width / 2, gear.y - this.height / 2)
    }));
    let pool = withCounts;
    if (strategy === "extend") pool = [...withCounts].sort((a, b) => b.centerDistance - a.centerDistance).slice(0, Math.max(4, Math.ceil(withCounts.length * 0.35)));
    if (strategy === "branch") pool = withCounts.filter((item) => item.children < 2);
    if (strategy === "fill" || strategy === "bridge") pool = withCounts.filter((item) => item.children < 4);
    if (!pool.length) pool = withCounts;
    return choose(pool).gear;
  }

  preferredAngle(parent, strategy) {
    const direction = this.settings.direction;
    const centerAngle = Math.atan2(parent.y - this.height / 2, parent.x - this.width / 2);
    if (direction === "upward") return -Math.PI / 2 + randomBetween(-0.7, 0.7);
    if (direction === "downward") return Math.PI / 2 + randomBetween(-0.7, 0.7);
    if (direction === "sideways") return (Math.random() > 0.5 ? 0 : Math.PI) + randomBetween(-0.52, 0.52);
    if (direction === "center") return centerAngle + randomBetween(-0.58, 0.58);
    if (strategy === "extend") return centerAngle + randomBetween(-0.82, 0.82);
    return randomBetween(0, TAU);
  }

  candidateScore(candidate, strategy) {
    const { x, y, radius, parent } = candidate;
    let nearestGap = Infinity;
    let nearConnections = 0;
    for (const other of this.gears) {
      if (other === parent) continue;
      const distance = Math.hypot(x - other.x, y - other.y);
      const sum = radius + other.radius;
      const ratio = distance / sum;
      const minimum = this.mode === "game" ? 0.91 : (this.settings.density === "dense" ? 0.82 : 0.88);
      if (ratio < minimum) return -Infinity;
      nearestGap = Math.min(nearestGap, Math.abs(distance - sum));
      if (ratio > 0.9 && ratio < 1.08) nearConnections += 1;
    }
    if (this.mode === "game") {
      const bottomReserve = this.width < 640 ? 126 : 142;
      if (y + radius > this.height - bottomReserve) return -Infinity;
      if (x + radius * 0.72 < 0 || x - radius * 0.72 > this.width || y + radius * 0.72 < 58) return -Infinity;
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
    let score = Math.random() * 0.8 - occupancy * (this.settings.density === "sparse" ? 0.8 : 0.34);
    if (strategy === "fill") score += nearConnections * 2.1 - openSpace;
    if (strategy === "bridge") score += nearConnections * 2.7;
    if (strategy === "extend") score += Math.hypot(x - this.width / 2, y - this.height / 2) / Math.max(this.width, this.height);
    if (strategy === "branch") score += occupancy === 0 ? 1.2 : 0;
    return score;
  }

  addGear() {
    if (!this.gears.length) return this.addFirstGear();
    const strategy = this.chooseStrategy();
    let best = null;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const parent = this.chooseParent(strategy);
      const radius = this.nextRadius(parent, strategy);
      const angle = this.preferredAngle(parent, strategy);
      const distance = parent.radius + radius - Math.min(parent.radius, radius) * 0.065;
      const x = parent.x + Math.cos(angle) * distance;
      const y = parent.y + Math.sin(angle) * distance;
      const score = this.candidateScore({ x, y, radius, parent }, strategy);
      if (!best || score > best.score) best = { x, y, radius, parent, meshAngle: angle, score };
      if (score > (strategy === "bridge" ? 4.4 : 2.6)) break;
    }
    if (!best || !Number.isFinite(best.score)) return null;
    const gear = this.makeGear(best);
    this.gears.push(gear);
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
    const base = this.mode === "opening" ? 1050 : 790;
    const densityFactor = this.settings.density === "sparse" ? 1.62 : this.settings.density === "dense" ? 0.7 : 1;
    let cadence = randomBetween(0.82, 1.22);
    const averageRadius = Math.min(this.width, this.height) * 0.075;
    if (gear && gear.radius > averageRadius * 1.55) cadence *= 1.52;
    if (gear && gear.radius < averageRadius * 0.58 && Math.random() < 0.34) cadence *= 0.32;
    this.nextGrowthAt = now + (immediate ? 80 : base * SPEEDS[this.settings.speed].growth * densityFactor * cadence);
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
      this.camera.targetScale = clamp(Math.min((this.width * 0.88) / Math.max(1, maxX - minX), (this.height * 0.82) / Math.max(1, maxY - minY)), 0.43, 1);
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
    const speedFactor = SPEEDS[this.settings.speed].rotation * (this.reducedMotion ? 0.16 : 1);
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
    ctx.shadowColor = this.darkMode ? "rgba(0,0,0,.32)" : "rgba(76,62,38,.18)";
    ctx.shadowBlur = gear.radius * 0.11;
    ctx.shadowOffsetY = gear.radius * 0.05;
    ctx.fillStyle = fill;
    ctx.fill(gear.path);
    ctx.shadowColor = "transparent";
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(gear.interior, "evenodd");
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = this.darkMode ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.44)";
    ctx.lineWidth = Math.max(1, gear.radius * 0.017);
    ctx.stroke(gear.path);
    if (gear.variant === 2 || gear.variant === 6) {
      ctx.strokeStyle = fill;
      ctx.lineWidth = Math.max(3.5, gear.radius * (gear.variant === 6 ? 0.075 : 0.12));
      ctx.beginPath();
      ctx.arc(0, 0, gear.radius * (gear.variant === 6 ? 0.62 : 0.56), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawCountOverlay(ctx, now) {
    const elapsed = now - this.countOverlayStarted;
    const ordered = [...this.gears].sort((a, b) => a.sequence - b.sequence);
    for (let index = 0; index < ordered.length; index += 1) {
      const gear = ordered[index];
      const reveal = this.reducedMotion ? 1 : clamp((elapsed - index * 48) / 280, 0, 1);
      if (reveal <= 0) continue;
      const labelRadius = clamp(gear.radius * 0.24, 9, 16);
      ctx.save();
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
