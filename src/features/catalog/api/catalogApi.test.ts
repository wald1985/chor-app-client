import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpClient } from "../../../lib/http/client"
import { catalogApi } from "./catalogApi"

describe("catalogApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("getSeries calls /library/series with correct query parameters", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue([])

    await catalogApi.getSeries({ includeArchived: true })
    expect(getSpy).toHaveBeenCalledWith("/library/series?includeArchived=true")

    await catalogApi.getSeries()
    expect(getSpy).toHaveBeenCalledWith("/library/series")
  })

  it("getBooks calls /library/books with search and series filters", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue([])

    await catalogApi.getBooks({
      seriesId: "series-1",
      q: "Test",
      includeArchived: false,
    })
    expect(getSpy).toHaveBeenCalledWith(
      "/library/books?seriesId=series-1&q=Test&includeArchived=false",
    )
  })

  it("getBook calls /library/books/:id with includeArchivedSongs", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue({
      id: "b1",
      title: "Buch 1",
      series: null,
      volume: null,
      archived: false,
      songs: [],
    })

    await catalogApi.getBook("b1", { includeArchivedSongs: true })
    expect(getSpy).toHaveBeenCalledWith(
      "/library/books/b1?includeArchivedSongs=true",
    )
  })

  it("lookupSong calls /library/songs/lookup with query params", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue({
      id: "s1",
      number: "42",
      title: "Song",
      author: null,
      arranger: null,
      book: { id: "b1", title: "B1", volume: null, archived: false },
      series: null,
      themes: [],
      archived: false,
    })

    await catalogApi.lookupSong({ number: "42", bookId: "b1" })
    expect(getSpy).toHaveBeenCalledWith(
      "/library/songs/lookup?number=42&bookId=b1",
    )
  })

  it("getSong calls /library/songs/:id", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue({
      id: "s1",
      number: "42",
      title: "Song",
      author: null,
      arranger: null,
      book: { id: "b1", title: "B1", volume: null, archived: false },
      series: null,
      themes: [],
      archived: false,
    })

    await catalogApi.getSong("s1")
    expect(getSpy).toHaveBeenCalledWith("/library/songs/s1")
  })

  it("getThemes calls /library/themes", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue([])

    await catalogApi.getThemes({ includeArchived: true })
    expect(getSpy).toHaveBeenCalledWith("/library/themes?includeArchived=true")
  })
})
