import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { App } from "./App"
import { renderWithProviders } from "./utils/test-utils"

describe("App", () => {
  it("redirects an unauthenticated visitor to the login page with Superadmin Login button", async () => {
    renderWithProviders(<App />)

    expect(
      await screen.findByRole("heading", { name: "Anmelden" }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole("link", { name: "Superadmin Login" }),
    ).toBeInTheDocument()
  })

  it("navigates to admin login when clicking the Superadmin Login button", async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)

    const adminButton = await screen.findByRole("link", {
      name: "Superadmin Login",
    })
    await user.click(adminButton)

    expect(await screen.findByText("Superadmin Login")).toBeInTheDocument()
  })
})
