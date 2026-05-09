/*
 * Tokens + global element styles for the UI kit. Mirrors a subset of
 * ../../colors_and_type.css for prototype self-containment.
 *
 * NOTE: this is a third copy of the tokens (after src/styles/globals.css and
 * design-system/colors_and_type.css) and is NOT covered by the
 * `npm run check:design-tokens` drift check. Update by hand if tokens change.
 */
const TOKENS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Lato:wght@400;700&display=swap');

:root {
  --font-serif: 'EB Garamond', Georgia, serif;
  --font-sans:  'Lato', -apple-system, system-ui, sans-serif;
  --font-mono:  Consolas, Monaco, 'Andale Mono', monospace;

  --background: #f0f2f5;
  --foreground: #2c333a;
  --primary: #5a7684;
  --primary-foreground: #f0f2f5;
  --secondary: #e3e7eb;
  --muted: #e8eaed;
  --muted-foreground: #4a5560;
  --accent: #749ca8;
  --accent-bold: #c17f59;
  --border: #d1d5db;
  --card: #ffffff;

  --content-max: 680px;
  --resume-max: 960px;
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  background: var(--background);
  color: var(--foreground);
  font-size: 18px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
body::after {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.025;
  pointer-events: none;
  z-index: 9999;
}

a { color: inherit; text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
    transition: color 150ms var(--ease-out), border-color 200ms var(--ease-out); }
a:hover { color: var(--accent); border-bottom-color: var(--accent); }
a.no-underline, .no-underline a { border-bottom: none; }

h1,h2,h3,h4,h5,h6 { font-family: var(--font-serif); margin: 0; line-height: 1.3; }
p { margin: 0 0 1.5em 0; line-height: 1.7; }
p:last-child { margin-bottom: 0; }

.section-label {
  font-family: var(--font-sans);
  font-size: 12px; font-weight: 600;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--accent);
}
.section-heading {
  font-family: var(--font-serif);
  font-size: 32px; font-weight: 500;
  line-height: 1.2;
  margin: 4px 0 8px 0;
}
.section-subtitle {
  font-family: var(--font-sans);
  font-size: 16px; color: var(--muted-foreground);
  margin: 0 0 24px 0;
}
.section-rule {
  width: 100%; height: 1px; border: none;
  border-top: 1px solid rgba(209,213,219,0.5);
  margin: 24px 0;
}

.resume-section-heading {
  font-family: var(--font-sans);
  font-size: 14px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--muted-foreground);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  margin: 0 0 12px 0;
}
`;

function Tokens() {
  return <style dangerouslySetInnerHTML={{ __html: TOKENS_CSS }} />;
}

window.Tokens = Tokens;
