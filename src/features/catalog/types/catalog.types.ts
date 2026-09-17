// --- View Models (Read API: GET /library/...) ---

export type SeriesBookItemView = {
  id: string
  title: string
  volume: number | null
  archived: boolean
}

export type SeriesView = {
  id: string
  title: string
  archived: boolean
  books: SeriesBookItemView[]
}

export type BookSummarySeriesView = {
  id: string
  title: string
}

export type BookSummaryView = {
  id: string
  title: string
  series: BookSummarySeriesView | null
  volume: number | null
  songCount: number
  archived: boolean
}

export type SongThemeItemView = {
  id: string
  name: string
  archived: boolean
}

export type BookSongItemView = {
  id: string
  number: string
  title: string
  author: string | null
  arranger: string | null
  themes: SongThemeItemView[]
  archived: boolean
}

export type BookView = {
  id: string
  title: string
  series: BookSummarySeriesView | null
  volume: number | null
  archived: boolean
  songs: BookSongItemView[]
}

export type SongBookRefView = {
  id: string
  title: string
  volume: number | null
  archived: boolean
}

export type SongView = {
  id: string
  number: string
  title: string
  author: string | null
  arranger: string | null
  book: SongBookRefView
  series: BookSummarySeriesView | null
  themes: SongThemeItemView[]
  archived: boolean
}

export type ThemeView = {
  id: string
  name: string
  archived: boolean
  songCount: number
}

// --- Import Models (/admin/library/imports/...) ---

export type ImportSummaryView = {
  series: { create: number; restore: number }
  books: { create: number; place: number; restore: number; unchanged: number }
  themes: { create: number; restore: number }
  songs: {
    create: number
    update: number
    move: number
    restore: number
    archive: number
    unchanged: number
  }
}

export type ImportBookSongsView = {
  create: string[]
  update: { number: string; fields: string[] }[]
  move: string[]
  restore: string[]
  archive: string[]
}

export type ImportBookPreviewView = {
  title: string
  action: "CREATE" | "RESTORE" | "PLACE" | "UNCHANGED"
  series: string | null
  volume: number | null
  songs: ImportBookSongsView
}

export type ImportThemesPreviewView = {
  create: string[]
  restore: string[]
}

export type ImportInUseView = {
  type: "BOOK" | "SONG" | "THEME"
  id: string
  label: string
  communities: number
  references: number
}

export type ImportPreviewView = {
  planHash: string
  format: "JSON" | "CSV" | "XLSX"
  summary: ImportSummaryView
  books: ImportBookPreviewView[]
  themes: ImportThemesPreviewView
  inUse: ImportInUseView[]
  requiresConfirmation: boolean
}

export type ImportResultView = {
  planHash: string
  summary: ImportSummaryView
}

// --- Inputs / DTOs for Admin Mutations ---

export type CreateSeriesInput = {
  title: string
}

export type PatchSeriesInput = {
  title: string
}

export type CreateBookInput = {
  title: string
  seriesId?: string | null
  volume?: number | null
}

export type PatchBookInput = {
  title?: string
  seriesId?: string | null
  volume?: number | null
}

export type CreateSongInput = {
  number: string | number
  title: string
  author?: string | null
  arranger?: string | null
  themeIds?: string[]
}

export type PatchSongInput = {
  number?: string | number
  title?: string
  author?: string | null
  arranger?: string | null
}

export type SetSongThemesInput = {
  themeIds: string[]
}

export type CreateThemeInput = {
  name: string
}

export type PatchThemeInput = {
  name: string
}

export type ApplyImportInput = {
  file: File
  planHash: string
  confirmInUse?: boolean
}

// --- Error Payloads ---

export type LibraryItemUsage = {
  communities: number
  references: number
}

export type LibraryItemInUseErrorPayload = {
  code: "LIBRARY_ITEM_IN_USE"
  usage: LibraryItemUsage
}

export type LibraryFileValidationError = {
  line?: number
  code: string
  message: string
}

export type LibraryFileInvalidPayload = {
  code: "LIBRARY_FILE_INVALID"
  errors: LibraryFileValidationError[]
}

export type LibraryImportPlanChangedPayload = {
  code: "LIBRARY_IMPORT_PLAN_CHANGED"
  planHash: string
}
