import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  notFound: vi.fn(),
}));

// Mock environment variables
process.env.NOTION_TOKEN = 'test-notion-token';
process.env.NOTION_DATA_SOURCE_ID = 'test-database-id';
process.env.NOTION_PHOTOS_DATA_SOURCE_ID = 'test-photos-database-id';

// Suppress console errors in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
