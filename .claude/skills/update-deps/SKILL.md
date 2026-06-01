---
name: update-deps
description: Use when running the weekly dependency + security maintenance pass for this repo — bumping npm packages, resolving `npm audit` vulnerabilities, or when the user asks to update dependencies, fix security issues, or run /update-deps. Project-specific (Astro blog).
---

# update-deps

## Overview

Weekly maintenance pass: apply **safe** dependency updates (patch/minor) and security
fixes that keep CI green, open a PR, and **list major/breaking updates separately** for
the human to decide — never apply majors automatically.

**Core principle:** Green CI before commit. Every change must pass the full verification
pipeline (`check`, `typecheck`, `lint`, `test`, `build`) or it gets reverted, not shipped.

## When to Use

- Weekly dependency hygiene run (the intended cadence)
- `npm audit` reports vulnerabilities
- User says "update deps", "fix security issues", "run /update-deps"

**Not for:** a specific targeted upgrade with known breaking changes (do that by hand),
or non-Node projects.

## Workflow

Work through these as TodoWrite items. Do NOT skip the verification step.

### 1. Branch

```bash
git checkout main && git pull --ff-only
git checkout -b deps/update-$(date +%Y-%m-%d)
```
Abort if the working tree is dirty — never mix maintenance with uncommitted work.

### 2. Survey

```bash
npm outdated || true          # exit code is non-zero when anything is outdated; that's fine
npm audit                     # full report (includes devDeps)
npm audit --audit-level=high --production   # the repo's own gate (`audit-dependencies`)
```
**This repo pins exact versions** (no `^`/`~` in `package.json`). Consequences:
- `npm outdated`'s `Wanted` always equals `Current`. Classify using **`Current`→`Latest`**
  and read the semver yourself: same major = safe (patch/minor), major bump = **defer**.
- `npm update` is a **no-op** — there are no ranges to move within. Do not rely on it.
- Many `npm audit` findings live in **devDependencies** (e.g. the `@astrojs/check`
  language-server toolchain). The repo's gate is `--production`; a clean production audit
  with moderate dev-only findings is an acceptable end state — note them, don't force them.

### 3. Apply safe updates

Because versions are exact-pinned, bump them by **editing `package.json`** to the safe
`Latest` (same-major only), then reinstall:
```bash
# edit the pinned version string for each safe package, e.g. astro 6.3.3 -> 6.4.2
npm install                   # rewrites package-lock.json to match
```
Do this in **small batches** (e.g. group related packages) so a failure in step 4 is easy
to localize. For security fixes the version bump doesn't reach, try the non-breaking fix:
```bash
npm audit fix                 # NEVER --force here; --force pulls breaking changes
```
If a vuln only has a `--force` (breaking) fix, do NOT apply it — record it for the deferred
list in step 6. For a transitive-dep vuln, prefer pinning a safe floor in the `overrides`
block of `package.json` over force-upgrading a direct dependency.

### 4. Verify (gate — do not skip)

Run the full pipeline. All must pass:
```bash
npm run check && npm run typecheck && npm run lint && npm run test && npm run build
```
If anything fails:
1. Identify the offending package from the diff.
2. Try to fix forward only if it's a trivial, obvious adjustment.
3. Otherwise revert that single package to its prior version (edit `package.json` +
   `npm install`) and move it to the deferred list. Keep the rest of the green updates.
Re-run the full pipeline until clean. **A red pipeline never gets committed.**

Also run `npm run format` so the lockfile/JSON changes match house style, then re-stage.

### 5. Commit & PR

```bash
git add package.json package-lock.json
git commit -m "chore(deps): weekly dependency + security update"
git push -u origin HEAD
gh pr create --fill --title "chore(deps): weekly dependency + security update"
```
End the commit message body with the Co-Authored-By line per repo convention.

### 6. PR body — report honestly

The PR description MUST contain three sections so the human can review at a glance:

- **Applied (passed CI):** package — old → new, one line each.
- **Security resolved:** which `npm audit` advisories are now gone (re-run `npm audit`
  to confirm the count dropped; quote before/after).
- **Deferred (needs a human):** every major bump and every `--force`-only vuln, with the
  reason (breaking change / requires code update). Do NOT silently drop these — an
  unlisted major reads as "fully up to date" when it isn't.

If `npm audit` still shows vulnerabilities after the safe pass, say so explicitly and
explain why each remaining one wasn't auto-fixable.

## Quick Reference

| Step | Command | Notes |
|------|---------|-------|
| Survey | `npm outdated`, `npm audit` | use `Current`→`Latest`; `Wanted` is stale (exact pins) |
| Safe bump | edit version in `package.json` + `npm install` | `npm update` is a no-op here; same-major only |
| Safe sec fix | `npm audit fix` | **never** `--force`; dev-only findings may be fine |
| Gate | `check && typecheck && lint && test && build` | all must pass |
| Format | `npm run format` | match house style before commit |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running `npm audit fix --force` to clear the count | Breaking changes sneak in. Defer to a human-reviewed list instead. |
| Committing with a red pipeline "to fix later" | Revert the offending package; ship only green updates. |
| Applying a major because "tests still pass" | Majors are deferred by policy regardless — they need human judgment. |
| Dropping deferred majors from the PR body | Always list them; silence implies fully-updated. |
| Forcing a transitive-dep upgrade | Prefer pinning via the `overrides` block in package.json. |
| Mixing this with other uncommitted work | Run only on a clean main; abort otherwise. |
