import { HttpError } from "../../../lib/http/httpError"
import type { PersonRole } from "../types/people.types"

export const PERSON_ROLES: { value: PersonRole; label: string }[] = [
  { value: "PIANIST", label: "Klavierspieler" },
  { value: "CONDUCTOR", label: "Dirigent" },
]

export const roleLabel = (role: PersonRole): string =>
  PERSON_ROLES.find(r => r.value === role)?.label ?? role

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

/** German, user-facing message for a failed People request. */
export const getPersonErrorMessage = (error: unknown): string => {
  if (error instanceof HttpError) {
    switch (error.code) {
      case "PERSON_NAME_TAKEN": {
        const archived =
          isRecord(error.payload) && error.payload.existingArchived === true
        return archived
          ? "Diese Person existiert bereits im Archiv. Bitte stellen Sie sie wieder her."
          : "Eine Person mit diesem Namen existiert bereits."
      }
      case "PERSON_ARCHIVED":
        return "Archivierte Personen können nicht bearbeitet werden."
      case "PERSON_NOT_FOUND":
        return "Die Person wurde nicht gefunden."
      case "PERSON_ROLES_EMPTY":
        return "Bitte wählen Sie mindestens eine Rolle."
      case "PERMISSION_DENIED":
        return "Ihnen fehlt die Berechtigung, Personen zu verwalten."
    }
  }
  return "Die Aktion konnte nicht ausgeführt werden. Bitte versuchen Sie es erneut."
}

/**
 * When creating/renaming collides with an archived Person, the server names
 * the holder so the UI can offer to restore it instead.
 */
export const getArchivedConflictPersonId = (error: unknown): string | null => {
  if (
    error instanceof HttpError &&
    error.code === "PERSON_NAME_TAKEN" &&
    isRecord(error.payload) &&
    error.payload.existingArchived === true &&
    typeof error.payload.existingPersonId === "string" &&
    error.payload.existingPersonId.length > 0
  ) {
    return error.payload.existingPersonId
  }
  return null
}
