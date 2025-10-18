# Baby Growth（宝宝生长跟踪）

A minimal growth-tracking app with theming and i18n.

## Getting Started

```bash
npm run dev
```

Then open http://localhost:3000

## Features
- SSR-safe theming with palettes; login/signup forced to Default palette
- i18n dictionaries + LanguageProvider + SSR titles
- Account pages with avatar cropper and delete-account flow

## Structure
- `components` – UI and providers

## Data deletion
- Deleting a baby removes its measurements (`BabyData`) automatically via DB cascades (`prisma/schema.prisma`:31, 48). Use `DELETE /api/babies/[id]` (`app/api/babies/[id]/route.ts`) to delete.
- Deleting an account removes the user and all related data (babies + baby data) via cascades; avatar files under `public/avatars/<userId>` are also removed best‑effort. Use `DELETE /api/account` (`app/api/account/route.ts`).
