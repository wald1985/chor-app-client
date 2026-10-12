import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { PersonView } from "../types/people.types"
import { PersonFormModal } from "./PersonFormModal"

const person: PersonView = {
  id: "p-1",
  name: "Lorina",
  roles: ["PIANIST"],
  archived: false,
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("PersonFormModal", () => {
  it("needs a name and at least one role before it can be submitted", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PersonFormModal show onSubmit={onSubmit} onCancel={vi.fn()} />)

    const submit = screen.getByRole("button", { name: "Hinzufügen" })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText("Name"), "  Alex ")
    expect(submit).toBeDisabled()

    await user.click(screen.getByLabelText("Klavierspieler"))
    await user.click(screen.getByLabelText("Dirigent"))
    expect(submit).toBeEnabled()

    await user.click(submit)
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Alex",
      roles: ["PIANIST", "CONDUCTOR"],
    })
  })

  it("prefills name and roles when editing", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <PersonFormModal
        show
        person={person}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByLabelText("Name")).toHaveValue("Lorina")
    expect(screen.getByLabelText("Klavierspieler")).toBeChecked()
    expect(screen.getByLabelText("Dirigent")).not.toBeChecked()

    await user.click(screen.getByLabelText("Dirigent"))
    await user.click(screen.getByRole("button", { name: "Speichern" }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Lorina",
      roles: ["PIANIST", "CONDUCTOR"],
    })
  })

  it("shows a server error and blocks removing the last role", async () => {
    const user = userEvent.setup()
    render(
      <PersonFormModal
        show
        person={person}
        error="Eine Person mit diesem Namen existiert bereits."
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Eine Person mit diesem Namen existiert bereits.",
    )
    await user.click(screen.getByLabelText("Klavierspieler"))
    expect(screen.getByRole("button", { name: "Speichern" })).toBeDisabled()
  })
})
