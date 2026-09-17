import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpClient } from "../../../lib/http/client"
import { catalogAdminApi } from "./catalogAdminApi"

describe("catalogAdminApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("handles series CRUD endpoints", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({
      id: "s1",
      title: "Bücher",
      archived: false,
      books: [],
    })
    const patchSpy = vi.spyOn(httpClient, "patch").mockResolvedValue(undefined)

    await catalogAdminApi.createSeries({ title: "Bücher" })
    expect(postSpy).toHaveBeenCalledWith("/admin/library/series", {
      title: "Bücher",
    })

    await catalogAdminApi.renameSeries("s1", { title: "Bücher Neu" })
    expect(patchSpy).toHaveBeenCalledWith("/admin/library/series/s1", {
      title: "Bücher Neu",
    })

    await catalogAdminApi.archiveSeries("s1")
    expect(postSpy).toHaveBeenCalledWith("/admin/library/series/s1/archive")

    await catalogAdminApi.restoreSeries("s1")
    expect(postSpy).toHaveBeenCalledWith("/admin/library/series/s1/restore")
  })

  it("handles books CRUD endpoints with confirmInUse query param", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({
      id: "b1",
      title: "Buch 1",
      series: null,
      volume: 1,
      songCount: 0,
      archived: false,
    })
    const patchSpy = vi.spyOn(httpClient, "patch").mockResolvedValue(undefined)

    await catalogAdminApi.createBook({ title: "Buch 1", volume: 1 })
    expect(postSpy).toHaveBeenCalledWith("/admin/library/books", {
      title: "Buch 1",
      volume: 1,
    })

    await catalogAdminApi.patchBook("b1", { title: "Buch 1 Renamed" })
    expect(patchSpy).toHaveBeenCalledWith("/admin/library/books/b1", {
      title: "Buch 1 Renamed",
    })

    await catalogAdminApi.archiveBook("b1", false)
    expect(postSpy).toHaveBeenCalledWith(
      "/admin/library/books/b1/archive?confirmInUse=false",
    )

    await catalogAdminApi.archiveBook("b1", true)
    expect(postSpy).toHaveBeenCalledWith(
      "/admin/library/books/b1/archive?confirmInUse=true",
    )

    await catalogAdminApi.restoreBook("b1")
    expect(postSpy).toHaveBeenCalledWith("/admin/library/books/b1/restore")
  })

  it("handles songs CRUD and themes assignment", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({
      id: "s1",
      number: "100",
      title: "Lied 100",
      author: null,
      arranger: null,
      book: { id: "b1", title: "B1", volume: null, archived: false },
      series: null,
      themes: [],
      archived: false,
    })
    const patchSpy = vi.spyOn(httpClient, "patch").mockResolvedValue(undefined)
    const putSpy = vi.spyOn(httpClient, "put").mockResolvedValue(undefined)

    await catalogAdminApi.createSong("b1", {
      number: "100",
      title: "Lied 100",
      themeIds: ["t1"],
    })
    expect(postSpy).toHaveBeenCalledWith("/admin/library/books/b1/songs", {
      number: "100",
      title: "Lied 100",
      themeIds: ["t1"],
    })

    await catalogAdminApi.patchSong("song-1", { title: "Updated Title" })
    expect(patchSpy).toHaveBeenCalledWith("/admin/library/songs/song-1", {
      title: "Updated Title",
    })

    await catalogAdminApi.setSongThemes("song-1", { themeIds: ["t1", "t2"] })
    expect(putSpy).toHaveBeenCalledWith("/admin/library/songs/song-1/themes", {
      themeIds: ["t1", "t2"],
    })

    await catalogAdminApi.archiveSong("song-1", true)
    expect(postSpy).toHaveBeenCalledWith(
      "/admin/library/songs/song-1/archive?confirmInUse=true",
    )

    await catalogAdminApi.restoreSong("song-1")
    expect(postSpy).toHaveBeenCalledWith("/admin/library/songs/song-1/restore")
  })

  it("handles themes CRUD endpoints", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({
      id: "t1",
      name: "Glaube",
      archived: false,
      songCount: 0,
    })
    const patchSpy = vi.spyOn(httpClient, "patch").mockResolvedValue(undefined)

    await catalogAdminApi.createTheme({ name: "Glaube" })
    expect(postSpy).toHaveBeenCalledWith("/admin/library/themes", {
      name: "Glaube",
    })

    await catalogAdminApi.renameTheme("t1", { name: "Glaube & Hoffnung" })
    expect(patchSpy).toHaveBeenCalledWith("/admin/library/themes/t1", {
      name: "Glaube & Hoffnung",
    })

    await catalogAdminApi.archiveTheme("t1", true)
    expect(postSpy).toHaveBeenCalledWith(
      "/admin/library/themes/t1/archive?confirmInUse=true",
    )

    await catalogAdminApi.restoreTheme("t1")
    expect(postSpy).toHaveBeenCalledWith("/admin/library/themes/t1/restore")
  })

  it("handles import preview and apply with FormData", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({})
    const file = new File(["test content"], "test.json", {
      type: "application/json",
    })

    await catalogAdminApi.previewImport(file)
    expect(postSpy).toHaveBeenCalledWith(
      "/admin/library/imports/preview",
      expect.any(FormData),
    )

    await catalogAdminApi.applyImport({
      file,
      planHash: "sha256:abc",
      confirmInUse: true,
    })
    expect(postSpy).toHaveBeenCalledWith(
      "/admin/library/imports/apply",
      expect.any(FormData),
    )
  })
})
