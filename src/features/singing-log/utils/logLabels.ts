import { HttpError } from "../../../lib/http/httpError"

/** Today as a local calendar date, "YYYY-MM-DD". */
export const todayIso = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** "2026-10-04" -> "04.10.2026" without going through a Date (no time-zone shift). */
export const formatLogDate = (iso: string): string => {
  const [year, month, day] = iso.split("-")
  return `${day}.${month}.${year}`
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

/** The id of the rehearsal that already holds the date, from a 409 answer. */
export const getExistingRehearsalId = (error: unknown): string | null => {
  if (
    error instanceof HttpError &&
    error.code === "REHEARSAL_DATE_TAKEN" &&
    isRecord(error.payload) &&
    typeof error.payload.existingRehearsalId === "string" &&
    error.payload.existingRehearsalId.length > 0
  ) {
    return error.payload.existingRehearsalId
  }
  return null
}

/** German, user-facing message for a failed Vortrag/Chorprobe request. */
export const getLogErrorMessage = (error: unknown): string => {
  if (error instanceof HttpError) {
    switch (error.code) {
      case "SONG_NOT_FOUND":
        return "Das Lied ist im Repertoire nicht (mehr) verfügbar."
      case "PERSON_NOT_FOUND":
        return "Die gewählte Person wurde nicht gefunden."
      case "PERSON_ARCHIVED":
        return "Die gewählte Person ist archiviert."
      case "PERSON_ROLE_MISMATCH":
        return "Die gewählte Person hat nicht die passende Rolle."
      case "PERFORMANCE_VALUE_INVALID":
      case "REHEARSAL_VALUE_INVALID":
        return "Bitte prüfen Sie Datum und Notiz."
      case "REHEARSAL_NOT_EMPTY":
        return "Die Probe enthält noch Lieder. Entfernen Sie zuerst die Lieder."
      case "REHEARSAL_NOT_FOUND":
      case "REHEARSAL_ENTRY_NOT_FOUND":
      case "PERFORMANCE_NOT_FOUND":
        return "Der Eintrag wurde nicht gefunden. Bitte laden Sie die Seite neu."
    }
    if (error.status === 403) {
      return "Ihnen fehlt die Berechtigung, Vorträge und Proben zu erfassen."
    }
  }
  return "Die Aktion konnte nicht ausgeführt werden. Bitte versuchen Sie es erneut."
}
