import { httpClient } from "../../../lib/http/client"
import type {
  BookAttachmentView,
  CreateAttachmentDto,
} from "../types/catalog.types"

export const communityAttachmentsApi = {
  getAttachments: (communityId: string): Promise<BookAttachmentView[]> =>
    httpClient.get<BookAttachmentView[]>(
      `/communities/${encodeURIComponent(communityId)}/attachments`,
    ),

  attachBook: (
    communityId: string,
    input: CreateAttachmentDto,
  ): Promise<BookAttachmentView> =>
    httpClient.post<BookAttachmentView>(
      `/communities/${encodeURIComponent(communityId)}/attachments`,
      input,
    ),

  detachBook: (communityId: string, attachmentId: string): Promise<undefined> =>
    httpClient.delete<undefined>(
      `/communities/${encodeURIComponent(communityId)}/attachments/${encodeURIComponent(attachmentId)}`,
    ),

  archiveAttachment: (
    communityId: string,
    attachmentId: string,
  ): Promise<undefined> =>
    httpClient.post<undefined>(
      `/communities/${encodeURIComponent(communityId)}/attachments/${encodeURIComponent(attachmentId)}/archive`,
    ),
}
