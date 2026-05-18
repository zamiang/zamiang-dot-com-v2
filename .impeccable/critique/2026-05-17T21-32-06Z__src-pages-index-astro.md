---
target: homepage
total_score: 30
p0_count: 2
p1_count: 2
timestamp: 2026-05-17T21-32-06Z
slug: src-pages-index-astro
---
# Critique: Homepage (`src/pages/index.astro`)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | n/a |
| 2 | Match System / Real World | 4 | Voice in "Currently" lands |
| 3 | User Control and Freedom | 3 | No in-page nav on desktop |
| 4 | Consistency and Standards | 3 | "Jobs" breaks editorial title pattern |
| 5 | Error Prevention | 3 | n/a |
| 6 | Recognition Rather Than Recall | 3 | Hidden desktop nav |
| 7 | Flexibility and Efficiency | 2 | No nav, no TOC across 5 sections |
| 8 | Aesthetic and Minimalist Design | 3 | Subtitle generic; rhythm strong |
| 9 | Error Recovery | 3 | n/a |
| 10 | Help and Documentation | 3 | n/a |
| **Total** | | **30/40** | Solid — taste evident, identity under-asserted |

## Anti-Patterns Verdict

LLM: Avoids gradient text, glassmorphism, metric hero, identical card grids. Photo `bm-photo--inspect` HUD is a real signature. Overall archetype (EB Garamond + cream + copper accent + 600px column + italic taglines + numbered mono eyebrows) is the first-order "engineer-blog 2024" reflex; tasteful execution of a familiar template.

Detector: 1 finding — single-font warning on BaseLayout.astro. Partial false positive (mono is in globals.css as --font-mono).

## Priority Issues

- **[P0] Identity hierarchy inverted** — h1 "Brennan Moore" same size as section titles. Bump h1, demote section titles.
- **[P0] Hero subtitle is generic CTO-speak** — "I build innovative digital products people love." Replace with concrete sentence from Currently.
- **[P1] Five §NN eyebrows is one too many** — keep on editorial sections, drop elsewhere.
- **[P1] hideDesktopNav strips wayfinding** — add minimal sticky nav or in-page TOC.
- **[P2] "Jobs" display title flat** — rewrite editorially or drop.

## Persona Red Flags

Recruiter scan: name no larger than section headings; generic subtitle; no desktop jump-nav.
Returning reader: mobile contact links hidden below 768px; no TOC across 5 sections.

## Minor Observations

- Mobile header strips LinkedIn/Resume/GitHub (`display: none` <768px).
- VBC excerpt auto-generated; reads templated.
- Body base 18px vs article 17px is backwards.
- body::after noise at z-9999 risks occluding focus rings.
