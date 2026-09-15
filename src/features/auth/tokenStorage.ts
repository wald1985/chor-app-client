const STORAGE_KEY = "chorApp.accessToken"

export type TokenLocation = "local" | "session"

export const saveToken = (token: string, remember: boolean): void => {
  clearToken()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(STORAGE_KEY, token)
}

export const loadToken = (): {
  token: string
  location: TokenLocation
} | null => {
  const local = localStorage.getItem(STORAGE_KEY)
  if (local) return { token: local, location: "local" }

  const session = sessionStorage.getItem(STORAGE_KEY)
  if (session) return { token: session, location: "session" }

  return null
}

export const clearToken = (): void => {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}
