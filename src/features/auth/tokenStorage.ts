export type TokenType = "user" | "admin"

const STORAGE_KEYS: Record<TokenType, string> = {
  user: "chorApp.accessToken",
  admin: "chorApp.admin.accessToken",
}

export type TokenLocation = "local" | "session"

export const saveToken = (
  token: string,
  remember: boolean,
  type: TokenType = "user",
): void => {
  clearToken(type)
  const key = STORAGE_KEYS[type]
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(key, token)
}

export const loadToken = (
  type: TokenType = "user",
): {
  token: string
  location: TokenLocation
} | null => {
  const key = STORAGE_KEYS[type]
  const local = localStorage.getItem(key)
  if (local) return { token: local, location: "local" }

  const session = sessionStorage.getItem(key)
  if (session) return { token: session, location: "session" }

  return null
}

export const clearToken = (type: TokenType = "user"): void => {
  const key = STORAGE_KEYS[type]
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}
