# DentoBees Admin: frontend

Next 16 + React 19. The look is copied exactly from the internal sales CRM
(`dentobees-crm/frontend`): `src/app/globals.css` above the "DentoBees Admin
additions" line is verbatim, fonts are Montserrat + Raleway. No Tailwind, no
component library.

## Run

```bash
pnpm install
pnpm dev:mock     # fixture data, no backend needed → http://localhost:3100
pnpm dev          # proxies /api/* to the Rust admin-api (ADMIN_API_ORIGIN, default http://localhost:4100)
pnpm test         # vitest
pnpm typecheck
pnpm build
```

In mock mode every screen shows a yellow "Fixture data" strip.

## Where things are

| Path | What |
|---|---|
| `src/lib/types.ts` | API contract the backend implements (replace with generated OpenAPI types later) |
| `src/lib/api.ts` | fetch wrapper; same-origin `/api`, `x-admin-request: 1` header on mutations |
| `src/lib/mock.ts` | fixture data for `dev:mock` |
| `src/app/(app)/layout.tsx` | shell: sidebar, topbar, ☰ drawer under 1024px |
| `src/app/(app)/overview` | Monday page (snapshot numbers) |
| `src/app/(app)/clinics` + `src/components/clinic-drawer.tsx` | live list + detail drawer (`?open=<id>`) |
| `src/components/control-modal.tsx` | suspend / wallet billing / internal tag (reason required, audited) |
| `src/app/(app)/{users,audit,staff}` | CRM Users, Audit log, Staff (founder only) |

Approved features: `../docs/DentoBees-Admin-Features.pdf`.

## Test note

Tests mock `@/lib/api` with a spy that only records calls and a plain function
that returns the promise. A vitest 2.1 spy that itself returns a rejected
`Error` promise fails the test even when the component handles the rejection.
