#version 300 es
precision highp float;

in vec2 vUv;
in vec3 vColor;
in float vDepth;
in float vIntensity;

out vec4 fragColor;

void main() {
  // Distance from quad center, normalized to [0, 1] at the edge.
  float d = length(vUv - 0.5) * 2.0;

  // Bokeh disk: far particles have very soft edges, near ones slightly crisper.
  float edgeStart = 1.0 - mix(0.7, 0.15, vDepth);
  float alpha = 1.0 - smoothstep(edgeStart, 1.0, d);

  // Premultiplied additive — color carries intensity, alpha gates fragment.
  fragColor = vec4(vColor * vIntensity * alpha, alpha);
}
