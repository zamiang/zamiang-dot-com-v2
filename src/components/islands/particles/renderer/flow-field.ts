// Classic 3D Perlin gradient noise with curl derivation.
// Self-contained: no deps. Output is bounded to [-1, 1] (empirically tighter
// than the theoretical bound but we clamp to be safe).

const PERM: number[] = (() => {
  const p = new Array<number>(512);
  const source = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];
  for (let i = 0; i < 256; i++) {
    p[i] = source[i];
    p[i + 256] = source[i];
  }
  return p;
})();

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);
  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;
  return lerp(
    lerp(
      lerp(grad(PERM[AA], xf, yf, zf), grad(PERM[BA], xf - 1, yf, zf), u),
      lerp(grad(PERM[AB], xf, yf - 1, zf), grad(PERM[BB], xf - 1, yf - 1, zf), u),
      v,
    ),
    lerp(
      lerp(grad(PERM[AA + 1], xf, yf, zf - 1), grad(PERM[BA + 1], xf - 1, yf, zf - 1), u),
      lerp(grad(PERM[AB + 1], xf, yf - 1, zf - 1), grad(PERM[BB + 1], xf - 1, yf - 1, zf - 1), u),
      v,
    ),
    w,
  );
}

// Curl of a 2D vector field derived from two perlin samples.
// Returns [dx, dy] in approximately [-1, 1] after clamping.
const EPS = 0.01;
export function sampleCurl(x: number, y: number, z: number): [number, number] {
  const n1 = perlin(x, y + EPS, z);
  const n2 = perlin(x, y - EPS, z);
  const n3 = perlin(x + EPS, y, z);
  const n4 = perlin(x - EPS, y, z);
  const dx = (n1 - n2) / (2 * EPS);
  const dy = -(n3 - n4) / (2 * EPS);
  // Empirical magnitude is small; scale and clamp to [-1, 1].
  const scale = 0.5;
  return [
    Math.max(-1, Math.min(1, dx * scale)),
    Math.max(-1, Math.min(1, dy * scale)),
  ];
}

// Generates a grid×grid RG texture (Uint8Array of length grid*grid*2).
// Each cell encodes a curl vector with x in byte 0 and y in byte 1, mapping
// signed [-1, 1] to unsigned [0, 255] (vector = byte/127.5 - 1 in the shader).
export function generateFlowFieldTexture(grid: number, time: number): Uint8Array {
  const data = new Uint8Array(grid * grid * 2);
  const noiseScale = 1.5; // controls spatial frequency
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const nx = (x / grid) * noiseScale;
      const ny = (y / grid) * noiseScale;
      const [vx, vy] = sampleCurl(nx, ny, time * 0.1);
      const idx = (y * grid + x) * 2;
      data[idx] = Math.round((vx + 1) * 127.5);
      data[idx + 1] = Math.round((vy + 1) * 127.5);
    }
  }
  return data;
}
