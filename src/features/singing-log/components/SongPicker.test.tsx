import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import type { CommunitySongView } from "../../repertoire/types/repertoire.types"
import { SongPicker } from "./SongPicker"

const song = (
  overrides: Partial<CommunitySongView> &
    Pick<CommunitySongView, "id" | "number" | "title">,
): CommunitySongView => ({
  source: "LIBRARY",
  container: { id: "book-1", title: "Buch 1", type: "BOOK" },
  author: null,
  arranger: null,
  isNew: false,
  themes: [],
  archived: false,
  ...overrides,
})

const songs = [
  song({ id: "s-42", number: "42", title: "Großer Gott" }),
  song({ id: "s-420", number: "420", title: "Anderes Lied" }),
  song({
    id: "s-m1",
    number: "42",
    title: "Mappenlied",
    container: { id: "f-1", title: "Mappe", type: "FOLDER" },
  }),
  song({ id: "s-old", number: "43", title: "Altes Lied", archived: true }),
]

const Harness = ({ onValue }: { onValue?: (id: string) => void }) => {
  const [value, setValue] = useState("")
  return (
    <SongPicker
      songs={songs}
      value={value}
      onChange={id => {
        setValue(id)
        onValue?.(id)
      }}
    />
  )
}

describe("SongPicker", () => {
  it("lists matches with an exact number first and never offers archived songs", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText("Liednummer oder Titel"), "42")
    const items = screen.getAllByRole("button")
    expect(items[0]).toHaveTextContent("Großer Gott")
    expect(items[1]).toHaveTextContent("Mappenlied")
    expect(items[2]).toHaveTextContent("Anderes Lied")

    await user.clear(screen.getByLabelText("Liednummer oder Titel"))
    await user.type(screen.getByLabelText("Liednummer oder Titel"), "Altes")
    expect(screen.getByText(/Kein Lied gefunden/)).toBeInTheDocument()
  })

  it("restricts to the chosen collection", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.selectOptions(screen.getByLabelText("Sammlung"), "f-1")
    await user.type(screen.getByLabelText("Liednummer oder Titel"), "42")
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.getByRole("button")).toHaveTextContent("Mappenlied")
  })

  it("selects by click or Enter, shows the song and lets the user change it", async () => {
    const user = userEvent.setup()
    const chosen: string[] = []
    render(<Harness onValue={id => chosen.push(id)} />)

    await user.type(
      screen.getByLabelText("Liednummer oder Titel"),
      "Großer{Enter}",
    )
    expect(chosen).toEqual(["s-42"])
    expect(screen.getByText(/Nr. 42/)).toBeInTheDocument()
    expect(
      screen.queryByLabelText("Liednummer oder Titel"),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Ändern" }))
    expect(chosen).toEqual(["s-42", ""])
    expect(screen.getByLabelText("Liednummer oder Titel")).toHaveValue("")
  })
})
