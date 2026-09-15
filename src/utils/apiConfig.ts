/**
 * Base URL of `chor-app-server`.
 *
 * - Dev (`vite`, vitest): `VITE_API_URL` from the local `.env`.
 * - Production build: resolved at runtime from the host the page is served
 *   from. The deploy server has no `.env` (and `.dockerignore` keeps it out
 *   of the image), so `VITE_*` vars are never available there. Register
 *   every new deployment domain in `prodApiUrls`.
 *
 * `undefined` means the current host has no API configured — the HTTP
 * client reports that as an error instead of sending requests nowhere.
 */
const devApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5050"

const prodApiUrls: Partial<Record<string, string>> = {
  "chorapp.wald.pro": "https://chorappserver.wald.pro",
}

export const apiUrl: string | undefined = import.meta.env.DEV
  ? devApiUrl
  : prodApiUrls[window.location.hostname]
