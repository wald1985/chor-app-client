import type { RootState } from "../../../app/store"
import type { CommunityPermission } from "../../auth/types"
import type { PersonView } from "../../people/types/people.types"
import type { CommunitySongView } from "../../repertoire/types/repertoire.types"

export const testSongs: CommunitySongView[] = [
  {
    id: "s-42",
    source: "LIBRARY",
    container: { id: "book-1", title: "Buch 1", type: "BOOK" },
    number: "42",
    title: "Großer Gott",
    author: null,
    arranger: null,
    isNew: false,
    themes: [],
    archived: false,
  },
]

const person = (
  id: string,
  name: string,
  roles: PersonView["roles"],
  archived = false,
): PersonView => ({
  id,
  name,
  roles,
  archived,
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
})

export const testPeople: PersonView[] = [
  person("p-lorina", "Lorina", ["PIANIST"]),
  person("p-daniel", "Daniel", ["CONDUCTOR"]),
  person("p-alex", "Alex", ["PIANIST", "CONDUCTOR"]),
  person("p-gone", "Springer", ["PIANIST", "CONDUCTOR"], true),
]

export const authState = (
  permissions: CommunityPermission[],
  withMembership = true,
): Partial<RootState> => ({
  auth: {
    status: "authenticated",
    user: { id: "u1", email: "user@test.de", name: "Max" },
    memberships: withMembership
      ? [
          {
            communityId: "comm-1",
            communityName: "Chor Zion",
            role: "MEMBER",
            permissions,
          },
        ]
      : [],
    remember: false,
  },
})
