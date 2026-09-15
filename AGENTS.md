# chor-app-client — agent instructions

## What this repo is

React + TypeScript frontend for **Chor-App**, a choir repertoire/rehearsal
tracker. Talks to the API in the sibling `chor-app-server` repo.

## Sibling repos (not a monorepo — kept separate on purpose)

- `../chor-app-docs` — **specs and planning live here.** Before
  implementing any feature, read the relevant spec/proposal there:
  `openspec/specs/`, or an in-flight change under
  `openspec/changes/<change-id>/` (`proposal.md`, `design.md`, `tasks.md`).
  Full domain/product context: `../chor-app-docs/openspec/config.yaml`.
  Cross-cutting tech decisions (ADRs): `../chor-app-docs/decisions/`.
  This repo has no OpenSpec install of its own; once
  `../chor-app-docs` is registered as OpenSpec store `chor-app`
  (see its AGENTS.md), you can also run
  `openspec show <name> --store chor-app` from here.
- `../chor-app-server` — the backend API this frontend consumes.

## Stack & tooling

Decided (see `../chor-app-docs/decisions/0001-client-stack.md` for full
rationale — read it before touching state management or HTTP calls):

- **React + TypeScript.**
- **Redux Toolkit (RTK)** for client/UI state only (modals, active tab,
  in-progress form drafts, unsubmitted filters, session/auth once decided).
  Do not put server data here.
- **TanStack React Query** for all data fetched from `chor-app-server`
  (lists, Proben, Auswertung, ...), including caching/invalidation. Do not
  use RTK Query — one caching layer only, and it's React Query.
- **react-bootstrap** (Bootstrap 5 React components) for UI — not plain
  Bootstrap CSS + JS bundle. **No Tailwind CSS** — don't add it alongside
  Bootstrap; styling goes through react-bootstrap/Bootstrap only.
- **Stay as close to default Bootstrap look as possible.** Use
  react-bootstrap components with default styling; custom CSS/SCSS is the
  exception for something Bootstrap genuinely can't do, not the default
  way of building a screen. No custom design system on top.
- **Mobile-first** layout: build for the smallest screen first, then use
  Bootstrap's grid/breakpoints to progressively enhance for larger ones.
- **No axios.** Use/extend the project's own fetch-based HTTP utility
  instead (base URL, JSON handling, typed responses, normalized errors,
  timeout/abort, hook for future auth-header injection). Do not add axios
  as a dependency.

**Scaffolded 2026-09-15:** Vite + `vitest` (+ `@testing-library/react`) +
ESLint (`typescript-eslint` strict-type-checked) + Prettier
(`semi: false`, `arrowParens: "avoid"`). `npm` (see `package-lock.json`).
The repo started from the `redux-templates/redux-essentials` Vite
template; its placeholder `counter`/`quotes` features (the latter used
**RTK Query**, which ADR 0001 forbids) were removed when the first real
feature (auth) was built — don't reintroduce RTK Query.

- **Routing:** `react-router-dom` (`<BrowserRouter>`, plain `<Routes>`,
  no data-router loaders/actions — nothing needs them yet).
- **HTTP utility:** `src/lib/http/client.ts` (`httpClient.get/post`),
  `src/lib/http/httpError.ts` (`HttpError`, `getErrorMessage`). Auth-header
  injection: module-level `setAuthToken(token | null)`, called by
  `authSlice` whenever the session's token changes — the HTTP client has
  no direct dependency on Redux.

## Implemented so far

- **Auth** (`src/features/auth/`): register, login, forgot/reset password,
  change password, session bootstrap-from-storage. Matches
  `chor-app-server`'s `identity/registration-and-login` and
  `identity/password-management` capabilities
  (`../chor-app-docs/openspec/specs/identity/`) and
  `decisions/0004-auth-mechanism.md`.
  - `authSlice.ts` owns session state (`status`, `user`, `memberships`,
    `remember`) per ADR 0001 ("session/auth info" is RTK's job). Actions
    that don't establish/change a session (register, forgot-password) call
    `authApi` directly from the page instead of going through the slice —
    don't route every API call through Redux, only ones that affect the
    session.
  - **Token storage** (`tokenStorage.ts`): `localStorage` if the user
    checked "Angemeldet bleiben" (remember me) at login/reset, otherwise
    `sessionStorage`. Only one of the two ever holds the token at a time.
  - Changing/resetting a password returns a **new** token
    (`chor-app-server`'s `tokenVersion` invalidation) — always persist the
    fresh token via the same mechanism (`saveToken`/`setAuthToken`), never
    assume the old one still works.
  - `RequireAuth`/`RequireGuest` (`components/`) gate routes on
    `authSlice`'s status; both show a spinner while `bootstrap()` (session
    restore from storage) is still resolving.
- No Community-scoped feature exists yet, so there's no "active Community"
  switcher — `HomePage` just lists the memberships login/me returned.

## Deployment & CI/CD
See `../chor-app-docs/decisions/0005-deployment-and-cicd.md` for full
rationale. Summary:
- `Dockerfile`: builds the Vite app, serves it via `nginx:alpine`
  (`nginx.conf` has the SPA fallback to `index.html` client-side routing
  needs). `VITE_API_URL` is a **required** build `ARG` — Vite bakes
  `VITE_*` vars in at build time, so it can't be supplied later at
  container-run time; the build fails loudly if it's missing rather than
  silently shipping a bundle pointed at `localhost`.
- `.github/workflows/ci.yml` — lint/format-check/type-check/test/build,
  every push and PR, no secrets. No deploy-to-server job exists yet for
  this repo (unlike `chor-app-server`) — needs a target host decision
  first, see the ADR's open follow-ups.
- `.dockerignore` excludes `.env` — never let it land in an image layer.

## Language: German UI, English code

**The target UI/UX is German** (the audience — a German-speaking choir).
**The domain model and all code are English** — component/prop/type
names, state, API calls. Never put German identifiers in code; German
only appears as UI copy strings. Full German<->English mapping:
`../chor-app-docs/glossary.md` (e.g. Vortrag -> Performance, Chorprobe ->
Rehearsal, Dirigent -> Conductor, Mappe -> Folder). This supersedes an
earlier "keep German in code" instruction from initial setup.

Localization mechanism (hardcoded German strings vs. an i18n layer like
react-i18next for future multi-language support) is **not decided** —
check `package.json` and this file again once it is.

## Conventions

State-management split (RTK vs React Query) is decided — see Stack section
above and ADR 0001.

**Folder structure**, established with the auth feature:

- `src/features/<name>/` — one folder per feature: slice, API calls,
  types, and that feature's own `pages/` and `components/` subfolders.
- `src/pages/` — top-level/route pages that aren't tied to one feature
  (e.g. `HomePage`).
- `src/lib/` — framework-agnostic utilities usable by any feature (the
  HTTP client lives here, per ADR 0001's suggested location).
- `src/app/` — store, typed hooks (`useAppDispatch`/`useAppSelector` —
  always use these, never the raw `react-redux` hooks, enforced by
  `no-restricted-imports` in `eslint.config.js`), and cross-feature
  wiring.

**Component patterns:**

- Slices use the `createAppSlice`/`create.asyncThunk` pattern
  (`src/app/createAppSlice.ts`), not a separate `createAsyncThunk` +
  `extraReducers`.
- A page owns its own form state (`useState`) and submits via either an
  `authSlice` thunk (`dispatch(...).unwrap()`) or a direct `*Api` call,
  per the "does this change the session" rule above. No form library in
  use yet — plain controlled inputs are enough for the forms so far;
  reconsider only if a form gets complex enough to justify one.
- React 19's `@types/react` deprecates `FormEvent`/`FormEventHandler` for
  a `<form onSubmit>` — use `SubmitEvent` instead.

**Testing:** `vitest` + `@testing-library/react`, jsdom environment.
`src/utils/test-utils.tsx`'s `renderWithProviders` wraps a component with
a real (or `preloadedState`-seeded) Redux store — use it instead of
importing `Provider` directly in tests.
