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
  This repo has no OpenSpec install of its own; once
  `../chor-app-docs` is registered as OpenSpec store `chor-app`
  (see its AGENTS.md), you can also run
  `openspec show <name> --store chor-app` from here.
- `../chor-app-server` — the backend API this frontend consumes.

## Stack & tooling
React + TypeScript. Bundler, package manager, lint/test setup: **not yet
decided/scaffolded as of 2026-09-15** — check `package.json` and this file
again once that's done, and update this section.

## Domain glossary
Keep German domain terms as-is in code, types and UI copy — don't
translate them: Lied/Lieder, Vortrag, Chorprobe, Einsingen, Dirigent,
Klavierspieler, Thema/Themen, Buecher/Mappe/Neue Lieder. Full glossary in
`../chor-app-docs/openspec/config.yaml`.

## Conventions
Not established yet (folder structure, component patterns, state
management, testing). Update this section once decided rather than
inventing conventions ad hoc.
