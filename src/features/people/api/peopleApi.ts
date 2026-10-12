import { httpClient } from "../../../lib/http/client"
import type {
  CreatePersonInput,
  ListPeopleParams,
  PersonView,
  UpdatePersonInput,
} from "../types/people.types"

const base = (communityId: string) =>
  `/communities/${encodeURIComponent(communityId)}/people`

export const peopleApi = {
  list: (
    communityId: string,
    params?: ListPeopleParams,
  ): Promise<PersonView[]> => {
    const query = new URLSearchParams()
    if (params?.role) query.set("role", params.role)
    if (params?.includeArchived) query.set("includeArchived", "true")
    const qs = query.toString()
    return httpClient.get<PersonView[]>(
      `${base(communityId)}${qs ? `?${qs}` : ""}`,
    )
  },

  create: (
    communityId: string,
    input: CreatePersonInput,
  ): Promise<PersonView> =>
    httpClient.post<PersonView>(base(communityId), input),

  update: (
    communityId: string,
    personId: string,
    input: UpdatePersonInput,
  ): Promise<PersonView> =>
    httpClient.patch<PersonView>(
      `${base(communityId)}/${encodeURIComponent(personId)}`,
      input,
    ),

  archive: (communityId: string, personId: string): Promise<PersonView> =>
    httpClient.post<PersonView>(
      `${base(communityId)}/${encodeURIComponent(personId)}/archive`,
    ),

  restore: (communityId: string, personId: string): Promise<PersonView> =>
    httpClient.post<PersonView>(
      `${base(communityId)}/${encodeURIComponent(personId)}/restore`,
    ),
}
