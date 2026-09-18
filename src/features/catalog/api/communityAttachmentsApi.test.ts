import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpClient } from "../../../lib/http/client"
import { communityAttachmentsApi } from "./communityAttachmentsApi"

describe("communityAttachmentsApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("getAttachments calls GET /communities/:communityId/attachments", async () => {
    const getSpy = vi.spyOn(httpClient, "get").mockResolvedValue([])

    await communityAttachmentsApi.getAttachments("comm-1")
    expect(getSpy).toHaveBeenCalledWith("/communities/comm-1/attachments")
  })

  it("attachBook calls POST /communities/:communityId/attachments with payload", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue({
      id: "att-1",
      communityId: "comm-1",
      libraryBookId: "book-1",
    })

    await communityAttachmentsApi.attachBook("comm-1", {
      libraryBookId: "book-1",
    })
    expect(postSpy).toHaveBeenCalledWith("/communities/comm-1/attachments", {
      libraryBookId: "book-1",
    })
  })

  it("detachBook calls DELETE /communities/:communityId/attachments/:attachmentId", async () => {
    const deleteSpy = vi
      .spyOn(httpClient, "delete")
      .mockResolvedValue(undefined)

    await communityAttachmentsApi.detachBook("comm-1", "att-1")
    expect(deleteSpy).toHaveBeenCalledWith(
      "/communities/comm-1/attachments/att-1",
    )
  })

  it("archiveAttachment calls POST /communities/:communityId/attachments/:attachmentId/archive", async () => {
    const postSpy = vi.spyOn(httpClient, "post").mockResolvedValue(undefined)

    await communityAttachmentsApi.archiveAttachment("comm-1", "att-1")
    expect(postSpy).toHaveBeenCalledWith(
      "/communities/comm-1/attachments/att-1/archive",
    )
  })
})
