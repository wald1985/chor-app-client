// --- View Models (Read API: GET /communities/:communityId/...) ---

export type ThemeSource = "LIBRARY" | "COMMUNITY"

export type CommunitySongThemeView = {
  source: ThemeSource
  id: string
  name: string
}

export type CommunitySongContainerView = {
  id: string
  title: string
  type: "BOOK" | "FOLDER"
  seriesId?: string | null
}

export type CommunitySongView = {
  id: string
  /** Where the song comes from: the global library or a Community folder. */
  source: ThemeSource
  container: CommunitySongContainerView
  number: string
  title: string
  author: string | null
  arranger: string | null
  isNew: boolean
  themes: CommunitySongThemeView[]
  archived: boolean
}

export type CommunitySongsParams = {
  search?: string
  themeIds?: string[]
  containerId?: string
}
