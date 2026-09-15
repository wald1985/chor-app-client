/// <reference types="vite/client" />

// Vite's own ImportMetaEnv/ImportMeta are `interface`s so env vars can be
// added via declaration merging — a `type` alias can't merge the same way.
/* eslint-disable @typescript-eslint/consistent-type-definitions */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}
/* eslint-enable @typescript-eslint/consistent-type-definitions */
