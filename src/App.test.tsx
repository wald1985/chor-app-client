import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { App } from "./App"
import { renderWithProviders } from "./utils/test-utils"

describe("App", () => {
  it("redirects an unauthenticated visitor to the login page", async () => {
    renderWithProviders(<App />)

    expect(
      await screen.findByRole("heading", { name: "Anmelden" }),
    ).toBeInTheDocument()
  })
})
