import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { communityAttachmentsApi } from "../api/communityAttachmentsApi"
import type {
  BookAttachmentView,
  CreateAttachmentDto,
} from "../types/catalog.types"

export const communityAttachmentKeys = {
  all: ["communityAttachments"] as const,
  list: (communityId: string) => ["communityAttachments", communityId] as const,
}

export const useCommunityAttachments = (communityId: string) => {
  return useQuery<BookAttachmentView[]>({
    queryKey: communityAttachmentKeys.list(communityId),
    queryFn: () => communityAttachmentsApi.getAttachments(communityId),
    enabled: Boolean(communityId),
  })
}

export const useAttachBook = (communityId: string) => {
  const queryClient = useQueryClient()

  return useMutation<BookAttachmentView, Error, CreateAttachmentDto>({
    mutationFn: (input: CreateAttachmentDto) =>
      communityAttachmentsApi.attachBook(communityId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communityAttachmentKeys.list(communityId),
      })
    },
  })
}

export const useDetachBook = (communityId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attachmentId: string) =>
      communityAttachmentsApi.detachBook(communityId, attachmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: communityAttachmentKeys.list(communityId),
      })
    },
  })
}
