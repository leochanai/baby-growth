## Spacing Convention: Unified Padding & Gaps

This repository uses a single utility class to standardize left/right padding across pages, headers, and overlays.

### Scope
- Applies to all page-level containers, top bars, section wrappers, and modal/dialog bodies and footers.
- Does not automatically apply to low‑level UI atoms (e.g., `Button`, `Input`) or to card internals unless explicitly stated.

### Rationale
Using one utility makes layout alignment consistent and future changes cheap: change one rule, update site‑wide spacing.

### Utilities
- `content-x` — container left/right padding
  - Mobile: `padding-inline: calc(var(--spacing) * 4)`
  - ≥ `lg`: `padding-inline: calc(var(--spacing) * 6)`
- `content-y` — container top/bottom padding
  - Mobile: `padding-block: calc(var(--spacing) * 4)`
  - ≥ `lg`: `padding-block: calc(var(--spacing) * 6)`
- `stack-y` — vertical rhythm between large blocks (applies to flex/grid via `gap`)
  - Mobile: `gap: calc(var(--spacing) * 6)`
  - ≥ `lg`: `gap: calc(var(--spacing) * 8)`
- `cluster-gap` — gap between items in card rows/grids (applies via `gap`)
  - Mobile: `gap: calc(var(--spacing) * 4)`
  - ≥ `lg`: `gap: calc(var(--spacing) * 5)`

### Where To Use
- Page shells: wrap the main content region.
  - Example: `<div className="content-x content-y">…</div>`
- Top headers: already applied in `components/site-header.tsx`.
- Dialogs/Modals:
  - Header: `DialogHeader` includes `content-x`.
  - Footer: `DialogFooter` includes `content-x`.
  - Body: wrap dialog body with `<div className="content-x …">` and add `content-y` if needed.
- Dashboard/Babies/Settings/Account pages: outer content container should use `content-x`.
  - Stacking between sections: prefer `stack-y`.
  - Card rows/grids: prefer `cluster-gap`.

### Where Not To Use
- Nested components that already have their own horizontal padding (e.g., `CardContent`, `Table` cells) unless you need an outer alignment wrapper.
- Inside containers that are intentionally full‑bleed.

### Migration Rules
- Replace ad‑hoc classes like `px-4 lg:px-6`, `px-5`, `px-5 pt-5`, `px-5 pb-5` on page/section/dialog containers with `content-x` (+ any vertical padding).
- Replace common `py-4 lg:py-6` with `content-y`.
- Replace one-off `gap-*` for page section stacks with `stack-y` and for card grids with `cluster-gap`.
- Prefer `content-x` for any new page‑level or overlay‑level containers.

### Examples
- Page container
  - Before: `<div className="p-4 lg:p-6">…`
  - After:  `<div className="content-x py-4 lg:py-6">…`
- Dialog body
  - Before: `<div className="px-5 pb-5">…`
  - After:  `<div className="content-x pb-5">…`
- Header
  - Already: `components/site-header.tsx` uses `content-x`.

### Checklist for PRs
- [ ] New pages/sections use `content-x` for horizontal padding.
- [ ] Dialog Header/Body/Footer respect this convention.
- [ ] No new `px-4 lg:px-6` (or similar hardcoded) classes at page/section level.

### Notes
- The spacing scale leverages Tailwind v4 design tokens (`--spacing`). If we need to tune site‑wide padding, change only the `.content-x` rule in `app/globals.css`.
