// Animation constants
const PARTICLE_COUNT = 16; // Balanced: visible but not distracting
export const SCROLL_VELOCITY_DECAY = 0.95; // Slower decay for smoother feel
export const PARTICLE_VELOCITY_DECAY = 0.92; // Slower decay
export const MIN_INERTIA_FACTOR = 0.15; // Reduced inertia response
export const MAX_INERTIA_FACTOR = 0.35;
export const MIN_SCROLL_FACTOR = 0.01; // Reduced scroll parallax
export const MAX_SCROLL_FACTOR = 0.04;
export const INERTIA_MULTIPLIER = 0.05; // Reduced multiplier

// Particle size and movement ranges
const MIN_PARTICLE_SIZE = 2;
export const MAX_PARTICLE_SIZE = 5;
const MIN_OPACITY = 0.2;
const MAX_OPACITY = 0.45;
const MIN_SPEED_X = 0.002;
const MAX_SPEED_X = 0.006;
const MIN_SPEED_Y = 0.0015;
const MAX_SPEED_Y = 0.005;
const MIN_RADIUS_X = 20;
const MAX_RADIUS_X = 60;
const MIN_RADIUS_Y = 15;
const MAX_RADIUS_Y = 45;

// Types
interface ParticleColor {
  light: string;
  dark: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  color: ParticleColor;
  // Independent animation parameters
  angleX: number; // Current angle in X oscillation
  angleY: number; // Current angle in Y oscillation
  speedX: number; // How fast X oscillation changes
  speedY: number; // How fast Y oscillation changes
  radiusX: number; // How far X oscillates
  radiusY: number; // How far Y oscillates
  // Scroll inertia
  velocityY: number; // Current velocity from scrolling
}

/**
 * Particle Color Palettes
 *
 * DESIGN SYSTEM NOTE: These colors are intentionally separate from the main
 * design system tokens. Particles are decorative, low-opacity background
 * elements that benefit from a wider color range for visual interest.
 *
 * The light mode palette extends the "Slate Executive" theme with complementary
 * blues, teals, and purples that harmonize with the cool mist background.
 *
 * Dark mode colors are prepared for future theme support but currently unused.
 */
const LIGHT_MODE_COLORS = [
  // Blues (core palette)
  '#3a4555', // Deep slate
  '#4b5673', // Slate blue
  '#5a6b8a', // Medium blue
  '#6b7ba8', // Brighter blue
  '#5d7399', // Sky blue
  // Teals (subtle variation)
  '#3d5a6b', // Deep teal
  '#4a6d7a', // Muted teal
  '#5a8090', // Light teal-gray
  // Purples (accent variation)
  '#5a4b73', // Dusty purple
  '#6b5a8a', // Muted violet
  '#7a6a99', // Soft purple
  // Warm grays (neutral anchors)
  '#6b7588', // Blue-gray
  '#7a8090', // Light gray-blue
  '#8490a8', // Pale blue
];

const DARK_MODE_COLORS = [
  // Oranges (core accent)
  '#ff8f00', // Deep orange
  '#ffa726', // Orange
  '#ffb34d', // Light orange
  '#ff9d0f', // Amber
  '#ffcc80', // Pale orange
  // Warm pinks/corals (accent variation)
  '#ff7b6b', // Coral
  '#ff9a8a', // Light coral
  '#e8a090', // Muted rose
  // Golds/yellows (warm variation)
  '#ffc107', // Gold
  '#ffe082', // Pale gold
  // Cool whites/grays (neutral anchors)
  '#c5c9d1', // Cool white
  '#cad0db', // Bright white
  '#a0a8b5', // Medium gray
  '#d5d9e0', // Very light gray
];

// Get a random color pair from both palettes
function getRandomColor(): ParticleColor {
  const lightIndex = Math.floor(Math.random() * LIGHT_MODE_COLORS.length);
  const darkIndex = Math.floor(Math.random() * DARK_MODE_COLORS.length);

  return {
    light: LIGHT_MODE_COLORS[lightIndex],
    dark: DARK_MODE_COLORS[darkIndex],
  };
}

// Create a single particle with given dimensions
function createParticle(
  id: number,
  viewportWidth: number,
  viewportHeight: number,
  cols: number,
  rows: number,
): Particle {
  const col = id % cols;
  const row = Math.floor(id / cols);
  const cellWidth = viewportWidth / cols;
  const cellHeight = viewportHeight / rows;

  // Random position within cell for even distribution
  const x = col * cellWidth + Math.random() * cellWidth;
  const y = row * cellHeight + Math.random() * cellHeight;

  // Size determines movement characteristics
  const sizeRange = MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE;
  const size = MIN_PARTICLE_SIZE + Math.random() * sizeRange;

  // Smaller particles are more transparent, larger ones more opaque
  const sizeNormalized = size / MAX_PARTICLE_SIZE;
  const opacityRange = MAX_OPACITY - MIN_OPACITY;
  const opacity = MIN_OPACITY + sizeNormalized * opacityRange;

  return {
    id,
    x,
    y,
    baseX: x,
    baseY: y,
    size,
    opacity,
    color: getRandomColor(),
    angleX: Math.random() * Math.PI * 2,
    angleY: Math.random() * Math.PI * 2,
    speedX: MIN_SPEED_X + Math.random() * (MAX_SPEED_X - MIN_SPEED_X),
    speedY: MIN_SPEED_Y + Math.random() * (MAX_SPEED_Y - MIN_SPEED_Y),
    radiusX: MIN_RADIUS_X + Math.random() * (MAX_RADIUS_X - MIN_RADIUS_X),
    radiusY: MIN_RADIUS_Y + Math.random() * (MAX_RADIUS_Y - MIN_RADIUS_Y),
    velocityY: 0,
  };
}

// Initialize particles function
export function initializeParticles(
  viewportWidth: number = typeof window !== 'undefined' ? window.innerWidth : 0,
  viewportHeight: number = typeof window !== 'undefined' ? window.innerHeight : 0,
): Particle[] {
  // Check if window is available (SSR safety)
  if (viewportWidth === 0 || viewportHeight === 0) {
    return [];
  }

  const cols = Math.ceil(Math.sqrt(PARTICLE_COUNT * (viewportWidth / viewportHeight)));
  const rows = Math.ceil(PARTICLE_COUNT / cols);

  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle(i, viewportWidth, viewportHeight, cols, rows));
  }

  return particles;
}
