import type { BookView } from "../types/catalog.types"

export type CopiedBookRecord = {
  bookId: string
  title: string
  seriesTitle: string | null
  volume: number | null
  songCount: number
  copiedAt: string
  songs: {
    id: string
    number: string
    title: string
    author: string | null
    arranger: string | null
    themes: { id: string; name: string }[]
  }[]
}

const STORAGE_KEY_PREFIX = "chor_app_community_repertoire_"

export const getCommunityRepertoireStorageKey = (communityId: string): string =>
  `${STORAGE_KEY_PREFIX}${communityId}`

export const getCopiedBooks = (communityId: string): CopiedBookRecord[] => {
  if (!communityId) return []
  try {
    const raw = sessionStorage.getItem(
      getCommunityRepertoireStorageKey(communityId),
    )
    if (!raw) return []
    return JSON.parse(raw) as CopiedBookRecord[]
  } catch {
    return []
  }
}

export const getCopiedBookIds = (communityId: string): Set<string> => {
  const books = getCopiedBooks(communityId)
  return new Set(books.map(b => b.bookId))
}

export const isBookCopiedToCommunity = (
  communityId: string,
  bookId: string,
): boolean => {
  if (!communityId || !bookId) return false
  const ids = getCopiedBookIds(communityId)
  return ids.has(bookId)
}

export const copyBookToCommunity = (
  communityId: string,
  book: BookView,
): CopiedBookRecord => {
  const existing = getCopiedBooks(communityId)
  const filtered = existing.filter(b => b.bookId !== book.id)

  const newRecord: CopiedBookRecord = {
    bookId: book.id,
    title: book.title,
    seriesTitle: book.series?.title ?? null,
    volume: book.volume,
    songCount: book.songs.length,
    copiedAt: new Date().toISOString(),
    songs: book.songs.map(s => ({
      id: s.id,
      number: s.number,
      title: s.title,
      author: s.author,
      arranger: s.arranger,
      themes: s.themes.map(t => ({ id: t.id, name: t.name })),
    })),
  }

  filtered.push(newRecord)
  try {
    sessionStorage.setItem(
      getCommunityRepertoireStorageKey(communityId),
      JSON.stringify(filtered),
    )
  } catch (error) {
    console.error("Failed to save copied book to sessionStorage:", error)
  }

  return newRecord
}
