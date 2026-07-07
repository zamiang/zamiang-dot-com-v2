import { Renderer } from 'ogl';
import type { OGLRenderingContext } from 'ogl';

export interface RendererBundle {
  renderer: Renderer;
  gl: OGLRenderingContext;
  canvas: HTMLCanvasElement;
  resize: (width: number, height: number) => void;
  destroy: () => void;
}

export function createRenderer(parent: HTMLElement, dpr: number): RendererBundle | null {
  const renderer = new Renderer({
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
    webgl: 2,
    dpr,
  });

  const gl = renderer.gl;
  // Verify WebGL2 is actually available (createVertexArray is WebGL2-only).
  if (!gl || typeof (gl as WebGL2RenderingContext).createVertexArray !== 'function') {
    return null;
  }

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied alpha

  const canvas = gl.canvas;
  // Positioned via a CSS class rather than element.style — the CSP blocks
  // inline styles (Astro's hashes make 'unsafe-inline' inert). See .particles-canvas
  // in globals.css.
  (canvas as HTMLCanvasElement).classList.add('particles-canvas');
  parent.appendChild(canvas);

  const resize = (width: number, height: number) => {
    renderer.setSize(width, height);
  };

  const destroy = () => {
    if (canvas.parentElement === parent) parent.removeChild(canvas);
    const loseCtx = gl.getExtension('WEBGL_lose_context');
    loseCtx?.loseContext();
  };

  return { renderer, gl, canvas, resize, destroy };
}
