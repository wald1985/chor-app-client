import { httpClient } from "../../../lib/http/client"
import type {
  ApplyImportInput,
  BookSummaryView,
  CreateBookInput,
  CreateSeriesInput,
  CreateSongInput,
  CreateThemeInput,
  ImportPreviewView,
  ImportResultView,
  PatchBookInput,
  PatchSeriesInput,
  PatchSongInput,
  PatchThemeInput,
  SeriesView,
  SetSongThemesInput,
  SongView,
  ThemeView,
} from "../types/catalog.types"

export const catalogAdminApi = {
  // --- Series ---
  createSeries: (input: CreateSeriesInput): Promise<SeriesView> =>
    httpClient.post<SeriesView>("/admin/library/series", input),

  renameSeries: async (
    seriesId: string,
    input: PatchSeriesInput,
  ): Promise<void> => {
    await httpClient.patch(`/admin/library/series/${seriesId}`, input)
  },

  archiveSeries: async (seriesId: string): Promise<void> => {
    await httpClient.post(`/admin/library/series/${seriesId}/archive`)
  },

  restoreSeries: async (seriesId: string): Promise<void> => {
    await httpClient.post(`/admin/library/series/${seriesId}/restore`)
  },

  // --- Books ---
  createBook: (input: CreateBookInput): Promise<BookSummaryView> =>
    httpClient.post<BookSummaryView>("/admin/library/books", input),

  patchBook: async (bookId: string, input: PatchBookInput): Promise<void> => {
    await httpClient.patch(`/admin/library/books/${bookId}`, input)
  },

  archiveBook: async (bookId: string, confirmInUse = false): Promise<void> => {
    await httpClient.post(
      `/admin/library/books/${bookId}/archive?confirmInUse=${String(confirmInUse)}`,
    )
  },

  restoreBook: async (bookId: string): Promise<void> => {
    await httpClient.post(`/admin/library/books/${bookId}/restore`)
  },

  // --- Songs ---
  createSong: (bookId: string, input: CreateSongInput): Promise<SongView> =>
    httpClient.post<SongView>(`/admin/library/books/${bookId}/songs`, input),

  patchSong: async (songId: string, input: PatchSongInput): Promise<void> => {
    await httpClient.patch(`/admin/library/songs/${songId}`, input)
  },

  setSongThemes: async (
    songId: string,
    input: SetSongThemesInput,
  ): Promise<void> => {
    await httpClient.put(`/admin/library/songs/${songId}/themes`, input)
  },

  archiveSong: async (songId: string, confirmInUse = false): Promise<void> => {
    await httpClient.post(
      `/admin/library/songs/${songId}/archive?confirmInUse=${String(confirmInUse)}`,
    )
  },

  restoreSong: async (songId: string): Promise<void> => {
    await httpClient.post(`/admin/library/songs/${songId}/restore`)
  },

  // --- Themes ---
  createTheme: (input: CreateThemeInput): Promise<ThemeView> =>
    httpClient.post<ThemeView>("/admin/library/themes", input),

  renameTheme: async (
    themeId: string,
    input: PatchThemeInput,
  ): Promise<void> => {
    await httpClient.patch(`/admin/library/themes/${themeId}`, input)
  },

  archiveTheme: async (
    themeId: string,
    confirmInUse = false,
  ): Promise<void> => {
    await httpClient.post(
      `/admin/library/themes/${themeId}/archive?confirmInUse=${String(confirmInUse)}`,
    )
  },

  restoreTheme: async (themeId: string): Promise<void> => {
    await httpClient.post(`/admin/library/themes/${themeId}/restore`)
  },

  // --- Imports ---
  previewImport: (file: File): Promise<ImportPreviewView> => {
    const formData = new FormData()
    formData.append("file", file)
    return httpClient.post<ImportPreviewView>(
      "/admin/library/imports/preview",
      formData,
    )
  },

  applyImport: (input: ApplyImportInput): Promise<ImportResultView> => {
    const formData = new FormData()
    formData.append("file", input.file)
    formData.append("planHash", input.planHash)
    if (input.confirmInUse !== undefined) {
      formData.append("confirmInUse", String(input.confirmInUse))
    }
    return httpClient.post<ImportResultView>(
      "/admin/library/imports/apply",
      formData,
    )
  },
}
