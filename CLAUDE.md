# Project Guide

Personal homepage/blog for Brennan Moore — [www.zamiang.com](https://www.zamiang.com/) (`brennanmoore.com` 301-redirects here)

---

## Design Context

### Audience

Engineering peers and the technical community — fellow engineers, CTOs, and technical leaders who appreciate craft and thoughtful problem-solving. Visitors arrive to evaluate Brennan's work, learn from his writing on engineering leadership and value-based care, or explore his photography.

### Brand Personality

**Voice**: Direct but warm. Explains complex ideas clearly without being condescending.

**Tone**: Reflective and substantive — depth over polish, insight over self-promotion.

**Three words**: Thoughtful, Builder, Curious

### Aesthetic Direction

"Slate Executive" palette — sophisticated minimalism with warmth. Light mode only, serif typography (EB Garamond), 680px content width.

**Design system reference**: `design-system/` documents the full spec — palette, type scale, spacing, motion, content rules, iconography, and a UI-kit recreation. `design-system/preview/` has one HTML card per concept for visual reference. `src/styles/globals.css` is the canonical source for tokens; `design-system/colors_and_type.css` mirrors it. Run `npm run check:design-tokens` to verify they haven't drifted. Do not import the design-system CSS into the app.

### Design Principles

1. **Clarity over cleverness** — typography, spacing, and hierarchy serve readability first
2. **Warmth within professionalism** — copper accent, serif italics, subtle texture
3. **Craft reflects craft** — attention to detail matters
4. **Content breathes** — generous whitespace, constrained width, clear sections
5. **Accessible by default** — WCAG 2.1 AA, reduced motion, semantic markup

---

## Tech Stack

| Component   | Technology                     | Notes                                                 |
| ----------- | ------------------------------ | ----------------------------------------------------- |
| Framework   | Astro 6                        | Static site generation with islands architecture      |
| Interactive | React 19                       | Island components only (Header, FloatingParticles)    |
| Language    | TypeScript (strict)            | Dual check: `npm run check` + `npm run typecheck`     |
| CMS         | Notion via @notion/client v5   | Custom content loader; uses `dataSources.query()` API |
| Styling     | Tailwind CSS v4                | Vite plugin                                           |
| Testing     | Vitest + React Testing Library | `__tests__/` mirrors `src/` structure                 |
| Deployment  | Cloudflare Pages               | Static output                                         |

---

## Architecture

- **Content Collections**: Astro content collections with a custom Notion loader (`src/lib/notion-loader.ts`)
- **React Islands**: Interactive components in `src/components/islands/` hydrated via `client:load` or `client:visible`
- **Sections**: "All" (general posts) and "VBC" (Value-Based Care series)
- **Images**: Local images in `public/images/`

### Key Entry Points

| Purpose             | Location                                                                   |
| ------------------- | -------------------------------------------------------------------------- |
| Pages & API routes  | `src/pages/` (index.astro, writing/[slug].astro, rss.xml.ts, feed.json.ts) |
| Layouts             | `src/layouts/` (BaseLayout.astro, PostLayout.astro)                        |
| Astro components    | `src/components/*.astro`                                                   |
| React islands       | `src/components/islands/` (Header.tsx, FloatingParticles.tsx)              |
| Content collections | `src/content/config.ts`                                                    |
| Utilities           | `src/lib/` (notion-loader.ts, config.ts)                                   |
| Tests               | `__tests__/`                                                               |

---

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production static build
npm run preview          # Preview production build

npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

npm run check            # Astro type check (includes virtual modules)
npm run check:design-tokens  # Verify design-system mirror matches globals.css
npm run typecheck        # TypeScript validation (non-Astro files)
npm run lint             # ESLint
```

---

## Key Patterns

### Notion API (v5)

```typescript
// Correct — uses dataSources API
await notion.dataSources.query({ data_source_id: NOTION_DATABASE_ID });

// Wrong — old v4 API, will fail
await notion.databases.query({ database_id: NOTION_DATABASE_ID });
```

### Astro Islands

```astro
<!-- client:load for critical interactive elements (e.g. Header — required for iOS Safari) -->
<Header client:load />

<!-- client:visible for non-critical UI -->
<FloatingParticles client:visible />
```

### Testing

- Use `vi.mocked()` for type-safe mocks
- Use regex for date assertions to handle timezone variations: `/Aug (19|20), 2023/`
- Update snapshots with `npm test -- -u` after intentional changes

### TypeScript

Two type-check commands exist because Astro virtual modules can't be resolved by `tsc`. See Serena memory `gotchas/typescript-config` for details.

---

## Environment Variables

```bash
NOTION_TOKEN=secret_xxx                    # Notion API integration token
NOTION_DATA_SOURCE_ID=xxx                  # Posts data source ID
NOTION_PHOTOS_DATA_SOURCE_ID=xxx           # Photos data source ID
SITE_URL=https://www.zamiang.com           # Site URL for absolute links
```

---

## Troubleshooting

**Notion API errors**: Ensure using `dataSources.query()` not `databases.query()`. Verify `data_source_id` env vars. Default API version (2025-09-03) works.

**iOS Safari touch issues**: Interactive elements need `client:load` hydration and explicit `cursor-pointer` class. See Serena memory `gotchas/ios-safari`.

**Test failures**: Check timezone handling (use regex), snapshot staleness (`npm test -- -u`), and mock typing (`vi.mocked()`).

---

**Last Updated**: 2026-05-09
