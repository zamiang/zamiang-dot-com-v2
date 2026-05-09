# Brennan Moore Design System

This folder is a self-contained design system extracted from the live site, intended to live alongside the source as documentation.

## Contents

- `README.md` — full design system spec (palette, type, layout, content, iconography)
- `colors_and_type.css` — design tokens (matches `src/styles/globals.css` :root block)
- `SKILL.md` — Agent SKILL frontmatter for use with Claude Code
- `preview/` — small HTML cards showcasing each token / component
- `assets/` — logos, favicons, reference photography
- `ui_kits/website/` — interactive React recreation of the homepage / post / photos screens

## Status

The shared token values in `colors_and_type.css` are kept in sync with the repo's `:root` block in `src/styles/globals.css` (the canonical source). Whitespace, comments, and trailing-zero formatting may differ; semantic values are verified by `npm run check:design-tokens`. This folder documents and showcases the tokens; it does not introduce new values.
