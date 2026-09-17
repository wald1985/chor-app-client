import { httpClient } from "../../../lib/http/client"
import type {
  BookSummaryView,
  BookView,
  SeriesView,
  SongView,
  ThemeView,
} from "../types/catalog.types"

export const catalogApi = {
  getSeries: (params?: {
    includeArchived?: boolean
  }): Promise<SeriesView[]> => {
    const query = new URLSearchParams()
    if (params?.includeArchived !== undefined) {
      query.set("includeArchived", String(params.includeArchived))
    }
    const qs = query.toString()
    return httpClient.get<SeriesView[]>(`/library/series${qs ? `?${qs}` : ""}`)
  },

  getBooks: (params?: {
    seriesId?: string
    q?: string
    includeArchived?: boolean
  }): Promise<BookSummaryView[]> => {
    const query = new URLSearchParams()
    if (params?.seriesId) query.set("seriesId", params.seriesId)
    if (params?.q) query.set("q", params.q)
    if (params?.includeArchived !== undefined) {
      query.set("includeArchived", String(params.includeArchived))
    }
    const qs = query.toString()
    return httpClient.get<BookSummaryView[]>(
      `/library/books${qs ? `?${qs}` : ""}`,
    )
  },

  getBook: (
    bookId: string,
    params?: { includeArchivedSongs?: boolean },
  ): Promise<BookView> => {
    const query = new URLSearchParams()
    if (params?.includeArchivedSongs !== undefined) {
      query.set("includeArchivedSongs", String(params.includeArchivedSongs))
    }
    const qs = query.toString()
    return httpClient.get<BookView>(
      `/library/books/${bookId}${qs ? `?${qs}` : ""}`,
    )
  },

  lookupSong: (params: {
    number: string
    bookId?: string
    seriesId?: string
  }): Promise<SongView> => {
    const query = new URLSearchParams()
    query.set("number", params.number)
    if (params.bookId) query.set("bookId", params.bookId)
    if (params.seriesId) query.set("seriesId", params.seriesId)
    return httpClient.get<SongView>(`/library/songs/lookup?${query.toString()}`)
  },

  getSong: (songId: string): Promise<SongView> =>
    httpClient.get<SongView>(`/library/songs/${songId}`),

  getThemes: (params?: { includeArchived?: boolean }): Promise<ThemeView[]> => {
    const query = new URLSearchParams()
    if (params?.includeArchived !== undefined) {
      query.set("includeArchived", String(params.includeArchived))
    }
    const qs = query.toString()
    return httpClient.get<ThemeView[]>(`/library/themes${qs ? `?${qs}` : ""}`)
  },
}
