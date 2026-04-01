# Fitness MVP Landing

A simple MVP landing page to validate an online fitness coaching offer.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Run locally
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:3000`

## MVP scope
- Front-end landing page only
- No auth
- No backend
- No payment integration
- No dashboard/CMS
- No database

## i18n
The page language is selected from the browser `Accept-Language` header:
- `es*` -> Spanish
- `en*` -> English
- fallback -> English

## Structure
- `src/app/page.tsx`: final page composition and locale-aware content selection.
- `src/features/landing/components/*`: reusable landing sections.
- `src/features/landing/i18n/messages.ts`: all text keys and translations (`en`, `es`).
- `src/features/landing/i18n/types.ts`: typed content contract.
- `src/lib/i18n/get-request-locale.ts`: locale detection logic.
- `src/app/globals.css`: semantic tokens and reusable UI utility classes.

## Easy customization
Update only `src/features/landing/i18n/messages.ts` to edit:
- brand text
- section copy
- plans/pricing
- FAQ
- CTA labels/links
- disclaimer
- SEO title/description per language
