# Product

Canonical source for **who this site is for and why it exists**. Execution detail — palette, type scale, spacing, motion, casing, copy examples — lives in `design-system/README.md`. Tokens live in `src/styles/globals.css`. When those two disagree with this document about intent, this document wins.

## Purpose

A personal homepage and blog for Brennan Moore ([www.zamiang.com](https://www.zamiang.com/)). It presents his writing, photography, selected work history, and HCI publications as a single editorial surface — the resume, the journal, and the gallery in one.

Success looks like a visitor coming away with a clear, warm sense of who Brennan is and the depth of his work. Design itself is the product: there is no funnel, no conversion, no signup. The page's job is to leave an impression of substance and care.

The positioning line the site leads with:

> I make clean software in messy industries — most recently healthcare and value-based care. Writing, photography, and notes from the work.

## Users

Engineering peers and the technical community — fellow engineers, CTOs, and technical leaders who appreciate craft and thoughtful problem-solving. Visitors arrive to evaluate Brennan's work, learn from his writing on engineering leadership and value-based care, or explore his photography. They are reading on their own time, not transacting.

Three arrival patterns worth designing for:

| Reader                        | Arrives from               | Wants                                                         |
| ----------------------------- | -------------------------- | ------------------------------------------------------------- |
| Peer / potential collaborator | A name, a referral, a talk | To size up depth quickly — About, Selected Work, Publications |
| Reader                        | A link to one essay        | To finish that essay, then maybe find one more                |
| Photography visitor           | Social, a photo link       | To browse images without chrome getting in the way            |

None of them should have to hunt. The homepage is a single scroll that answers all three.

## Surfaces

- **Homepage** — a numbered editorial scroll: 01 Writing (recent essays, VBC series folded in as one card), 02 Photography, 03 Currently, 04 Experience, 05 Publications.
- **`/writing`** — full essay index; **`/writing/[slug]`** — long-form post with table of contents and reading time.
- **`/photos`**, **`/photos/[slug]`** — photo sets, image-first.
- **VBC series** — "Why Value-Based Care is Harder Than Rocket Science," a multi-part argument treated as one work, not a tag.
- **Feeds** — RSS, JSON Feed, and per-post `.md` endpoints. The writing is meant to be readable away from the site.

## Brand Personality

**Voice**: Direct but warm. Explains complex ideas clearly without being condescending. First-person singular — "I", never marketing-plural "we".

**Tone**: Reflective and substantive — depth over polish, insight over self-promotion. Acknowledges uncertainty; prefers a precise "I think" to a hollow "the truth is." The topics are hard ones, and the writing earns trust by not pretending they're easy.

**Three words**: Thoughtful, Builder, Curious.

Warmth is carried by a copper accent, serif italics, and subtle texture against a cool slate palette. Casing, punctuation, and copy examples are specified in `design-system/README.md` → Content Fundamentals.

## Design Principles

1. **Clarity over cleverness** — typography, spacing, and hierarchy serve readability first.
2. **Warmth within professionalism** — copper accent, serif italics, subtle texture.
3. **Craft reflects craft** — attention to detail signals the quality of the work itself.
4. **Content breathes** — generous whitespace, a constrained 600px article column, clear sections.
5. **One typographic voice** — serif (EB Garamond) carries editorial voice and headings; sans (Lato) carries UI and meta; mono marks technical/eyebrow chrome. Each family has a job.
6. **Accessible by default** — see below. Not a polish pass; a constraint on every decision.

## Accessibility & Inclusion

WCAG 2.1 AA. Light mode only by design. Respects `prefers-reduced-motion` (motion reduced to near-instant). Semantic markup, visible focus indicators, body text held to ≥4.5:1 contrast. Decorative motion — the particle field — carries no information and is safe to never render.

## Anti-references

- Generic SaaS/startup landing-page templates (hero-metric blocks, identical icon-card grids).
- Self-promotional "personal brand" pages that prioritize polish and buzzwords over substance.
- Cold, all-sans corporate minimalism with no editorial voice.
- AI-default editorial-magazine pastiche applied without reason (this page earns its serif/eyebrow system through genuine editorial content).

## Non-goals

- **Dark mode.** Light only is a deliberate choice, not a backlog item.
- **Engagement mechanics.** No comments, no reactions, no share buttons, no newsletter interstitial, no analytics theater.
- **Growth surface.** No CTAs, no "Get started", no exclamation points, no emoji.
- **A CMS-shaped site.** Notion is a writing tool; the site is a static build. Nothing should require a server at request time.
