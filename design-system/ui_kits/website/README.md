# UI Kit — zamiang.com Personal Site

A high-fidelity recreation of [www.zamiang.com](https://www.zamiang.com), the personal site of Brennan Moore, distilled from `zamiang/zamiang-dot-com-v2` (Astro 5 + React 19 islands + Tailwind 4).

## Files

| File | What it is |
| --- | --- |
| `index.html` | The entry — boots React + Babel and renders an interactive recreation of the homepage, a blog post detail, and a photos index. Includes a top "View" tab strip so you can jump between screens. |
| `Tokens.jsx` | Inline `<style>` injection of the design tokens + global element styles (mirrors `colors_and_type.css`). |
| `Chrome.jsx` | `Header`, `Footer`, `NoiseOverlay`, `SectionWrapper` — the shared page chrome. |
| `Cards.jsx` | `PostCard`, `PhotoCard`, `WorkCard`, `SeriesPostCard`, `Tagline` — the small reusable surfaces. |
| `Screens.jsx` | `HomeScreen`, `PostScreen`, `PhotosScreen` — the three click-thru screens. |

## What is faked

Routing is mocked — links work between the three screens via local state, and external links are inert. The Notion CMS is replaced by a hand-written `data.js` in the `Screens` file. The floating-particles canvas is omitted (it's decorative; the noise overlay carries the texture).
