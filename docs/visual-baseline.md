# Visual Baseline: Spacing & Alignment

This repo favors a single horizontal padding utility (`content-x`) for all page and overlay shells. The following Playwright setup provides a lightweight baseline to verify spacing at key breakpoints.

## Setup

1. Start the dev server locally (any port):

   ```bash
   npm run dev
   ```

2. In a separate terminal, install Playwright and browsers:

   ```bash
   npm i -D @playwright/test
   npx playwright install
   ```

3. Run tests:

   ```bash
   npx playwright test
   ```

## What We Verify

- Public pages (`/login`, `/signup`) render an outer shell with `content-x content-y`.
- At ~390px viewport, computed `padding-inline` is the mobile value.
- At ≥1024px viewport, `padding-inline` increases (i.e., desktop value ≥ mobile value).

These checks catch accidental regressions like re‑adding hardcoded `px-*` at the page shell or removing `content-x` from overlays.

## Notes

- Authenticated pages are not included to keep the baseline simple. If you want to expand coverage to dashboard/data pages, wire up a login helper and assert the same invariants.
- The tests do not hardcode pixel numbers — they assert relative change across breakpoints, so they remain stable if the design token (`--spacing`) changes.

