# Astro 5 → 6 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `astro` from 5.18.1 to 6.3.1 (and `@astrojs/react` from 4.4.2 to 5.0.4) on the personal homepage at `www.zamiang.com`, with no behavior or visual regressions.

**Architecture:** Single-PR dependency bump. The codebase is already on the modern paths Astro 6 requires (Content Layer API via custom `notionLoader`, `astro:env/server`, no removed APIs, no custom adapter, static output to Cloudflare Pages, Node 24). Risk is limited to (a) Vite 7 transitive bump affecting Tailwind v4 / Vitest, (b) image-service default changes (cropping enabled, no upscaling), and (c) markdown heading-id behavior change (trailing hyphens preserved). We verify each via the existing test suite plus a manual visual pass against a baseline screenshot set captured before the upgrade.

**Tech Stack:** Astro 6, React 19, Tailwind v4 (Vite plugin), Vite 7 (transitive), Vitest 4, TypeScript 5.9, Node 24, Cloudflare Pages, Notion Content Layer loader.

---

## Pre-flight: Environment & Baselines

### Task 0: Create upgrade branch and capture baselines

**Files:**
- Create: `tmp/baseline-screenshots/` (gitignored, throwaway)
- Create: `tmp/baseline-build.log` (gitignored, throwaway)

- [ ] **Step 1: Confirm clean working tree on `main`**

Run:
```bash
git status
git rev-parse --abbrev-ref HEAD
```
Expected: working tree clean, branch `main`. If not clean, stop and surface to user.

- [ ] **Step 2: Create upgrade branch**

Run:
```bash
git checkout -b upgrade/astro-6
```

- [ ] **Step 3: Verify Node ≥ 22.12**

Run:
```bash
node --version
```
Expected: `v22.12.0` or higher (Astro 6 requirement). The project's `engines.node` is `24.x`; current dev is `v24.4.1`. If lower, abort and tell user to update Node.

- [ ] **Step 4: Run baseline checks on Astro 5 and capture pass/fail state**

Run each and save status to memory (do not commit logs):
```bash
npm ci
npm run check
npm run check:design-tokens
npm run typecheck
npm run lint
npm test
NOTION_TOKEN= NOTION_DATA_SOURCE_ID= NOTION_PHOTOS_DATA_SOURCE_ID= npm run build 2>&1 | tee /tmp/baseline-build.log
```
Expected: all pass. The build will produce 0 collection entries without Notion env vars but should still complete and emit static pages for non-collection routes (`/`, `/rss.xml`, etc.). Note any pre-existing failures so we don't blame them on Astro 6.

- [ ] **Step 5: Capture visual baseline screenshots of preview server**

Start preview server in background:
```bash
npm run preview &
PREVIEW_PID=$!
sleep 3
```

Capture screenshots of these routes using the `browse` skill (or `gstack` if invoked manually):
- `/` (homepage)
- `/writing/debugging-a-live-saturn-v` (one writing post — ToC + content)
- `/rss.xml` (validate XML loads)
- `/feed.json` (validate JSON loads)

Save screenshots to `tmp/baseline-screenshots/{home,post,rss,feed}.png`. These are throwaway references for visual diffing later — do not commit.

Stop preview:
```bash
kill $PREVIEW_PID
```

- [ ] **Step 6: Add tmp/ to .gitignore if not already**

Verify `tmp/` is ignored:
```bash
git check-ignore tmp/baseline-screenshots/home.png || echo "NOT IGNORED"
```
If `NOT IGNORED`, add `tmp/` to `.gitignore` and commit:
```bash
echo "tmp/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore tmp/ scratch directory"
```

---

## Phase 1: Run the official upgrade

### Task 1: Use `@astrojs/upgrade` to bump Astro and integrations

**Files:**
- Modify: `package.json` (versions of `astro`, `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/check`)
- Modify: `package-lock.json` (regenerated)

- [ ] **Step 1: Run the upgrade tool**

Run:
```bash
npx @astrojs/upgrade
```
Expected: tool detects `astro@5.18.1`, `@astrojs/react@4.4.2`, `@astrojs/sitemap@3.7.2`, `@astrojs/rss@4.0.18`, `@astrojs/check@0.9.9` and proposes upgrades. Accept all. The tool updates `package.json` and runs `npm install`.

If the tool offers to apply codemods, accept them. They're idempotent and cover known mechanical migrations (e.g. `<ViewTransitions />` → `<ClientRouter />`). This codebase shouldn't have any matches but accept anyway as a safety net.

- [ ] **Step 2: Verify resulting versions**

Run:
```bash
node -e "const p=require('./package.json'); console.log(p.dependencies.astro, p.dependencies['@astrojs/react'], p.dependencies['@astrojs/sitemap'], p.dependencies['@astrojs/rss'], p.devDependencies['@astrojs/check']);"
```
Expected: `astro` is `^6.x` (currently 6.3.1), `@astrojs/react` is `^5.x` (currently 5.0.4). `@astrojs/sitemap@3.7.2`, `@astrojs/rss@4.0.18`, `@astrojs/check@0.9.9` may remain unchanged — they are the latest published versions and have no Astro peer dep declared, so they continue to work with Astro 6.

If the tool downgrades anything or pins to an older minor, manually edit `package.json` to use the latest known-good majors and re-run `npm install`.

- [ ] **Step 3: Verify Vite 7 is now installed transitively**

Run:
```bash
npm ls vite | head -5
```
Expected: `vite@7.x.x` somewhere in the tree (Astro 6 requires Vite 7). If still on Vite 6, the upgrade did not fully resolve — run `npm install` again or escalate.

- [ ] **Step 4: Commit the dependency bump on its own**

Run:
```bash
git add package.json package-lock.json
git commit -m "chore(deps): upgrade astro to v6 and @astrojs/react to v5"
```

A standalone dependency commit makes the diff trivial to review and easy to revert if subsequent verification fails.

---

## Phase 2: Verify type-checks, tests, and build pass

### Task 2: Astro type check (`astro check`)

**Files:**
- None (read-only verification)

- [ ] **Step 1: Run `npm run check`**

Run:
```bash
npm run check
```
Expected: 0 errors, 0 warnings.

If errors appear, expect them to be in one of these categories:
- **Removed API usage** — none present in this codebase per pre-flight survey, but `astro check` will catch any stragglers.
- **`astro:env/server` schema** — config uses `envField` correctly; should be unaffected.
- **`astro:content` types** — Content Layer API is already in use; no `entry.slug` / `entry.render()` legacy patterns to fix.

If you hit an error, do **not** band-aid it. Read the error, find the file, fix the underlying issue with the smallest viable change, and re-run.

- [ ] **Step 2: Run `npm run typecheck`** (separate non-Astro tsc pass)

Run:
```bash
npm run typecheck
```
Expected: 0 errors. Per `CLAUDE.md` this is intentionally separate because `tsc` cannot resolve Astro virtual modules.

- [ ] **Step 3: Commit only if you had to fix anything**

If the two checks passed without changes, skip this step. Otherwise:
```bash
git add -p   # stage only the fixes
git commit -m "fix: resolve astro 6 type errors"
```

### Task 3: Lint and design-token mirror check

**Files:**
- None (read-only verification)

- [ ] **Step 1: Run lint**

Run:
```bash
npm run lint
```
Expected: 0 errors, 0 warnings (`--max-warnings=0` is set in the script).

`eslint-plugin-astro@1.7.0` and `typescript-eslint@8.x` are both Astro-version-agnostic, so no failures expected. If `eslint-plugin-astro` complains about a parser version, bump it to its latest minor and re-run.

- [ ] **Step 2: Run design-token mirror check**

Run:
```bash
npm run check:design-tokens
```
Expected: pass. This compares `src/styles/globals.css` with `design-system/colors_and_type.css`. Astro 6 doesn't touch CSS handling beyond Vite 7's CSS pipeline; no expected change.

- [ ] **Step 3: Commit lint fixes if any**

```bash
git add -p
git commit -m "chore: lint cleanup for astro 6"
```

Skip if no fixes were needed.

### Task 4: Test suite (Vitest + RTL)

**Files:**
- Possibly modify: snapshot files under `__tests__/**/__snapshots__/*.snap` (only if intentional output changed)

- [ ] **Step 1: Run the full test suite**

Run:
```bash
npm test
```
Expected: all tests pass.

`vitest@4.1.5` already supports Vite 7 (Vitest 4 requires Vite ≥ 6). `@vitejs/plugin-react@5.x` likewise. If tests break, the most likely causes (in order of probability) are:

1. **Snapshot drift from heading-id change** — Astro 6 no longer strips trailing hyphens from markdown heading IDs. If a snapshot includes a heading like `<Picture />`, the id flips from `picture` to `picture-`. Verify visually in the rendered output, then refresh the snapshot.
2. **Date/timezone regex test** — pre-existing flakiness, not Astro 6. Per `CLAUDE.md`, use regex assertions like `/Aug (19|20), 2023/`.
3. **`vi.mocked()` typing** — should be stable; if a mock breaks, check whether the underlying source file's exported shape changed.

- [ ] **Step 2: Refresh snapshots only if the output change is genuinely intentional**

For each failing snapshot, **read the diff first**. Only run the update if the new output is correct.

```bash
npm test -- -u
```

Then re-run without `-u` to confirm:
```bash
npm test
```
Expected: all green.

- [ ] **Step 3: Commit snapshot updates separately**

```bash
git add __tests__
git commit -m "test: refresh snapshots for astro 6 heading-id behavior"
```

Skip if no snapshots changed.

### Task 5: Production build

**Files:**
- None (read-only verification; `dist/` is gitignored)

- [ ] **Step 1: Run a real build with Notion env vars**

Source local env (the user maintains a `.env` or shell exports for Notion creds — do not commit them):
```bash
npm run build
```
Expected:
- Build completes without errors.
- All collection entries (posts, vbcPosts, photos) are fetched from Notion and emitted as static HTML.
- Page count is similar to the previous build (per the original Astro-port commit message: ~34 pages; current main may differ).

If you don't have Notion credentials available, fall back to the env-less build used in pre-flight and accept that collection routes will be empty:
```bash
NOTION_TOKEN= NOTION_DATA_SOURCE_ID= NOTION_PHOTOS_DATA_SOURCE_ID= npm run build
```

The non-collection routes (`/`, `/rss.xml`, `/feed.json`, `/404`) must still build cleanly. Compare the page count and warnings output against `tmp/baseline-build.log` from pre-flight.

- [ ] **Step 2: Inspect build output for surprises**

Run:
```bash
ls dist/ && du -sh dist/
```
Expected: similar size and structure to pre-upgrade. A large size delta (>20%) is a smell — investigate before continuing.

- [ ] **Step 3: No commit for this task** (verification only).

---

## Phase 3: Verify behavioral changes that Astro 6 introduces

### Task 6: Verify image cropping default change

**Context:** Astro 6 enables image cropping by default and never upscales in the default Sharp service. The site uses local images in `public/images/` and Notion-downloaded covers, with `image.service` set to Sharp in `astro.config.mjs`.

**Files:**
- None expected. If a regression appears, fix in the consuming `.astro` component (Card or PostLayout) by passing explicit `width`/`height`/`fit` props.

- [ ] **Step 1: Start preview against the fresh build**

```bash
npm run preview &
PREVIEW_PID=$!
sleep 3
```

- [ ] **Step 2: Visually compare home cards and a post hero against baseline**

Open or screenshot:
- `http://localhost:4321/` — verify post cards' cover images render at the same dimensions and aspect as `tmp/baseline-screenshots/home.png`.
- `http://localhost:4321/writing/debugging-a-live-saturn-v` — verify hero/cover image matches `tmp/baseline-screenshots/post.png`.

Specifically check for:
- **Cropping** — if a previously letterboxed image is now cropped tighter, decide whether the new behavior is acceptable (likely yes, it's the documented intent) or whether to opt out by passing `fit="contain"` on the consuming `<Image />` call.
- **Upscaling** — small Notion thumbnails should now refuse to upscale. If a card looks pixelated/empty, the fix is a smaller declared `width` on the `<Image />` or a `densities`/`widths` prop tuned for the intrinsic size.

- [ ] **Step 3: Stop preview**

```bash
kill $PREVIEW_PID
```

- [ ] **Step 4: Commit any image-prop fixes**

```bash
git add -p
git commit -m "fix: adjust image props for astro 6 default cropping"
```

Skip if no changes needed.

### Task 7: Verify markdown heading-id behavior

**Context:** Astro 6 stops stripping trailing hyphens from markdown heading IDs. This codebase renders post bodies through a React island (`react-markdown` + `rehype-raw`), not through Astro's built-in markdown pipeline, so most TOC anchors are unaffected. But `TableOfContents.astro` may use Astro's heading extraction if any post is migrated to `.md` later — verify now to catch surprises.

**Files:**
- Possibly modify: `src/components/TableOfContents.astro` (only if TOC anchors break)

- [ ] **Step 1: Inspect a post with multiple headings**

With `npm run preview` running, navigate to `/writing/debugging-a-live-saturn-v` and click each ToC entry. Each click should jump to the correct heading.

- [ ] **Step 2: Compare ToC anchors against baseline**

Diff the rendered HTML's ToC against `tmp/baseline-screenshots/post.png`. If the IDs are unchanged, no action.

If a heading like `## <Picture />` exists anywhere and now produces `id="picture-"` instead of `id="picture"`, the React renderer may already mirror the new behavior (or may not — check `src/components/islands/ContentRenderer*.tsx` if present). Make the ToC and the heading IDs agree, with the new (Astro 6) format as the canonical.

- [ ] **Step 3: Commit any ToC fixes**

```bash
git add -p
git commit -m "fix: update TOC slugify to match astro 6 heading-id rules"
```

Skip if not needed.

### Task 8: Verify `.md` endpoints reject trailing slashes

**Context:** Astro 6 disallows trailing slashes on endpoints with file extensions. The site has `src/pages/writing/[slug].md.ts` and `src/pages/photos/[slug].md.ts` for AI-agent consumption.

**Files:**
- None expected.

- [ ] **Step 1: Curl the endpoint without a trailing slash**

With `npm run preview` running:
```bash
curl -sI http://localhost:4321/writing/debugging-a-live-saturn-v.md | head -5
```
Expected: `HTTP/1.1 200 OK` and `content-type: text/markdown` (or `text/plain`).

- [ ] **Step 2: Curl with a trailing slash to confirm new behavior**

```bash
curl -sI http://localhost:4321/writing/debugging-a-live-saturn-v.md/ | head -5
```
Expected: 404. This is the Astro 6 change. Ensure no internal link, RSS feed, sitemap entry, or markdown-response builder emits trailing-slash variants.

- [ ] **Step 3: Grep for any code that constructs trailing-slash `.md` URLs**

Run:
```bash
grep -rn "\.md/" src/ public/ astro.config.* 2>/dev/null
```
Expected: no matches. If any appear, drop the trailing slash.

- [ ] **Step 4: Commit fixes if any**

```bash
git add -p
git commit -m "fix: drop trailing slash on .md endpoint links"
```

Skip if no matches.

### Task 9: Verify `security.checkOrigin` behavior on static output

**Context:** `astro.config.mjs` sets `security: { checkOrigin: true }`. In Astro 6 this remains opt-in for SSR but is a no-op for `output: 'static'` (no server runtime to check origins against). Confirm no warning in the build log.

**Files:**
- Possibly modify: `astro.config.mjs` (only to drop `security` block if Astro 6 emits a warning).

- [ ] **Step 1: Re-run build and grep for warnings**

```bash
npm run build 2>&1 | grep -i "security\|checkOrigin\|warn" || echo "no security warnings"
```

- [ ] **Step 2: If a deprecation/no-op warning appears, remove the block**

Edit `astro.config.mjs` and delete the `security: { checkOrigin: true },` block. Re-run `npm run build` to confirm clean output.

- [ ] **Step 3: Commit if changed**

```bash
git add astro.config.mjs
git commit -m "chore: drop no-op security.checkOrigin under static output"
```

Skip if the warning didn't appear.

---

## Phase 4: End-to-end verification

### Task 10: Full local QA pass

**Files:**
- None.

- [ ] **Step 1: Build and serve**

```bash
npm run build && npm run preview &
PREVIEW_PID=$!
sleep 3
```

- [ ] **Step 2: Walk the routes and confirm parity**

For each route, open it and confirm visual + functional parity with the baseline:

| Route | What to check |
|---|---|
| `/` | Homepage layout, post cards, photo grid, particles island |
| `/writing/<a-slug>` | Post body, ToC clicks, code block syntax highlighting, footer |
| `/photos/<a-slug>` | Photo post layout, image rendering |
| `/rss.xml` | XML validates, items present |
| `/feed.json` | JSON Feed 1.1 schema, items present |
| `/sitemap-index.xml` | Sitemap entries present |
| `/writing/<a-slug>.md` | Raw markdown content |

If anything looks off, do not paper over — go back to Phase 3 tasks 6–9 and find the cause.

- [ ] **Step 3: Confirm reduced-motion still works**

In macOS System Settings → Accessibility → Display → Reduce Motion: enable, reload `/`. Particles should not animate. Disable, reload, particles should animate. (This is project-policy from `CLAUDE.md`'s design principles.)

- [ ] **Step 4: Stop preview**

```bash
kill $PREVIEW_PID
```

- [ ] **Step 5: No commit** (verification only).

### Task 11: Update documentation

**Files:**
- Modify: `CLAUDE.md` (Tech Stack table — bump Astro version note if specified anywhere)

- [ ] **Step 1: Check `CLAUDE.md` for hardcoded version references**

Run:
```bash
grep -n "Astro 5\|astro@5\|5\\.18" CLAUDE.md
```

- [ ] **Step 2: Update any matches to "Astro 6"**

The current Tech Stack row says `Astro 5`. Edit to `Astro 6`. Update `**Last Updated**` at the bottom to today's date (`2026-05-09`).

- [ ] **Step 3: Commit doc update**

```bash
git add CLAUDE.md
git commit -m "docs: note astro 6 in tech stack"
```

### Task 12: Open PR

**Files:**
- None.

- [ ] **Step 1: Push the branch**

```bash
git push -u origin upgrade/astro-6
```

- [ ] **Step 2: Open PR with summary of behavior changes verified**

```bash
gh pr create --title "Upgrade to Astro 6" --body "$(cat <<'EOF'
## Summary
- Bumps `astro` 5.18.1 → 6.x and `@astrojs/react` 4.4.2 → 5.x.
- Vite 7 transitively. No code changes required: codebase already uses Content Layer API, `astro:env/server`, no removed APIs, no custom adapter.
- Verified image cropping default, markdown heading-id behavior, and `.md` endpoint trailing-slash behavior locally.

## Test plan
- [x] `npm run check` passes
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] `npm test` passes
- [x] `npm run build` succeeds with Notion creds; page count matches baseline
- [x] Manual route walk: `/`, `/writing/<slug>`, `/photos/<slug>`, `/rss.xml`, `/feed.json`, `/sitemap-index.xml`, `/writing/<slug>.md`
- [x] Reduced-motion respected
EOF
)"
```

Adjust the test-plan checkboxes to reflect what actually passed; do not pre-tick anything that wasn't verified.

- [ ] **Step 3: Wait for CI and Cloudflare Pages preview**

After CI is green, hand off to user for the merge decision and production verification on Cloudflare Pages.

---

## Rollback Plan

If anything goes sideways after merge:

```bash
git revert <merge-commit-sha>
git push origin main
```

Cloudflare Pages will redeploy the prior static output within ~2 minutes. There is no database, no migrations, no SSR runtime — rollback is a pure static-site redeploy.

---

## Notes for the implementer

- **Don't band-aid type errors.** If `astro check` complains, fix the real cause. The pre-flight survey (saved in `docs/superpowers/plans/2026-05-09-astro-6-upgrade.md` itself, this document) confirmed the codebase is on the modern API surface, so any error is a real signal.
- **Snapshots only update on intentional output changes.** If a snapshot diff doesn't match a documented Astro 6 change, do not run `-u` blindly — find the cause first.
- **One commit per concern.** Phase 1 dep bump is its own commit; each fix in Phase 3 is its own commit. This keeps `git bisect` useful if a regression turns up later.
- **Don't run `--no-verify`, `--force`, or `--no-gpg-sign`.** If a hook fails, fix the underlying issue.
