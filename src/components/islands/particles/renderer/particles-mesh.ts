import { Geometry, Mesh, Program, Texture, Transform } from 'ogl';
import type { OGLRenderingContext } from 'ogl';

import vertexShader from './shaders/particles.vert.glsl?raw';
import fragmentShader from './shaders/particles.frag.glsl?raw';
import { DEPTH_BAND_RANGES, DEPTH_BAND_SPLIT, FLOW_FIELD_GRID } from './config';

export interface ParticlesMeshBundle {
  mesh: Mesh;
  scene: Transform;
  uniforms: {
    uTime: { value: number };
    uDPR: { value: number };
    uViewHeight: { value: number };
    uAspect: { value: number };
    uFlowField: { value: Texture };
    uColors: { value: number[] }; // flat array of 18 floats (6 vec3s)
  };
  setColors: (palette: ReadonlyArray<readonly [number, number, number]>) => void;
  setFlowFieldData: (data: Uint8Array) => void;
}

export function createParticlesMesh(
  gl: OGLRenderingContext,
  count: number,
  dpr: number,
  initialPalette: ReadonlyArray<readonly [number, number, number]>,
  initialFlowField: Uint8Array,
): ParticlesMeshBundle {
  // Quad geometry: two triangles in [-0.5, 0.5]
  const quadPos = new Float32Array([
    -0.5, -0.5,
     0.5, -0.5,
    -0.5,  0.5,
     0.5,  0.5,
  ]);
  const quadUv = new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
  ]);
  const quadIdx = new Uint16Array([0, 1, 2, 1, 3, 2]);

  // Per-instance buffers
  const seeds = new Float32Array(count * 4);
  const depths = new Float32Array(count);
  const baseOffsets = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    seeds[i * 4 + 0] = Math.random();
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = Math.random();

    // Assign depth based on band split
    const r = Math.random();
    let depth: number;
    if (r < DEPTH_BAND_SPLIT.far) {
      depth = lerpDepth(DEPTH_BAND_RANGES.far, Math.random());
    } else if (r < DEPTH_BAND_SPLIT.far + DEPTH_BAND_SPLIT.mid) {
      depth = lerpDepth(DEPTH_BAND_RANGES.mid, Math.random());
    } else {
      depth = lerpDepth(DEPTH_BAND_RANGES.near, Math.random());
    }
    depths[i] = depth;

    baseOffsets[i * 2 + 0] = Math.random();
    baseOffsets[i * 2 + 1] = Math.random();
  }

  const geometry = new Geometry(gl, {
    position: { size: 2, data: quadPos },
    uv: { size: 2, data: quadUv },
    index: { data: quadIdx },
    aSeed: { size: 4, data: seeds, instanced: 1 },
    aDepth: { size: 1, data: depths, instanced: 1 },
    aBaseOffset: { size: 2, data: baseOffsets, instanced: 1 },
  });

  // Use WebGL2-specific constants via a narrowed reference. These constants are
  // guaranteed to exist at runtime because createRenderer already verified
  // createVertexArray (WebGL2-only), so we cast here to access them safely.
  const gl2 = gl as WebGL2RenderingContext;

  const flowTexture = new Texture(gl, {
    image: initialFlowField,
    width: FLOW_FIELD_GRID,
    height: FLOW_FIELD_GRID,
    format: gl2.RG,
    internalFormat: gl2.RG8,
    type: gl2.UNSIGNED_BYTE,
    magFilter: gl2.LINEAR,
    minFilter: gl2.LINEAR,
    wrapS: gl2.REPEAT,
    wrapT: gl2.REPEAT,
    generateMipmaps: false,
  });

  const colors = new Float32Array(6 * 3);
  packPalette(colors, initialPalette);

  const uniforms = {
    uTime: { value: 0 },
    uDPR: { value: dpr },
    uViewHeight: { value: 1 },
    uAspect: { value: 1 },
    uFlowField: { value: flowTexture },
    uColors: { value: Array.from(colors) },
  };

  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const mesh = new Mesh(gl, { geometry, program });
  const scene = new Transform();
  mesh.setParent(scene);

  return {
    mesh,
    scene,
    uniforms,
    setColors(palette) {
      const next = new Float32Array(6 * 3);
      packPalette(next, palette);
      uniforms.uColors.value = Array.from(next);
    },
    setFlowFieldData(data) {
      flowTexture.image = data;
      flowTexture.needsUpdate = true;
    },
  };
}

function lerpDepth(range: readonly [number, number], t: number): number {
  return range[0] + (range[1] - range[0]) * t;
}

function packPalette(
  out: Float32Array,
  palette: ReadonlyArray<readonly [number, number, number]>,
): void {
  for (let i = 0; i < 6; i++) {
    const c = palette[i];
    out[i * 3 + 0] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
}
