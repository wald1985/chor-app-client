import { renderHook } from "@testing-library/react"
import type { PropsWithChildren } from "react"
import { Provider } from "react-redux"
import { describe, expect, it } from "vitest"
import { makeStore } from "../../../app/store"
import type { CommunityMembership } from "../types"
import { useActiveCommunity } from "./useActiveCommunity"
import { useCommunityPermission } from "./useCommunityPermission"

const memberships: CommunityMembership[] = [
  {
    communityId: "comm-1",
    communityName: "Chor Eins",
    role: "MEMBER",
    permissions: ["REPERTOIRE_MANAGE"],
  },
  {
    communityId: "comm-2",
    communityName: "Chor Zwei",
    role: "MEMBER",
    permissions: [],
  },
]

const createWrapper = (list: CommunityMembership[]) => {
  const store = makeStore({
    auth: {
      status: "authenticated",
      user: { id: "u1", email: "u@example.com", name: "U" },
      memberships: list,
      remember: false,
    } as never,
  })
  return ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  )
}

describe("useCommunityPermission", () => {
  it("is true only for the Community that grants the permission", () => {
    const wrapper = createWrapper(memberships)

    expect(
      renderHook(() => useCommunityPermission("comm-1", "REPERTOIRE_MANAGE"), {
        wrapper,
      }).result.current,
    ).toBe(true)
    expect(
      renderHook(() => useCommunityPermission("comm-2", "REPERTOIRE_MANAGE"), {
        wrapper,
      }).result.current,
    ).toBe(false)
    expect(
      renderHook(() => useCommunityPermission("comm-1", "PEOPLE_MANAGE"), {
        wrapper,
      }).result.current,
    ).toBe(false)
    expect(
      renderHook(() => useCommunityPermission("unknown", "PEOPLE_MANAGE"), {
        wrapper,
      }).result.current,
    ).toBe(false)
  })
})

describe("useActiveCommunity", () => {
  it("returns the first membership", () => {
    const { result } = renderHook(() => useActiveCommunity(), {
      wrapper: createWrapper(memberships),
    })
    expect(result.current?.communityId).toBe("comm-1")
  })

  it("returns null without memberships", () => {
    const { result } = renderHook(() => useActiveCommunity(), {
      wrapper: createWrapper([]),
    })
    expect(result.current).toBeNull()
  })
})
