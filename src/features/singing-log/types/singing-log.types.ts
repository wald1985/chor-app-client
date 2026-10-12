// --- View Models (Read API: /communities/:communityId/performances|rehearsals) ---

export type LogSongView = {
  id: string
  number: string
  title: string
  source: "LIBRARY" | "COMMUNITY"
  container: { id: string; title: string; type: "BOOK" | "FOLDER" }
  archived: boolean
}

export type LogPersonView = {
  id: string
  name: string
  archived: boolean
}

export type PerformanceView = {
  id: string
  /** Calendar date, "YYYY-MM-DD". */
  date: string
  songId: string
  /** `null` only if the song can no longer be resolved at all. */
  song: LogSongView | null
  pianist: LogPersonView | null
  conductor: LogPersonView | null
  note: string | null
  createdAt: string
}

export type RehearsalEntryView = {
  id: string
  songId: string
  song: LogSongView | null
  pianist: LogPersonView | null
  conductor: LogPersonView | null
  note: string | null
  createdAt: string
}

export type RehearsalSummaryView = {
  id: string
  date: string
  warmUpLeader: LogPersonView | null
  note: string | null
  entryCount: number
  createdAt: string
}

export type RehearsalDetailView = RehearsalSummaryView & {
  entries: RehearsalEntryView[]
}

// --- Inputs ---

export type SungSongInput = {
  songId: string
  pianistId?: string | null
  conductorId?: string | null
  note?: string | null
}

export type RecordPerformanceInput = SungSongInput & { date: string }

export type CreateRehearsalInput = {
  date: string
  warmUpLeaderId?: string | null
  note?: string | null
}

export type UpdateRehearsalInput = {
  /** `undefined` keeps the value, `null` clears it. */
  warmUpLeaderId?: string | null
  note?: string | null
}
