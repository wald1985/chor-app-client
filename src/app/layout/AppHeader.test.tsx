import { screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithProviders } from "../../utils/test-utils"
import { catalogApi } from "../../features/catalog/api/catalogApi"
import { AppHeader } from "./AppHeader"

vi.mock("../../features/catalog/api/catalogApi", () => ({
  catalogApi: {
    getBooks: vi.fn(),
    getBook: vi.fn(),
    getThemes: vi.fn(),
  },
}))

describe("AppHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(catalogApi.getBooks).mockResolvedValue([])
    vi.mocked(catalogApi.getThemes).mockResolvedValue([])
  })

  it("renders Feedback and Catalog buttons and opens modals on click", async () => {
    const { user } = renderWithProviders(
      <BrowserRouter>
        <AppHeader />
      </BrowserRouter>,
      {
        preloadedState: {
          auth: {
            status: "authenticated",
            user: { id: "u1", email: "user@chor.de", name: "Max Mustermann" },
            memberships: [],
            remember: false,
          },
        },
      },
    )

    const feedbackBtn = screen.getByRole("button", { name: "Feedback" })
    const catalogBtn = screen.getByRole("button", { name: "Katalog" })

    expect(feedbackBtn).toBeInTheDocument()
    expect(catalogBtn).toBeInTheDocument()

    // Click Feedback button
    await user.click(feedbackBtn)
    expect(await screen.findByText("Feedback geben")).toBeInTheDocument()

    // Close Feedback modal
    await user.click(screen.getByRole("button", { name: "Abbrechen" }))

    // Click Catalog button
    await user.click(catalogBtn)
    expect(await screen.findByText("Liederbuch-Katalog")).toBeInTheDocument()
  })
})
