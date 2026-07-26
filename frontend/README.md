# KSP-ATHENA frontend

This is the active React 19 + TypeScript + Vite client for KSP-ATHENA.

See the [root project README](../README.md) for the complete plain-language introduction, architecture, database setup, environment variables, testing, and Catalyst deployment guide.

## Commands

```powershell
npm ci
npm run start
npm test
npm run build
```

- `npm run start` starts Vite for frontend development.
- `npm test` runs the Vitest component suite once.
- `npm run build` performs TypeScript checking and builds the Catalyst client into `frontend/build`.

The browser calls the active backend at `/server/ks_intelli_pol_function`. Use Catalyst local serving or an equivalent reverse proxy when testing API features.
