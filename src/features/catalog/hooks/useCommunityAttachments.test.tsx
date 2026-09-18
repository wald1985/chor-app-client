import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { PropsWithChildren } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { communityAttachmentsApi } from "../api/communityAttachmentsApi"
import {
  useAttachBook,
  useCommunityAttachments,
  useDetachBook,
} from "./useCommunityAttachments"

describe("useCommunityAttachments hooks", () => {
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

  it("useCommunityAttachments fetches attachments for community", async () => {
    vi.spyOn(communityAttachmentsApi, "getAttachments").mockResolvedValue([
      {
        id: "att-1",
        communityId: "comm-1",
        libraryBookId: "book-1",
        bookTitle: "Buch 1",
      },
    ])

    const { result } = renderHook(() => useCommunityAttachments("comm-1"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].libraryBookId).toBe("book-1")
  })

  it("useAttachBook triggers mutation and invalidates communityAttachments", async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries")
    vi.spyOn(communityAttachmentsApi, "attachBook").mockResolvedValue({
      id: "att-2",
      communityId: "comm-1",
      libraryBookId: "book-2",
    })

    const { result } = renderHook(() => useAttachBook("comm-1"), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ libraryBookId: "book-2" })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["communityAttachments", "comm-1"],
    })
  })

  it("useDetachBook triggers mutation and invalidates communityAttachments", async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries")
    vi.spyOn(communityAttachmentsApi, "detachBook").mockResolvedValue(undefined)

    const { result } = renderHook(() => useDetachBook("comm-1"), {
      wrapper: createWrapper(),
    })

    result.current.mutate("att-1")

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["communityAttachments", "comm-1"],
    })
  })
})
