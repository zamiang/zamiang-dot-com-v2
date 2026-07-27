# Project Guide

Personal homepage/blog for Brennan Moore — [www.zamiang.com](https://www.zamiang.com/) (`brennanmoore.com` 301-redirects here)

## Design Context

Brand voice, audience, design principles, and accessibility bar live in `PRODUCT.md` — read it before design work.

Visual spec (palette, type scale, spacing, motion, iconography, UI kit) lives in `design-system/`. `src/styles/globals.css` is the canonical token source; `design-system/colors_and_type.css` mirrors it. Run `npm run check:design-tokens` to verify they haven't drifted. Do not import the design-system CSS into the app.

## Tech Stack

Astro 7 (static output, islands) · React 19 · TypeScript strict · Tailwind CSS v4 (Vite plugin) · Notion CMS via `@notionhq/client` v5 · Vitest + React Testing Library · Cloudflare Pages.

## Architecture

- **Content**: Astro content collections fed by a custom Notion loader (`src/lib/notion-loader.ts`). Collection config is at `src/content.config.ts` — repo root of `src/`, **not** `src/content/config.ts`.
- **React islands**: `src/components/islands/`, hydrated via `client:load` or `client:visible`. Everything else is `.astro`.
- **Sections**: "All" (general posts) and "VBC" (Value-Based Care series).
- **Images**: local, in `public/images/`.
- **Tests**: `__tests__/` mirrors the `src/` structure.

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production static build
npm run preview          # Preview production build

npm test                 # Run all tests (vitest run)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

npm run check            # Astro type check (resolves virtual modules)
npm run typecheck        # tsc --noEmit (non-Astro files)
npm run lint             # ESLint (--max-warnings=0)
npm run format           # Prettier write
npm run check:design-tokens  # Verify design-system mirror matches globals.css
npm run knip             # Unused files/exports/deps
npm run audit-dependencies   # npm audit --audit-level=high --production
```

`npm run check` and `npm run typecheck` both exist because `tsc` can't resolve Astro virtual modules (`astro:content`). Both must pass before shipping.

## Key Patterns

### Notion API (v5)

```typescript
// Correct — dataSources API
await notion.dataSources.query({ data_source_id: NOTION_DATA_SOURCE_ID });

// Wrong — v4 API, will fail
await notion.databases.query({ database_id: NOTION_DATA_SOURCE_ID });
```

Default API version (2025-09-03) is correct; older versions have compatibility issues. See Serena memory `gotchas/notion-api-v5`.

### Astro islands

```astro
<!-- client:load for critical interactive elements (e.g. Header — required for iOS Safari) -->
<Header client:load />

<!-- client:visible for non-critical UI -->
<FloatingParticles client:visible />
```

Interactive elements need `client:load` **and** an explicit `cursor-pointer` class or iOS Safari drops touch events. See Serena memory `gotchas/ios-safari`.

### Testing

- Use `vi.mocked()` for type-safe mocks.
- Use regex for date assertions to absorb timezone variation: `/Aug (19|20), 2023/`.
- Update snapshots with `npm test -- -u` after intentional changes.

## Environment Variables

```bash
NOTION_TOKEN=secret_xxx                    # Notion API integration token
NOTION_DATA_SOURCE_ID=xxx                  # Posts data source ID
NOTION_PHOTOS_DATA_SOURCE_ID=xxx           # Photos data source ID
SITE_URL=https://www.zamiang.com           # Site URL for absolute links
```
