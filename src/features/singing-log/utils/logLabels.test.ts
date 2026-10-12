import { describe, expect, it } from "vitest"
import { HttpError } from "../../../lib/http/httpError"
import {
  formatLogDate,
  getExistingRehearsalId,
  getLogErrorMessage,
  todayIso,
} from "./logLabels"

describe("logLabels", () => {
  it("todayIso uses local calendar parts", () => {
    expect(todayIso(new Date(2026, 9, 4, 23, 59))).toBe("2026-10-04")
    expect(todayIso(new Date(2026, 0, 5, 0, 1))).toBe("2026-01-05")
  })

  it("formatLogDate reorders without a time zone", () => {
    expect(formatLogDate("2026-10-04")).toBe("04.10.2026")
  })

  it("reads the existing rehearsal id from a date conflict only", () => {
    const conflict = new HttpError(
      409,
      "x",
      undefined,
      "REHEARSAL_DATE_TAKEN",
      {
        existingRehearsalId: "r-1",
      },
    )
    expect(getExistingRehearsalId(conflict)).toBe("r-1")
    expect(
      getExistingRehearsalId(new HttpError(409, "x", undefined, "OTHER", {})),
    ).toBeNull()
    expect(getExistingRehearsalId(new Error("x"))).toBeNull()
  })

  it("maps server codes to German messages with a generic fallback", () => {
    const code = (c: string) =>
      getLogErrorMessage(new HttpError(400, "x", undefined, c))
    expect(code("SONG_NOT_FOUND")).toMatch(/Lied/)
    expect(code("PERSON_ROLE_MISMATCH")).toMatch(/Rolle/)
    expect(code("REHEARSAL_NOT_EMPTY")).toMatch(/enthält noch Lieder/)
    expect(getLogErrorMessage(new HttpError(403, "x"))).toMatch(/Berechtigung/)
    expect(getLogErrorMessage(new Error("boom"))).toMatch(/nicht ausgeführt/)
  })
})
