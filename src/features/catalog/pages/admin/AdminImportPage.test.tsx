import { fireEvent, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { HttpError } from "../../../../lib/http/httpError"
import { renderWithProviders } from "../../../../utils/test-utils"
import { catalogAdminApi } from "../../api/catalogAdminApi"
import type {
  ImportPreviewView,
  ImportResultView,
} from "../../types/catalog.types"
import { AdminImportPage } from "./AdminImportPage"

describe("AdminImportPage", () => {
  const mockPreview: ImportPreviewView = {
    planHash: "hash-12345",
    format: "JSON",
    summary: {
      series: { create: 1, restore: 0 },
      books: { create: 1, place: 0, restore: 0, unchanged: 2 },
      themes: { create: 3, restore: 0 },
      songs: {
        create: 15,
        update: 5,
        move: 0,
        restore: 1,
        archive: 2,
        unchanged: 80,
      },
    },
    books: [
      {
        title: "Buch 1",
        action: "CREATE",
        series: "Reihe Alpha",
        volume: 1,
        songs: {
          create: ["1", "2"],
          update: [{ number: "3", fields: ["title", "author"] }],
          move: [],
          restore: [],
          archive: ["99"],
        },
      },
    ],
    themes: {
      create: ["Lobpreis"],
      restore: [],
    },
    inUse: [
      {
        type: "SONG",
        id: "s-99",
        label: "Lied 99",
        communities: 3,
        references: 11,
      },
    ],
    requiresConfirmation: true,
  }

  const mockApplyResult: ImportResultView = {
    planHash: "hash-12345",
    summary: mockPreview.summary,
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the import page with file selection and disabled preview button", () => {
    renderWithProviders(
      <MemoryRouter>
        <AdminImportPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole("heading", { name: "Katalog importieren" }),
    ).toBeInTheDocument()

    expect(screen.getByLabelText("Katalogdatei auswählen")).toBeInTheDocument()

    const previewButton = screen.getByRole("button", {
      name: "Vorschau erstellen",
    })
    expect(previewButton).toBeDisabled()
  })

  it("rejects file with invalid extension", async () => {
    renderWithProviders(
      <MemoryRouter>
        <AdminImportPage />
      </MemoryRouter>,
    )

    const fileInput = screen.getByLabelText("Katalogdatei auswählen")

    const invalidFile = new File(["dummy content"], "test.pdf", {
      type: "application/pdf",
    })
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    expect(
      await screen.findByText(
        "Ungültiges Dateiformat. Bitte wählen Sie eine Datei im Format .json, .csv oder .xlsx.",
      ),
    ).toBeInTheDocument()
  })

  it("rejects file exceeding 5 MB", async () => {
    renderWithProviders(
      <MemoryRouter>
        <AdminImportPage />
      </MemoryRouter>,
    )

    const fileInput = screen.getByLabelText("Katalogdatei auswählen")

    const largeFile = new File(
      [new Uint8Array(6 * 1024 * 1024)],
      "catalog.json",
      { type: "application/json" },
    )
    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    expect(await screen.findByText(/Die Datei ist zu groß/)).toBeInTheDocument()
  })

  it("uploads a valid file, displays preview summary and requires confirmation for in-use items", async () => {
    vi.spyOn(catalogAdminApi, "previewImport").mockResolvedValue(mockPreview)
    vi.spyOn(catalogAdminApi, "applyImport").mockResolvedValue(mockApplyResult)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminImportPage />
      </MemoryRouter>,
    )

    const validFile = new File(['{"catalog": true}'], "catalog.json", {
      type: "application/json",
    })
    const fileInput = screen.getByLabelText("Katalogdatei auswählen")
    await user.upload(fileInput, validFile)

    const previewButton = screen.getByRole("button", {
      name: "Vorschau erstellen",
    })
    expect(previewButton).toBeEnabled()
    await user.click(previewButton)

    expect(catalogAdminApi.previewImport).toHaveBeenCalledWith(validFile)

    // Summary displayed
    expect(
      await screen.findByText(/Import-Vorschau — Geplante Änderungen/),
    ).toBeInTheDocument()
    expect(screen.getByText("Buch 1")).toBeInTheDocument()
    expect(screen.getByText("Reihe Alpha — Band 1")).toBeInTheDocument()

    // In-use warning displayed
    expect(
      screen.getByText(/Achtung: Verwendete Elemente werden archiviert/),
    ).toBeInTheDocument()
    expect(screen.getByText("Lied 99")).toBeInTheDocument()

    // Apply button is disabled because requiresConfirmation is true and checkbox not checked
    const applyButton = screen.getByRole("button", { name: "Plan anwenden" })
    expect(applyButton).toBeDisabled()

    // Check confirmation
    const confirmCheckbox = screen.getByLabelText(
      /Ich bestätige die Archivierung der oben aufgelisteten verwendeten Elemente/,
    )
    await user.click(confirmCheckbox)

    // Now apply button is enabled
    expect(applyButton).toBeEnabled()
    await user.click(applyButton)

    expect(catalogAdminApi.applyImport).toHaveBeenCalledWith({
      file: validFile,
      planHash: "hash-12345",
      confirmInUse: true,
    })

    expect(
      await screen.findByText(
        "Katalog wurde erfolgreich importiert und die Datenbank aktualisiert.",
      ),
    ).toBeInTheDocument()
  })

  it("handles 400 LIBRARY_FILE_INVALID with line-level validation errors", async () => {
    const validationError = new HttpError(
      400,
      "Validation failed",
      undefined,
      "LIBRARY_FILE_INVALID",
      {
        errors: [
          {
            line: 12,
            code: "MISSING_TITLE",
            message: "Titel fehlt in Zeile 12",
          },
          {
            line: 45,
            code: "INVALID_NUMBER",
            message: "Ungültige Liednummer in Zeile 45",
          },
        ],
      },
    )

    vi.spyOn(catalogAdminApi, "previewImport").mockRejectedValue(
      validationError,
    )

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminImportPage />
      </MemoryRouter>,
    )

    const validFile = new File(["invalid-csv"], "catalog.csv", {
      type: "text/csv",
    })
    await user.upload(
      screen.getByLabelText("Katalogdatei auswählen"),
      validFile,
    )

    await user.click(screen.getByRole("button", { name: "Vorschau erstellen" }))

    expect(
      await screen.findByText("Validierungsfehler in der Importdatei:"),
    ).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("Titel fehlt in Zeile 12")).toBeInTheDocument()
    expect(screen.getByText("45")).toBeInTheDocument()
    expect(
      screen.getByText("Ungültige Liednummer in Zeile 45"),
    ).toBeInTheDocument()
  })

  it("handles 409 LIBRARY_IMPORT_PLAN_CHANGED on apply", async () => {
    const planChangedError = new HttpError(
      409,
      "Plan changed",
      undefined,
      "LIBRARY_IMPORT_PLAN_CHANGED",
    )

    const previewWithoutInUse: ImportPreviewView = {
      ...mockPreview,
      inUse: [],
      requiresConfirmation: false,
    }

    vi.spyOn(catalogAdminApi, "previewImport").mockResolvedValue(
      previewWithoutInUse,
    )
    vi.spyOn(catalogAdminApi, "applyImport").mockRejectedValue(planChangedError)

    const { user } = renderWithProviders(
      <MemoryRouter>
        <AdminImportPage />
      </MemoryRouter>,
    )

    const file = new File(["{}"], "catalog.json", {
      type: "application/json",
    })
    await user.upload(screen.getByLabelText("Katalogdatei auswählen"), file)

    await user.click(screen.getByRole("button", { name: "Vorschau erstellen" }))

    const applyButton = await screen.findByRole("button", {
      name: "Plan anwenden",
    })
    await user.click(applyButton)

    expect(
      await screen.findByText(
        "Der Importplan ist veraltet oder die Quelldatei hat sich geändert. Bitte erstellen Sie die Vorschau erneut.",
      ),
    ).toBeInTheDocument()
  })
})
