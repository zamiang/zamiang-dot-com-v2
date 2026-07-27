# Brennan Moore Design System

> **Source of truth.** `src/styles/globals.css` is canonical. The token block in
> `colors_and_type.css` mirrors it for documentation and external consumers; do
> not import this folder into the Astro app. Drift between the two is checked
> by `npm run check:design-tokens`.

A design system distilled from the personal website of **Brennan Moore** — engineer, writer, photographer. The system is sophisticated, restrained, and reading-first: a "Slate Executive" palette, EB Garamond serif headings, Lato body, generous whitespace, and a quiet copper accent for emphasis.

> "Slate Executive — sophisticated minimalism with warmth. Light mode only, serif typography (EB Garamond), 600px article width."
> — `PRODUCT.md` / `CLAUDE.md`, project guides

**Live site:** [www.zamiang.com](https://www.zamiang.com/)
**Source repo:** [zamiang/zamiang-dot-com-v2](https://github.com/zamiang/zamiang-dot-com-v2) (Astro 7 + React 19 islands + Tailwind 4)

---

## Sources

| Source | What was used |
| --- | --- |
| `src/styles/globals.css` | Color tokens, fluid type scale, motion timings, semantic component styles. |
| `PRODUCT.md` | Brand voice, audience, design principles, "Slate Executive" naming. |
| `src/layouts/BaseLayout.astro`, `PostLayout.astro` | Page chrome, OG/SEO, favicon set, font preconnect. |
| `src/components/*.astro` | PostCard, PhotoCard, SeriesPostCard, Footer, TableOfContents, section wrappers. |
| `src/components/islands/Header.tsx` | Nav structure, mobile menu, link list. |
| `src/components/islands/particles/renderer/config.ts` | Light/dark particle palettes (decorative only — not part of core token set). |
| `public/about.jpg`, `public/images/*.jpg` | Sample photography in `assets/photos/` for reference imagery. |

---

## Index

| File / Folder | Purpose |
| --- | --- |
| `README.md` | This document. Brand context, visual foundations, content rules, iconography. |
| `SKILL.md` | Skill manifest — makes this folder portable to Claude Code. |
| `colors_and_type.css` | Tokens (CSS custom properties) + semantic class hooks (`.bm-prose`, `.bm-section-label`, `.bm-photo`, `.bm-hud`, etc). Includes Google Fonts import for EB Garamond + Lato. |
| `bm-filters.svg` | SVG filter definitions (currently `#bm-edge` for the photo inspect treatment). Inline once per page that uses `.bm-photo--inspect`. |
| `assets/` | Logos, favicons, profile photo, sample photography. |
| `assets/photos/` | Four representative photographs (portrait, landscape, architectural, detail) — copy these in when you need realistic imagery. |
| `preview/` | One HTML card per design-system concept. Powers the Design System tab. |
| `ui_kits/website/` | High-fidelity recreation of the personal website (homepage, post, photos index). |

---

## Brand Context

**Brennan Moore** is an engineering leader / CTO with a fine-art background. He writes about engineering leadership, value-based care (a long-running series), and posts black-and-white and color photography from his travels. The site is the resume, the journal, and the gallery in one — the voice is direct but warm, the typography says "I read books," and the layout says "I have nothing to sell you."

**Audience:** Engineering peers, CTOs, technical leaders, and the occasional reader who arrives for the photography.

**Three words:** Thoughtful · Builder · Curious.

**Aesthetic in one line:** A LaTeX paper that took itself less seriously, printed on slightly cream paper, with one copper bookmark.

---

## Content Fundamentals

**Voice.** Direct but warm. Substance over polish. First-person singular, never marketing-plural ("I", not "we"). Addresses the reader as "you" sparingly — usually only when giving practical advice. Never breathless, never salesy.

**Tone.** Reflective. Acknowledges uncertainty. Prefers a precise "I think" over a hollow "the truth is." Topics tend to be hard ones (healthcare, leadership tradeoffs, photography); the writing earns the reader's trust by not pretending they're easy.

**Casing.**
- Article and section titles: **Title Case** ("Why Value-Based Care is Harder Than Rocket Science").
- Section labels and resume headings: **UPPERCASE** with `letter-spacing: 0.15em` ("MORE TO READ", "SELECTED WORK").
- Nav, footer, body copy: sentence case.
- Buttons: title case, single word preferred ("Next", "Resume").

**Punctuation.** Em-dashes, semicolons, and serial commas are welcomed — they signal craft. The middle dot (`·`) is used as a separator between meta items: `April 14, 2026 · 7 min read`.

**Emoji.** Not used. There is no emoji anywhere in the codebase.

**Examples.**
- Section subtitle: *"Essays on engineering leadership, startups, and building teams."*
- Post-meta line: *"April 14, 2026 · 7 min read"*
- TOC label: *"In This Article"*
- Footer divider: a single 64px hairline, nothing else.
- Footer link list: `Resume · Instagram · RSS · Source`.

The vibe is **a quiet personal essay site, not a portfolio app**. Copy is short; subtitles are real sentences with periods. There is no "Get started", no "Learn more", no exclamation points.

---

## Visual Foundations

### Color
Single light-mode palette, "Slate Executive."

| Token | Hex | Use |
| --- | --- | --- |
| `--background` | `#f0f2f5` | Page — Cool Mist, never pure white |
| `--foreground` | `#2c333a` | Body text — Deep Charcoal Blue |
| `--primary` | `#5a7684` | Steel Blue — header chrome, branding |
| `--accent` | `#749ca8` | Dusty Teal — link borders, accents, section labels |
| `--accent-bold` | `#c17f59` | Warm Copper — primary CTAs, the only "warm" color |
| `--muted` | `#e8eaed` | Code-block backgrounds, input fills |
| `--muted-foreground` | `#4a5560` | Meta text, captions |
| `--border` | `#d1d5db` | Hairline rules, separators |
| `--card` | `#ffffff` | Card surfaces (rare) |
| `--destructive` | `#b44d4d` | Error states only |
| `--success` | `#5a8a6b` | Confirmation only |

**Section tints** (translucent, ~85% over the noise overlay): warm `rgba(245,240,232,.85)`, cool `rgba(235,238,242,.85)`, muted `rgba(229,232,236,.85)`, accent `rgba(232,239,242,.85)`. These are full-bleed `100vw` strips that break out of the article column to introduce gentle vertical rhythm.

### Type
- **Serif:** EB Garamond — every heading, every "tagline" intro, blockquotes, post titles, work-card titles. Italics are used (rarely) inside articles for emphasis.
- **Sans:** Lato 400 / 700 — body, nav, meta, labels, buttons.
- **Mono:** JetBrains Mono, falling back to Consolas / Monaco / Andale Mono / Ubuntu Mono (`--font-mono`) — code, and the eyebrow chrome (`.bm-eyebrow` section numbers and labels).
- **Base size:** 18px (`1.125rem`). Reading is the priority.
- **Fluid scale:** `clamp()`-based from `--font-size-sm` to `--font-size-4xl` so type scales smoothly between mobile and desktop without media queries.
- **Line height:** 1.7 for body, 1.8 for long-form articles, 1.3 for headings.
- **Measure:** `max-width: 65ch` for `article p, article li`. Article column capped at 600px (`--article-max-width`).

### Spacing & Layout
- Article width: **600px** (`--article-max-width`), centered. `.section-wrapper-inner` is **680px**; `.post-article` widens to **42rem** for post bodies and photo galleries.
- Resume / homepage two-column: **960px**, `260px / 1fr` grid above 1024px.
- Photo grid: 2 columns, `gap: 0.375rem` (6px) — photos breathe better when they almost touch.
- Section padding: `4rem 1rem` on `.section-wrapper`.
- Paragraph spacing: `1.5em`.
- Mobile: everything collapses to a single column at `≤768px`; columns stack at `≤630px`.

### Backgrounds & Texture
The page background is **never flat color**. A fixed full-viewport SVG fractal-noise overlay (`opacity: 0.025`) sits on top of everything to introduce paper grain. Section wrappers use translucent tints so the noise shows through. There are no gradients, no full-bleed marketing photos, no patterns. Imagery lives only inside photo cards.

A second layer — `<FloatingParticles />`, a React island — places ~16 slowly-drifting dots at low opacity in the viewport. They use a separate, intentionally wider palette of slates, teals, and dusty purples (light mode) and warm corals/golds (dark mode, prepared but unused). They respond to scroll velocity with gentle inertia. **Disabled under `prefers-reduced-motion`.**

### Animation & Motion
A small, principled set:
- `--transition-fast: 150ms` — color, focus.
- `--transition-normal: 200ms` — hovers, state changes, link underlines.
- `--transition-slow: 300ms` — transforms.
- `--ease-out: cubic-bezier(0.33, 1, 0.68, 1)` — quart-out, the only easing curve in the system.

No bounces, no springs, no slide-ins. Hover states fade in colour. The particle system is the one place anything moves on its own. Everything is wrapped in `@media (prefers-reduced-motion: reduce) { transition-duration: 0.01ms !important; }`.

### Hover & Press States
- **Links:** colour shifts to `--accent`; the existing 60%-opacity `--accent` underline becomes 100%.
- **Photo cards / linked images:** `opacity: 0.85` on hover; full opacity at rest.
- **Buttons (`.next-button`):** background mixes 15% black into `--primary`.
- **Section cards (`.next-post`):** background opacity steps from `secondary/80` → `secondary`, border from `accent/20` → `accent/40`.
- **No press states beyond colour** — no shrink, no shadow change. The system trusts the user to feel the click.

#### Inspect treatment (scoped exception)

The one place the system breaks its own "fade colour on hover" rule: photo cards may opt into an *inspect treatment* via `.bm-photo--inspect`, which cross-fades the photo to an edge-detected line-art layer with a dotted coordinate grid and a small copper HUD (corner brackets, focal-point reticle, monospace telemetry strip).

**Scope.** Used only on photo cards: the photos index, the homepage photo grid, the recommended-photos footer, and inline images within photo posts (gated by `ContentRenderer`'s `gallery` prop). Inline images in writing posts, header portraits, and any other photographic surface use the base `.bm-photo`. The chrome must not appear around work cards, post cards, or non-photographic elements.

**Composition.** Two parts, intentionally separable:
- `.bm-photo--inspect` — the photo treatment (base → line-art cross-fade + grid)
- `.bm-hud` + `.bm-hud-brackets` / `.bm-hud-reticle` / `.bm-hud-telemetry` — the overlay primitives, reusable on other positioned containers when paired with `.bm-hud.is-revealed`

**Tokens.** `--hud` (defaults to `--accent-bold`), `--transition-reveal: 700ms` (the 4th motion duration, scoped to multi-element reveals), `--focal-x` / `--focal-y` (per-card reticle position).

**Asset.** Requires `bm-filters.svg` (provides the `#bm-edge` SVG filter) inline or referenced once per page.

**Motion.** Single cross-fade over `--transition-reveal`. No sweep, no scan beam, no slide-ins. HUD parts stagger by 120 / 200 / 250ms within the same window. Honors `prefers-reduced-motion` by collapsing the reveal to instant.

**Accessibility.** The HUD is purely decorative; the overlay carries `aria-hidden="true"` and the underlying `<img>` retains the real `alt` text. Telemetry values are visual flavour — nothing functional is conveyed there alone.

**Mobile.** No hover on touch — cards revert to the default `.bm-photo` behaviour. Don't wire a tap-to-toggle; the chrome is dense and rewards a pointing device.

See `preview/components-photo-grid.html` for both states side by side.

### Borders, Radii, Shadow
- **Borders.** Hairline (1px) `--border` for dividers, hairlines under section headings. Section cards: `border-color` from `accent/20`.
- **Radii.** Headings get `border-radius: 4px` so highlight backgrounds (e.g. for selected text) look intentional. Cards: `rounded-lg` (8px). Photo cards: `rounded-sm` (2px) — almost square. Pill: only on the VBC badge (`px-3 py-1 rounded`).
- **Shadows.** **The system has effectively no drop shadows.** Depth comes from the noise texture, the section-tint stripes, and the hairline rules. The `colors_and_type.css` file ships a `--shadow-card` token for occasional use, but you should treat it as escape-hatch only — the codebase itself does not lift cards off the page.

### Transparency & Blur
- Section wrappers tinted at 85% alpha so the noise grain reads through.
- Border colours often expressed via `color-mix(in srgb, var(--accent) 60%, transparent)` so they stay tonally consistent with the surrounding text.
- No `backdrop-filter` blur anywhere. The site is not glassmorphic.

### Imagery
**Photographs** are the only imagery. They are typically:
- Warm-leaning when colour, often shot at golden hour, with visible film-like grain.
- Black-and-white when portrait-leaning, with rich midtones.
- Square-cropped (1:1) on the homepage grid; native aspect on the photo detail page.
- No overlays, no captions burnt in, no rounded-corner thumbnails: photos sit at `rounded-sm` (≤2px) so the image dominates.

Reference photographs are in `assets/photos/`.

### Cards
Cards are quiet. Default state has **no shadow, no border, optional hairline divider underneath, and rounded `lg` corners only when the card is interactive** (`.next-post`, `.toc`). The `.work-card` is just a row separated by a `border-bottom: 1px solid rgba(209,213,219,.3)` — it's barely a card at all, which is the point.

### Layout Rules / Fixed Elements
- `<Header>` is **not sticky**. It sits at the top of the page and scrolls away.
- The noise overlay is `position: fixed`, `inset: 0`, `pointer-events: none`.
- The floating particles canvas is `position: fixed`, `z-index: 0`, sits behind content.
- Skip link (`#main-content`) is `sr-only` until focused, then absolute top-left.

---

## Iconography

The codebase **does not ship a custom icon set** and **does not use an icon font**. Every icon in the production site is an inline `<svg>` written by hand in the relevant component, using `stroke="currentColor"` and either `strokeWidth={1.5}` (UI chrome — hamburger, close) or `strokeWidth={2}` (inline indicators — external-link arrow). Fill is `none`; line caps and joins are `round`. The set is tiny and intentional:

| Icon | Where | Stroke |
| --- | --- | --- |
| Hamburger (3-line) | Mobile header toggle | 1.5 |
| Close (X) | Mobile header toggle, checked state | 1.5 |
| Arrow up-right | Inline indicator on external nav links | 2 |

There is **no emoji** anywhere. No unicode glyph icons except the **middle dot `·`** used as a meta separator and the section-divider hairline rules.

When a design needs more iconography than the site has (e.g. a UI kit recreation needs a list bullet, a quote mark, a chevron), use **[Lucide](https://lucide.dev/)** at the same stroke weight as the existing icons. Lucide matches the codebase's `stroke="currentColor"`, `strokeWidth={1.5–2}`, round-caps style 1:1.

> **Substitution flag.** Lucide is loaded from CDN for the UI kits in this repo. The production site doesn't use it; pull icons in component-by-component if you ship them to production, or replace with hand-rolled SVGs in the same style.

Logos / brand marks:
- `assets/favicon.svg`, `assets/favicon-32x32.png`, `assets/apple-touch-icon.png` — site favicon set.
- `assets/about.jpg` — the "about" portrait photograph used as the OG image and the homepage identity photo (84px round in the resume header).

---

## Caveats

- **Favicon emoji.** `assets/favicon.svg` is a single `<text>` glyph rendering the 🐣 chick emoji. This is the one intentional exception to the system's "no emoji" rule — the favicon is a playful brand mark embedded as a vector, not content or UI. The rule still holds everywhere else.
- **Fonts.** EB Garamond and Lato are pulled from Google Fonts at runtime via `colors_and_type.css`. This matches what the live site does — there are no self-hosted `.ttf`/`.woff2` files in the repo. If you need offline fidelity, download both families from Google Fonts and replace the `@import` with `@font-face` declarations in `fonts/`. **No font substitution was made; both are the originals.**
- **Dark mode.** The site is light-mode-only by design. The particle system has dark-mode colors prepped, but no other tokens, components, or layouts are dark-aware.
- **Logo.** There is no wordmark, no monogram. The "Brennan Moore" text in the header *is* the logo, set in Lato Regular at `text-sm`.

---

*Last updated 2026-05-12.*
