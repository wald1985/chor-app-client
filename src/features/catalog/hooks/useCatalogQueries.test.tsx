import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { PropsWithChildren } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { catalogApi } from "../api/catalogApi"
import {
  useBookDetailQuery,
  useBooksListQuery,
  useSeriesListQuery,
  useSongLookupQuery,
  useSongQuery,
  useThemesListQuery,
} from "./useCatalogQueries"

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useCatalogQueries", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("useSeriesListQuery fetches series", async () => {
    vi.spyOn(catalogApi, "getSeries").mockResolvedValue([
      { id: "s1", title: "Series 1", archived: false, books: [] },
    ])

    const { result } = renderHook(() => useSeriesListQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].title).toBe("Series 1")
  })

  it("useBooksListQuery fetches books with filters", async () => {
    vi.spyOn(catalogApi, "getBooks").mockResolvedValue([
      {
        id: "b1",
        title: "Buch 1",
        series: null,
        volume: null,
        songCount: 10,
        archived: false,
      },
    ])

    const { result } = renderHook(() => useBooksListQuery({ q: "Buch" }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.[0].title).toBe("Buch 1")
  })

  it("useBookDetailQuery fetches book detail", async () => {
    vi.spyOn(catalogApi, "getBook").mockResolvedValue({
      id: "b1",
      title: "Buch 1",
      series: null,
      volume: null,
      archived: false,
      songs: [],
    })

    const { result } = renderHook(() => useBookDetailQuery("b1"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.id).toBe("b1")
  })

  it("useSongQuery fetches a single song", async () => {
    vi.spyOn(catalogApi, "getSong").mockResolvedValue({
      id: "song-1",
      number: "1",
      title: "Song 1",
      author: null,
      arranger: null,
      book: { id: "b1", title: "B1", volume: null, archived: false },
      series: null,
      themes: [],
      archived: false,
    })

    const { result } = renderHook(() => useSongQuery("song-1"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.title).toBe("Song 1")
  })

  it("useSongLookupQuery performs lookup when params provided", async () => {
    vi.spyOn(catalogApi, "lookupSong").mockResolvedValue({
      id: "song-1",
      number: "100",
      title: "Song 100",
      author: null,
      arranger: null,
      book: { id: "b1", title: "B1", volume: null, archived: false },
      series: null,
      themes: [],
      archived: false,
    })

    const { result } = renderHook(
      () => useSongLookupQuery({ number: "100", bookId: "b1" }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.title).toBe("Song 100")
  })

  it("useThemesListQuery fetches themes list", async () => {
    vi.spyOn(catalogApi, "getThemes").mockResolvedValue([
      { id: "t1", name: "Glaube", archived: false, songCount: 5 },
    ])

    const { result } = renderHook(() => useThemesListQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.[0].name).toBe("Glaube")
  })
})
