import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { renderWithProviders } from "../utils/test-utils"
import { FeedbackModal } from "./FeedbackModal"

describe("FeedbackModal", () => {
  it("renders stub message and form when open", () => {
    renderWithProviders(<FeedbackModal show={true} onHide={vi.fn()} />)

    expect(screen.getByText("Feedback geben")).toBeInTheDocument()
    expect(
      screen.getByText(/Die direkte Feedback-Übermittlung befindet sich aktuell im Aufbau/i),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Kategorie")).toBeInTheDocument()
    expect(screen.getByLabelText("Ihre Nachricht")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Feedback absenden" }),
    ).toBeInTheDocument()
  })

  it("submits message and shows confirmation", async () => {
    const { user } = renderWithProviders(
      <FeedbackModal show={true} onHide={vi.fn()} />,
    )

    const textarea = screen.getByLabelText("Ihre Nachricht")
    await user.type(textarea, "Tolle App, bitte mehr Lieder hinzufügen!")

    const submitBtn = screen.getByRole("button", { name: "Feedback absenden" })
    await user.click(submitBtn)

    expect(
      screen.getByText(/Ihre Rückmeldung wurde entgegengenommen/i),
    ).toBeInTheDocument()
  })

  it("calls onHide when close button clicked", async () => {
    const handleHide = vi.fn()
    const { user } = renderWithProviders(
      <FeedbackModal show={true} onHide={handleHide} />,
    )

    const cancelBtn = screen.getByRole("button", { name: "Abbrechen" })
    await user.click(cancelBtn)

    expect(handleHide).toHaveBeenCalledTimes(1)
  })
})
