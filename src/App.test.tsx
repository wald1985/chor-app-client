import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { App } from "./App"
import { renderWithProviders } from "./utils/test-utils"

describe("App", () => {
  it("redirects an unauthenticated visitor to the login page with greeting and superadmin link", async () => {
    renderWithProviders(<App />)

    expect(
      await screen.findByRole("heading", { name: "Anmelden" }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole("heading", { name: "Chor-App" }),
    ).toBeInTheDocument()

    expect(screen.getByRole("link", { name: "Superadmin" })).toBeInTheDocument()
  })

  it("navigates to admin login when clicking the discreet superadmin icon link", async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)

    const adminLink = await screen.findByRole("link", {
      name: "Superadmin",
    })
    await user.click(adminLink)

    expect(await screen.findByText("Superadmin Login")).toBeInTheDocument()
  })
})
