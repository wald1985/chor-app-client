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
- **Mobile-first** layout: build for the smallest screen first, then use
  Bootstrap's grid/breakpoints to progressively enhance for larger ones.
- **No axios.** Use/extend the project's own fetch-based HTTP utility
  instead (base URL, JSON handling, typed responses, normalized errors,
  timeout/abort, hook for future auth-header injection). Do not add axios
  as a dependency.

Bundler, package manager, lint/test setup: still **not decided/scaffolded**
as of 2026-09-15 — check `package.json` and this file again once that's
done, and update this section.

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
above and ADR 0001. Folder structure, component patterns, and testing
setup are **not established yet**. Update this section once decided rather
than inventing conventions ad hoc.
