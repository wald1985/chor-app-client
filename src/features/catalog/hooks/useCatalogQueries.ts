import { useQuery } from "@tanstack/react-query"
import { catalogApi } from "../api/catalogApi"
import type {
  BookSummaryView,
  BookView,
  SeriesView,
  SongView,
  ThemeView,
} from "../types/catalog.types"

export const catalogQueryKeys = {
  all: ["catalog"] as const,
  series: (includeArchived?: boolean) =>
    ["catalog", "series", { includeArchived }] as const,
  books: (filters?: {
    seriesId?: string
    q?: string
    includeArchived?: boolean
  }) => ["catalog", "books", filters] as const,
  book: (bookId: string, includeArchivedSongs?: boolean) =>
    ["catalog", "book", bookId, { includeArchivedSongs }] as const,
  song: (songId: string) => ["catalog", "song", songId] as const,
  lookup: (params: { number: string; bookId?: string; seriesId?: string }) =>
    ["catalog", "lookup", params] as const,
  themes: (includeArchived?: boolean) =>
    ["catalog", "themes", { includeArchived }] as const,
}

export const useSeriesListQuery = (params?: { includeArchived?: boolean }) => {
  return useQuery<SeriesView[]>({
    queryKey: catalogQueryKeys.series(params?.includeArchived),
    queryFn: () => catalogApi.getSeries(params),
  })
}

export const useBooksListQuery = (params?: {
  seriesId?: string
  q?: string
  includeArchived?: boolean
}) => {
  return useQuery<BookSummaryView[]>({
    queryKey: catalogQueryKeys.books(params),
    queryFn: () => catalogApi.getBooks(params),
  })
}

export const useBookDetailQuery = (
  bookId: string,
  params?: { includeArchivedSongs?: boolean },
) => {
  return useQuery<BookView>({
    queryKey: catalogQueryKeys.book(bookId, params?.includeArchivedSongs),
    queryFn: () => catalogApi.getBook(bookId, params),
    enabled: Boolean(bookId),
  })
}

export const useSongQuery = (songId: string) => {
  return useQuery<SongView>({
    queryKey: catalogQueryKeys.song(songId),
    queryFn: () => catalogApi.getSong(songId),
    enabled: Boolean(songId),
  })
}

export const useSongLookupQuery = (
  params: { number: string; bookId?: string; seriesId?: string },
  options?: { enabled?: boolean },
) => {
  const isEnabled =
    (options?.enabled ?? true) &&
    Boolean(params.number) &&
    Boolean(params.bookId ?? params.seriesId)

  return useQuery<SongView>({
    queryKey: catalogQueryKeys.lookup(params),
    queryFn: () => catalogApi.lookupSong(params),
    enabled: isEnabled,
  })
}

export const useThemesListQuery = (params?: { includeArchived?: boolean }) => {
  return useQuery<ThemeView[]>({
    queryKey: catalogQueryKeys.themes(params?.includeArchived),
    queryFn: () => catalogApi.getThemes(params),
  })
}

export const useLibraryBooks = (params?: {
  seriesId?: string
  q?: string
  includeArchived?: boolean
}) => {
  return useBooksListQuery(params)
}
