import { describe, expect, it } from "vitest"
import type { CommunitySongView } from "../types/repertoire.types"
import { filterSongs, getThemeOptions, sortSongs } from "./songFilters"

const makeSong = (
  overrides: Partial<CommunitySongView> & Pick<CommunitySongView, "id">,
): CommunitySongView => ({
  source: "LIBRARY",
  container: { id: "book-1", title: "Buch 1", type: "BOOK" },
  number: "1",
  title: "Titel",
  author: null,
  arranger: null,
  isNew: false,
  themes: [],
  archived: false,
  ...overrides,
})

describe("sortSongs", () => {
  it("sorts by container title, then by natural song number", () => {
    const songs = [
      makeSong({ id: "a", number: "10" }),
      makeSong({ id: "b", number: "2" }),
      makeSong({ id: "c", number: "22a" }),
      makeSong({ id: "d", number: "22" }),
      makeSong({
        id: "e",
        number: "1",
        container: { id: "f", title: "Andere", type: "FOLDER" },
      }),
    ]

    expect(sortSongs(songs).map(s => s.id)).toEqual(["e", "b", "a", "d", "c"])
  })

  it("does not mutate the input", () => {
    const songs = [makeSong({ id: "a", number: "2" }), makeSong({ id: "b" })]
    sortSongs(songs)
    expect(songs.map(s => s.id)).toEqual(["a", "b"])
  })
})

describe("getThemeOptions", () => {
  it("merges library and Community themes of the same name", () => {
    const songs = [
      makeSong({
        id: "a",
        themes: [{ source: "LIBRARY", id: "l1", name: "Lob und Dank" }],
      }),
      makeSong({
        id: "b",
        themes: [{ source: "COMMUNITY", id: "c1", name: " lob und dank " }],
      }),
      makeSong({
        id: "c",
        themes: [{ source: "COMMUNITY", id: "c2", name: "Advent" }],
      }),
    ]

    expect(getThemeOptions(songs)).toEqual([
      { key: "advent", name: "Advent", songCount: 1 },
      { key: "lob und dank", name: "Lob und Dank", songCount: 2 },
    ])
  })

  it("counts a song once even if it carries two themes of one name", () => {
    const songs = [
      makeSong({
        id: "a",
        themes: [
          { source: "LIBRARY", id: "l1", name: "Advent" },
          { source: "COMMUNITY", id: "c1", name: "Advent" },
        ],
      }),
    ]

    expect(getThemeOptions(songs)[0].songCount).toBe(1)
  })
})

describe("filterSongs", () => {
  const songs = [
    makeSong({
      id: "a",
      number: "42",
      title: "Großer Gott",
      author: "C. Boberg",
      themes: [{ source: "LIBRARY", id: "l1", name: "Lob und Dank" }],
    }),
    makeSong({
      id: "b",
      number: "7",
      title: "Stille Nacht",
      arranger: "F. Gruber",
      container: { id: "f1", title: "Mappe", type: "FOLDER" },
      themes: [{ source: "COMMUNITY", id: "c1", name: "lob und dank" }],
    }),
    makeSong({ id: "c", number: "9", title: "Archiviert", archived: true }),
  ]
  const none = { search: "", containerId: "", themeKey: "" }

  it("drops archived songs", () => {
    expect(filterSongs(songs, none).map(s => s.id)).toEqual(["a", "b"])
  })

  it("matches title, number, author and arranger case-insensitively", () => {
    expect(filterSongs(songs, { ...none, search: "GROSSER" })).toHaveLength(0)
    expect(filterSongs(songs, { ...none, search: "großer" })).toHaveLength(1)
    expect(filterSongs(songs, { ...none, search: "42" })[0].id).toBe("a")
    expect(filterSongs(songs, { ...none, search: "boberg" })[0].id).toBe("a")
    expect(filterSongs(songs, { ...none, search: "gruber" })[0].id).toBe("b")
  })

  it("filters by container", () => {
    expect(
      filterSongs(songs, { ...none, containerId: "f1" }).map(s => s.id),
    ).toEqual(["b"])
  })

  it("theme filter matches library and Community themes of that name", () => {
    expect(
      filterSongs(songs, { ...none, themeKey: "lob und dank" }).map(s => s.id),
    ).toEqual(["a", "b"])
  })
})
