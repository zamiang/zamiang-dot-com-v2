#version 300 es
precision highp float;

// Quad vertex attribute (2 triangles, [-0.5..0.5] in both axes)
in vec2 position;
in vec2 uv;

// Per-instance attributes
in vec4 aSeed;          // random seed values [0..1]
in float aDepth;        // 0 = far, 1 = near
in vec2 aBaseOffset;    // normalized starting position [0..1]

uniform float uTime;
uniform float uScrollY;        // normalized: pixels / viewportHeight
uniform float uScrollInertia;  // normalized
uniform float uDPR;
uniform float uViewHeight;     // CSS pixels
uniform float uAspect;         // width / height
uniform sampler2D uFlowField;  // 16x16 RG, encodes curl vector

out vec2 vUv;
out vec3 vColor;
out float vDepth;
out float vIntensity;

uniform vec3 uColors[6];

void main() {
  // 1. Start from per-instance base offset (normalized 0..1)
  vec2 pos = aBaseOffset;

  // 2. Sample flow field at current position. Texture is RG, [-1,1] after decode.
  // The flow vector modulates the DIRECTION of a bounded per-particle oscillation,
  // not a velocity to integrate. We don't keep per-particle state across frames, so
  // multiplying flow by uTime would mean each fresh flow texture (regenerated every
  // 500ms) recomputes position from scratch with the new vector — at large uTime
  // that snaps positions by Δflow * uTime. A bounded sin() keeps the contribution
  // small regardless of elapsed time, so regen produces only sub-pixel discontinuities.
  vec2 flowSample = texture(uFlowField, pos).rg * 2.0 - 1.0;
  float oscPhase = uTime * 0.0004 + aSeed.w * 6.2831;
  float oscAmp = mix(0.015, 0.04, aDepth);
  pos += flowSample * sin(oscPhase) * oscAmp;

  // 3. Scroll parallax (per-band)
  float parallax = mix(0.02, 0.18, aDepth);
  pos.y -= uScrollY * parallax;

  // 4. Scroll inertia kick (decays in JS each frame)
  float inertiaFactor = mix(0.05, 0.35, aDepth);
  pos.y -= uScrollInertia * inertiaFactor * 0.002;

  // 5. Wrap vertically to keep field infinite
  pos.y = fract(pos.y);

  // 6. Convert from [0,1] normalized to clip space [-1,1]
  vec2 clipPos = pos * 2.0 - 1.0;

  // 7. Quad sizing — point size in CSS pixels → clip-space scale
  float pointSizePx = mix(8.0, 48.0, aDepth) * uDPR;
  vec2 quadScale = vec2(pointSizePx / (uViewHeight * uAspect), pointSizePx / uViewHeight);

  gl_Position = vec4(clipPos + position * quadScale, 0.0, 1.0);

  // Varyings
  vUv = uv;
  int colorIdx = int(mod(aSeed.x * 100.0, 6.0));
  vColor = uColors[colorIdx];
  vDepth = aDepth;
  vIntensity = mix(0.12, 0.35, aDepth);
}
