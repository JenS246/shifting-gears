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
  "very-slow": { rotation: 0.42, growth: 1.65 },
  slow: { rotation: 0.72, growth: 1.15 },
  medium: { rotation: 1.05, growth: 0.88 },
  lively: { rotation: 1.42, growth: 0.67 }
};

function randomBetween(min, max) { return min + Math.random() * (max - min); }
function choose(items) { return items[Math.floor(Math.random() * items.length)]; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

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
  const root = radius * (toothStyle === 2 ? 0.79 : 0.82);
  const shoulder = radius * (toothStyle === 1 ? 0.89 : 0.91);
  const pointsPerTooth = 8;
  for (let i = 0; i < teeth * pointsPerTooth; i += 1) {
    const phase = i % pointsPerTooth;
    let currentRadius = root;
    if (toothStyle === 0) currentRadius = [root, root, shoulder, radius, radius, shoulder, root, root][phase];
    if (toothStyle === 1) currentRadius = [root, shoulder, radius, radius, radius, shoulder, root, root][phase];
    if (toothStyle === 2) currentRadius = [root, root, shoulder, radius, shoulder, root, root, root][phase];
    const angle = (i / (teeth * pointsPerTooth)) * TAU - Math.PI / 2;
    const x = Math.cos(angle) * currentRadius;
    const y = Math.sin(angle) * currentRadius;
    if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
  }
  path.closePath();
  return path;
}

function makeInteriorPath(gear) {
  const { radius, variant, spokeCount, holeCount } = gear;
  const path = new Path2D();
  if (variant === 0) {
    path.arc(0, 0, radius * 0.25, 0, TAU);
  } else if (variant === 1) {
    path.arc(0, 0, radius * 0.19, 0, TAU);
    const inner = radius * 0.31;
    const outer = radius * 0.69;
    const width = Math.max(3, radius * 0.13);
    for (let i = 0; i < spokeCount; i += 1) {
      const angle = (i / spokeCount) * TAU;
      const px = Math.cos(angle + Math.PI / 2) * width;
      const py = Math.sin(angle + Math.PI / 2) * width;
      path.moveTo(Math.cos(angle) * inner + px, Math.sin(angle) * inner + py);
      path.lineTo(Math.cos(angle) * outer + px * 0.48, Math.sin(angle) * outer + py * 0.48);
      path.lineTo(Math.cos(angle) * outer - px * 0.48, Math.sin(angle) * outer - py * 0.48);
      path.lineTo(Math.cos(angle) * inner - px, Math.sin(angle) * inner - py);
      path.closePath();
    }
  } else if (variant === 2) {
    path.arc(0, 0, radius * 0.42, 0, TAU);
  } else if (variant === 3) {
    path.arc(0, 0, radius * 0.15, 0, TAU);
    for (let i = 0; i < holeCount; i += 1) {
      const angle = (i / holeCount) * TAU;
      const distance = radius * 0.47;
      path.moveTo(Math.cos(angle) * distance + radius * 0.115, Math.sin(angle) * distance);
      path.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, radius * 0.115, 0, TAU);
    }
  } else if (variant === 4) {
    path.arc(0, 0, radius * 0.2, 0, TAU);
    for (let i = 0; i < spokeCount; i += 1) {
      const angle = (i / spokeCount) * TAU;
      const next = angle + TAU / spokeCount * 0.54;
      path.moveTo(Math.cos(angle) * radius * 0.3, Math.sin(angle) * radius * 0.3);
      path.arc(0, 0, radius * 0.66, angle, next);
      path.lineTo(Math.cos(next) * radius * 0.3, Math.sin(next) * radius * 0.3);
      path.closePath();
    }
  } else {
    path.arc(0, 0, radius * 0.13, 0, TAU);
    const count = Math.max(3, spokeCount - 1);
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * TAU + 0.18;
      const distance = radius * 0.47;
      path.moveTo(Math.cos(angle) * distance + radius * 0.16, Math.sin(angle) * distance);
      path.ellipse(Math.cos(angle) * distance, Math.sin(angle) * distance, radius * 0.16, radius * 0.09, angle, 0, TAU);
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
    this.lastGrowth = 0;
    this.running = false;
    this.growing = false;
    this.motion = 1;
    this.targetMotion = 1;
    this.mode = "opening";
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
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scaleX = this.width / previousWidth;
    const scaleY = this.height / previousHeight;
    this.gears.forEach((gear) => { gear.x *= scaleX; gear.y *= scaleY; });
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
  }

  reset({ opening = false } = {}) {
    this.gears = [];
    this.pathCache.clear();
    this.motion = 1;
    this.targetMotion = 1;
    this.growing = !opening;
    this.lastGrowth = performance.now();
    if (!opening) this.addFirstGear();
  }

  startOpening() {
    this.mode = "opening";
    this.reset({ opening: true });
    window.setTimeout(() => {
      if (this.mode !== "opening") return;
      this.addFirstGear(this.width * 0.76, this.height * 0.48, Math.min(this.width, this.height) * 0.15);
      this.growing = true;
    }, this.reducedMotion ? 50 : 700);
  }

  pause() { this.growing = false; this.targetMotion = 0; }
  resume() { this.growing = true; this.targetMotion = 1; this.lastGrowth = performance.now(); }
  stopSmoothly() { this.growing = false; this.targetMotion = 0; }

  addFirstGear(x = this.width * 0.5, y = this.height * 0.46, radius) {
    const mobile = this.width < 640;
    const resolvedRadius = radius || Math.min(this.width, this.height) * (mobile ? 0.16 : 0.115);
    const gear = this.makeGear({ x, y, radius: resolvedRadius, parent: null, direction: Math.random() > 0.5 ? 1 : -1 });
    this.gears.push(gear);
    this.onGearAdded?.(gear, this.gears.length);
  }

  makeGear({ x, y, radius, parent, direction }) {
    const variety = this.settings.variety;
    const maxVariant = variety === "simple" ? 2 : variety === "mixed" ? 4 : 6;
    const variant = Math.floor(Math.random() * maxVariant);
    const teeth = clamp(Math.round(radius / randomBetween(4.2, 6.8)), 8, 28);
    const palette = PALETTES[this.settings.palette];
    const color = choose(palette);
    const speed = (0.33 / Math.sqrt(Math.max(radius, 12) / 25)) * direction * randomBetween(0.84, 1.12);
    const gear = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      x, y, radius, teeth, variant,
      toothStyle: variety === "simple" ? 0 : Math.floor(Math.random() * 3),
      spokeCount: Math.floor(randomBetween(4, variety === "wild" ? 9 : 7)),
      holeCount: Math.floor(randomBetween(5, 9)),
      color, fromColor: color, targetColor: color, colorMix: 1,
      angle: randomBetween(0, TAU),
      speed,
      direction,
      depth: parent ? clamp(parent.depth + choose([-1, 0, 1]), -2, 3) : 0,
      parentId: parent?.id || null,
      born: performance.now(),
      entrance: Math.floor(Math.random() * 4),
      path: null,
      interior: null
    };
    const key = `${Math.round(radius)}-${teeth}-${gear.toothStyle}`;
    if (!this.pathCache.has(key)) this.pathCache.set(key, makeGearPath(radius, teeth, gear.toothStyle));
    gear.path = this.pathCache.get(key);
    gear.interior = makeInteriorPath(gear);
    return gear;
  }

  nextRadius() {
    const minDimension = Math.min(this.width, this.height);
    const mobile = this.width < 640;
    const min = Math.max(mobile ? 18 : 16, minDimension * 0.024);
    const max = Math.min(mobile ? 64 : 104, minDimension * (mobile ? 0.12 : 0.15));
    const roll = Math.random();
    if (roll < 0.12) return randomBetween(max * 0.8, max * 1.35);
    if (roll < 0.34) return randomBetween(min, min * 1.55);
    return randomBetween(min * 1.45, max * 0.78);
  }

  directionBias() {
    const direction = this.settings.direction;
    if (direction === "upward") return -Math.PI / 2;
    if (direction === "downward") return Math.PI / 2;
    if (direction === "sideways") return Math.random() > 0.5 ? 0 : Math.PI;
    if (direction === "center") return Math.random() * TAU;
    return null;
  }

  addGear() {
    if (!this.gears.length) return this.addFirstGear();
    const density = this.settings.density;
    const overlap = density === "dense" ? 0.17 : density === "sparse" ? -0.05 : 0.07;
    const boundsPadding = density === "sparse" ? 0.28 : 0.42;
    let best = null;

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const recentStart = Math.max(0, this.gears.length - 18);
      const useRecent = Math.random() < 0.72;
      const pool = useRecent ? this.gears.slice(recentStart) : this.gears;
      const parent = choose(pool);
      const radius = this.nextRadius();
      const bias = this.directionBias();
      const angle = bias === null ? randomBetween(0, TAU) : bias + randomBetween(-1.05, 1.05);
      const distance = parent.radius + radius - Math.min(parent.radius, radius) * overlap;
      const x = parent.x + Math.cos(angle) * distance;
      const y = parent.y + Math.sin(angle) * distance;
      const inside = x > -radius * boundsPadding && x < this.width + radius * boundsPadding && y > -radius * boundsPadding && y < this.height + radius * boundsPadding;
      if (!inside) continue;

      let collision = 0;
      let nearConnections = 0;
      for (const other of this.gears) {
        if (other === parent) continue;
        const dist = Math.hypot(x - other.x, y - other.y);
        const sum = radius + other.radius;
        if (dist < sum * (density === "dense" ? 0.72 : 0.82)) collision += 1;
        if (Math.abs(dist - sum) < Math.min(radius, other.radius) * 0.35) nearConnections += 1;
      }
      if (collision > (density === "dense" ? 1 : 0)) continue;

      const edgeDistance = Math.min(x, this.width - x, y, this.height - y);
      const underusedBonus = edgeDistance > 60 ? 1 : 0;
      const score = nearConnections * 2 + underusedBonus + Math.random();
      if (!best || score > best.score) best = { x, y, radius, parent, score };
      if (score > 3.2) break;
    }

    if (!best) return;
    const gear = this.makeGear({ ...best, direction: best.parent.direction * -1 });
    this.gears.push(gear);
    this.gears.sort((a, b) => a.depth - b.depth || a.radius - b.radius);
    this.onGearAdded?.(gear, this.gears.length);
  }

  recolor() {
    const palette = PALETTES[this.settings.palette];
    this.gears.forEach((gear, index) => {
      gear.fromColor = gear.colorMix < 1 ? mixColor(gear.fromColor, gear.targetColor, gear.colorMix) : gear.targetColor;
      gear.targetColor = palette[index % palette.length];
      gear.colorMix = 0;
    });
  }

  growthDelay() {
    const base = this.mode === "opening" ? 1250 : 800;
    const densityFactor = this.settings.density === "sparse" ? 1.3 : this.settings.density === "dense" ? 0.77 : 1;
    return base * SPEEDS[this.settings.speed].growth * densityFactor * randomBetween(0.75, 1.25);
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    const ease = 1 - Math.pow(0.002, dt);
    this.motion += (this.targetMotion - this.motion) * ease;
    if (Math.abs(this.motion - this.targetMotion) < 0.002) this.motion = this.targetMotion;

    const maxGears = this.mode === "opening" ? 16 : 86;
    if (this.growing && this.gears.length < maxGears && now - this.lastGrowth > this.growthDelay()) {
      this.addGear();
      this.lastGrowth = now;
    }

    const speedFactor = SPEEDS[this.settings.speed].rotation * (this.reducedMotion ? 0.18 : 1);
    this.gears.forEach((gear) => {
      gear.angle += gear.speed * speedFactor * this.motion * dt;
      if (gear.colorMix < 1) gear.colorMix = Math.min(1, gear.colorMix + dt * 0.6);
    });
    this.draw(now);
    requestAnimationFrame(this.frame);
  }

  draw(now) {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.canvas.width / this.width, 0, 0, this.canvas.height / this.height, 0, 0);
    ctx.fillStyle = this.darkMode ? "#20231f" : "#f2efe7";
    ctx.fillRect(0, 0, this.width, this.height);

    for (const gear of this.gears) {
      const age = now - gear.born;
      const progress = this.reducedMotion ? 1 : clamp(age / 700, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const scale = gear.entrance === 0 ? 0.85 + eased * 0.15 : 1;
      const slide = gear.entrance === 2 ? (1 - eased) * gear.radius * 0.22 : 0;
      const alpha = gear.entrance === 1 ? eased : Math.min(1, progress * 1.7);
      const fill = gear.colorMix < 1 ? mixColor(gear.fromColor, gear.targetColor, gear.colorMix) : gear.targetColor;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(gear.x + slide, gear.y);
      ctx.rotate(gear.angle);
      ctx.scale(scale, scale);
      ctx.shadowColor = this.darkMode ? "rgba(0,0,0,.32)" : "rgba(76,62,38,.18)";
      ctx.shadowBlur = gear.radius * 0.12;
      ctx.shadowOffsetY = gear.radius * 0.055;
      ctx.fillStyle = fill;
      ctx.fill(gear.path);
      ctx.shadowColor = "transparent";
      ctx.globalCompositeOperation = "destination-out";
      ctx.fill(gear.interior, "evenodd");
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = this.darkMode ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.42)";
      ctx.lineWidth = Math.max(1, gear.radius * 0.018);
      ctx.stroke(gear.path);
      if (gear.variant === 2 || gear.variant === 4) {
        ctx.strokeStyle = fill;
        ctx.lineWidth = Math.max(4, gear.radius * 0.13);
        ctx.beginPath();
        ctx.arc(0, 0, gear.radius * 0.52, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
