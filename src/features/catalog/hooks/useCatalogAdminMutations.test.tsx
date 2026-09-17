import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { PropsWithChildren } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { catalogAdminApi } from "../api/catalogAdminApi"
import { useCatalogAdminMutations } from "./useCatalogAdminMutations"

describe("useCatalogAdminMutations", () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    return ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("createBook triggers mutation and invalidates queries", async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries")
    vi.spyOn(catalogAdminApi, "createBook").mockResolvedValue({
      id: "b1",
      title: "Buch 1",
      series: null,
      volume: null,
      songCount: 0,
      archived: false,
    })

    const { result } = renderHook(() => useCatalogAdminMutations(), {
      wrapper: createWrapper(),
    })

    result.current.createBook.mutate({ title: "Buch 1" })

    await waitFor(() => {
      expect(result.current.createBook.isSuccess).toBe(true)
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["catalog", "books"],
    })
  })

  it("createSong triggers mutation and invalidates queries", async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries")
    vi.spyOn(catalogAdminApi, "createSong").mockResolvedValue({
      id: "s1",
      number: "1",
      title: "Song 1",
      author: null,
      arranger: null,
      book: { id: "b1", title: "B1", volume: null, archived: false },
      series: null,
      themes: [],
      archived: false,
    })

    const { result } = renderHook(() => useCatalogAdminMutations(), {
      wrapper: createWrapper(),
    })

    result.current.createSong.mutate({
      bookId: "b1",
      input: { number: "1", title: "Song 1" },
    })

    await waitFor(() => {
      expect(result.current.createSong.isSuccess).toBe(true)
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["catalog", "book"],
    })
  })

  it("applyImport invalidates all catalog queries", async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries")
    vi.spyOn(catalogAdminApi, "applyImport").mockResolvedValue({
      planHash: "sha256:abc",
      summary: {
        series: { create: 0, restore: 0 },
        books: { create: 0, place: 0, restore: 0, unchanged: 1 },
        themes: { create: 0, restore: 0 },
        songs: {
          create: 0,
          update: 0,
          move: 0,
          restore: 0,
          archive: 0,
          unchanged: 10,
        },
      },
    })

    const { result } = renderHook(() => useCatalogAdminMutations(), {
      wrapper: createWrapper(),
    })

    result.current.applyImport.mutate({
      file: new File([], "test.json"),
      planHash: "sha256:abc",
    })

    await waitFor(() => {
      expect(result.current.applyImport.isSuccess).toBe(true)
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["catalog"],
    })
  })
})
