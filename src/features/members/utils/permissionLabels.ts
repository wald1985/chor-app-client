import { HttpError } from "../../../lib/http/httpError"
import type { CommunityPermission } from "../../auth/types"

export const PERMISSION_OPTIONS: {
  value: CommunityPermission
  label: string
  description: string
}[] = [
  {
    value: "PEOPLE_MANAGE",
    label: "Personen verwalten",
    description: "Klavierspieler und Dirigenten anlegen, ändern, archivieren",
  },
  {
    value: "REPERTOIRE_MANAGE",
    label: "Repertoire verwalten",
    description: "Bücher einbinden sowie Mappen, Lieder und Themen pflegen",
  },
]

export const getMemberErrorMessage = (error: unknown): string => {
  if (error instanceof HttpError) {
    if (error.status === 403) {
      return "Nur Administratoren dürfen Berechtigungen ändern."
    }
    if (error.status === 404) {
      return "Das Mitglied wurde nicht gefunden."
    }
    if (error.status === 409) {
      return "Die Berechtigungen eines Administrators können nicht geändert werden."
    }
  }
  return "Die Berechtigungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut."
}
