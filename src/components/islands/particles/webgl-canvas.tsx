'use client';

import { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2  u_resolution;
  uniform float u_time;
  uniform float u_scroll;
  uniform float u_isDark;
  uniform float u_reducedMotion;

  float hash11(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
  }

  // Value-like 2D noise (cheap, smooth)
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  // Render a layer of soft dots at a given cell size with a parallax factor.
  // Returns accumulated alpha; writes color into colorOut.
  float dotLayer(
    vec2 fragPx,
    float cellSize,
    float parallaxFactor,
    float driftSpeed,
    float t,
    out vec3 colorOut
  ) {
    // Scroll parallax: shift the field as the page scrolls.
    vec2 pos = fragPx;
    pos.y -= u_scroll * parallaxFactor;

    vec2 cellPos = pos / cellSize;
    vec2 cellId  = floor(cellPos);

    float alphaAcc = 0.0;
    vec3  colorAcc = vec3(0.0);
    float weight   = 0.0;

    // Sample the 3x3 neighborhood so dots that drift across cell boundaries
    // are still drawn correctly.
    for (int dy = -1; dy <= 1; dy++) {
      for (int dx = -1; dx <= 1; dx++) {
        vec2 nId = cellId + vec2(float(dx), float(dy));

        // Per-cell deterministic hashes for variation.
        float h1 = hash11(nId);
        float h2 = hash11(nId + vec2(13.0, 7.0));
        float h3 = hash11(nId + vec2(41.0, 23.0));

        // Drift the dot inside its cell via noise sampled over time.
        // Each cell drifts independently so the field never visibly loops.
        float driftX = noise(nId * 0.5 + vec2(t * driftSpeed, h1 * 10.0));
        float driftY = noise(nId * 0.5 + vec2(h2 * 10.0, t * driftSpeed * 0.85));
        vec2  dotCenter = nId + vec2(0.5) + vec2(driftX, driftY) * 0.45;

        // Distance from this fragment to that dot (in pixels).
        float dist = length((cellPos - dotCenter) * cellSize);

        // Size and base intensity from per-cell hash.
        float radius     = mix(2.5, 6.0, h1);
        float baseAlpha  = mix(0.15, 0.40, h2);
        float softness   = radius * 2.2;

        // Gaussian-like falloff for a soft glow per dot.
        float falloff = exp(-(dist * dist) / (softness * softness));
        float contribution = falloff * baseAlpha;

        // Color: narrow band of hues in the slate family for light mode,
        // copper/amber band for dark mode. Saturation/value vary per cell.
        float lightHue = 0.58 + h3 * 0.12;     // ~blue-purple range
        float darkHue  = 0.05 + h3 * 0.06;     // ~orange-amber range
        float hue      = mix(lightHue, darkHue, u_isDark);
        float sat      = mix(0.12, 0.30, h1);
        float val      = mix(0.30, 0.55, h2);
        vec3  col      = hsv2rgb(vec3(hue, sat, val));

        alphaAcc += contribution;
        colorAcc += col * contribution;
        weight   += contribution;
      }
    }

    colorOut = weight > 0.0 ? colorAcc / weight : vec3(0.0);
    return alphaAcc;
  }

  void main() {
    vec2 fragPx = gl_FragCoord.xy;
    float t = u_reducedMotion > 0.5 ? 0.0 : u_time;

    // Two layers at different cell sizes give a sense of depth and parallax.
    vec3 cFar, cNear;
    float aFar  = dotLayer(fragPx, 140.0, 0.04, 0.06, t,        cFar);
    float aNear = dotLayer(fragPx,  90.0, 0.015, 0.09, t * 1.3, cNear);

    // Background-layer dots are dimmer and slightly cooler.
    aFar  *= 0.55;
    aNear *= 0.75;

    vec3  color = cFar * aFar + cNear * aNear;
    float alpha = clamp(aFar + aNear, 0.0, 0.45);

    // Premultiplied output: color * alpha, alpha.
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('Shader compile failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string,
): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
    });
    if (!gl) return;

    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) return;

    gl.useProgram(program);

    // Full-viewport triangle (one triangle is enough to cover the screen and
    // skips the diagonal seam of a quad).
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uScroll = gl.getUniformLocation(program, 'u_scroll');
    const uIsDark = gl.getUniformLocation(program, 'u_isDark');
    const uReducedMotion = gl.getUniformLocation(program, 'u_reducedMotion');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let scrollY = window.scrollY;
    let isVisible = !document.hidden;
    let isDark = document.documentElement.classList.contains('dark');
    const motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionMql.matches;
    let raf = 0;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!isVisible) return;

      gl.uniform1f(uTime, t * 0.001);
      gl.uniform1f(uScroll, scrollY * (window.devicePixelRatio || 1));
      gl.uniform1f(uIsDark, isDark ? 1 : 0);
      gl.uniform1f(uReducedMotion, reducedMotion ? 1 : 0);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onVisibility = () => {
      isVisible = !document.hidden;
    };
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    const onAfterSwap = () => {
      scrollY = 0;
    };

    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });

    const onContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('astro:after-swap', onAfterSwap);
    motionMql.addEventListener('change', onMotionChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    canvas.addEventListener('webglcontextlost', onContextLost);

    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('astro:after-swap', onAfterSwap);
      motionMql.removeEventListener('change', onMotionChange);
      themeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 size-full"
      aria-hidden="true"
    />
  );
}
