import { httpClient } from "../../../lib/http/client"
import type {
  CreateRehearsalInput,
  RehearsalDetailView,
  RehearsalEntryView,
  RehearsalSummaryView,
  SungSongInput,
  UpdateRehearsalInput,
} from "../types/singing-log.types"

const base = (communityId: string) =>
  `/communities/${encodeURIComponent(communityId)}/rehearsals`

const one = (communityId: string, rehearsalId: string) =>
  `${base(communityId)}/${encodeURIComponent(rehearsalId)}`

export const rehearsalsApi = {
  list: (communityId: string): Promise<RehearsalSummaryView[]> =>
    httpClient.get<RehearsalSummaryView[]>(base(communityId)),

  get: (
    communityId: string,
    rehearsalId: string,
  ): Promise<RehearsalDetailView> =>
    httpClient.get<RehearsalDetailView>(one(communityId, rehearsalId)),

  create: (
    communityId: string,
    input: CreateRehearsalInput,
  ): Promise<RehearsalDetailView> =>
    httpClient.post<RehearsalDetailView>(base(communityId), input),

  update: (
    communityId: string,
    rehearsalId: string,
    input: UpdateRehearsalInput,
  ): Promise<RehearsalDetailView> =>
    httpClient.patch<RehearsalDetailView>(one(communityId, rehearsalId), input),

  remove: (communityId: string, rehearsalId: string): Promise<undefined> =>
    httpClient.delete<undefined>(one(communityId, rehearsalId)),

  addEntry: (
    communityId: string,
    rehearsalId: string,
    input: SungSongInput,
  ): Promise<RehearsalEntryView> =>
    httpClient.post<RehearsalEntryView>(
      `${one(communityId, rehearsalId)}/entries`,
      input,
    ),

  removeEntry: (
    communityId: string,
    rehearsalId: string,
    entryId: string,
  ): Promise<undefined> =>
    httpClient.delete<undefined>(
      `${one(communityId, rehearsalId)}/entries/${encodeURIComponent(entryId)}`,
    ),
}
