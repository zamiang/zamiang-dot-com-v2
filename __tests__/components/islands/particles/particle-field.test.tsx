import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ParticleField from '../../../../src/components/islands/particles/particle-field';

// jsdom does not provide a real WebGL2 context; we mock getContext to return null
// to exercise the capability-gate path. The renderer-active path is verified by
// manual QA (see plan Task 11).

beforeEach(() => {
  // Mock window.matchMedia for the use-mobile hook
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  global.ResizeObserver = MockResizeObserver as any;

  // Mock MutationObserver
  class MockMutationObserver {
    observe = vi.fn();
    disconnect = vi.fn();
  }
  global.MutationObserver = MockMutationObserver as any;

  // Mock getContext to return a fake gl that lacks createVertexArray.
  // OGL's Renderer constructor will try to use this, but createRenderer's capability gate
  // checks for createVertexArray and returns null gracefully.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    // Create a Proxy to handle any gl method call with a no-op, except those that throw intentionally
    const mockGl = new Proxy(
      {
        canvas: this, // Return the actual canvas element so appendChild works
        ONE: 1,
        ZERO: 0,
        FUNC_ADD: 0x8006,
        CCW: 0x0901,
        LEQUAL: 0x0203,
        BLEND: 0x0be2,
        // createVertexArray is intentionally missing to trigger the capability gate
      } as Record<string, any>,
      {
        get: (target, prop) => {
          if (typeof prop === 'string' && prop in target) return target[prop];
          // Return a no-op function for any method call
          return vi.fn();
        },
      },
    );
    return mockGl as unknown as WebGL2RenderingContext;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ParticleField', () => {
  it('renders the canvas wrapper with correct ARIA + class', () => {
    const { container } = render(<ParticleField />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper.className).toContain('pointer-events-none');
    expect(wrapper.className).toContain('fixed');
  });

  it('does not throw when WebGL2 is unavailable', () => {
    expect(() => render(<ParticleField />)).not.toThrow();
  });

  it('unmounts cleanly without leaked listeners', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ParticleField />);
    unmount();
    // Every scroll/popstate listener added during mount should be removed on unmount.
    const added = addSpy.mock.calls.filter(
      ([type]) => type === 'scroll' || type === 'popstate',
    ).length;
    const removed = removeSpy.mock.calls.filter(
      ([type]) => type === 'scroll' || type === 'popstate',
    ).length;
    expect(removed).toBe(added);
  });
});
