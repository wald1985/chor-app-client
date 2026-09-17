import { useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Stack,
  Table,
} from "react-bootstrap"
import { Link } from "react-router-dom"
import { HttpError } from "../../../../lib/http/httpError"
import { ThemeFormModal } from "../../components/ThemeFormModal"
import { UsageWarningModal } from "../../components/UsageWarningModal"
import { useCatalogAdminMutations } from "../../hooks/useCatalogAdminMutations"
import { useThemesListQuery } from "../../hooks/useCatalogQueries"
import type { LibraryItemUsage, ThemeView } from "../../types/catalog.types"

export const AdminThemesPage = () => {
  const [includeArchived, setIncludeArchived] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modals state
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false)
  const [themeToEdit, setThemeToEdit] = useState<ThemeView | null>(null)
  const [usageWarning, setUsageWarning] = useState<{
    themeId: string
    themeName: string
    usage: LibraryItemUsage
  } | null>(null)

  const {
    data: themes = [],
    isLoading,
    error: themesError,
  } = useThemesListQuery({ includeArchived })

  const { createTheme, renameTheme, archiveTheme, restoreTheme } =
    useCatalogAdminMutations()

  const handleOpenCreateTheme = () => {
    setThemeToEdit(null)
    setIsThemeModalOpen(true)
  }

  const handleOpenEditTheme = (theme: ThemeView) => {
    setThemeToEdit(theme)
    setIsThemeModalOpen(true)
  }

  const handleSaveTheme = async (name: string) => {
    setErrorMessage(null)
    if (themeToEdit) {
      await renameTheme.mutateAsync({
        themeId: themeToEdit.id,
        input: { name },
      })
      setSuccessMessage(`Thema „${name}“ wurde umbenannt.`)
    } else {
      await createTheme.mutateAsync({ name })
      setSuccessMessage(`Thema „${name}“ wurde angelegt.`)
    }
    setIsThemeModalOpen(false)
  }

  const handleArchiveTheme = async (
    themeId: string,
    themeName: string,
    confirmInUse = false,
  ) => {
    setErrorMessage(null)
    try {
      await archiveTheme.mutateAsync({ themeId, confirmInUse })
      setUsageWarning(null)
      setSuccessMessage(`Thema „${themeName}“ wurde archiviert.`)
    } catch (err) {
      if (err instanceof HttpError && err.code === "LIBRARY_ITEM_IN_USE") {
        const payload = err.payload as { usage?: LibraryItemUsage } | undefined
        if (payload?.usage) {
          setUsageWarning({
            themeId,
            themeName,
            usage: payload.usage,
          })
          return
        }
      }
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Fehler beim Archivieren des Themas.",
      )
    }
  }

  const handleRestoreTheme = async (themeId: string, themeName: string) => {
    setErrorMessage(null)
    try {
      await restoreTheme.mutateAsync(themeId)
      setSuccessMessage(`Thema „${themeName}“ wurde wiederhergestellt.`)
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Fehler beim Wiederherstellen des Themas.",
      )
    }
  }

  return (
    <div>
      <div className="mb-2">
        <Link
          to="/admin/library/books"
          className="btn btn-sm btn-outline-secondary"
        >
          &larr; Zurück zu Büchern
        </Link>
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Bibliothek — Hauptthemen</h1>
          <p className="text-muted mb-0">
            Verwaltung der thematischen Kategorien zur Verschlagwortung von
            Liedern.
          </p>
        </div>
        <Stack direction="horizontal" gap={2}>
          <Button variant="primary" onClick={handleOpenCreateTheme}>
            + Neues Thema
          </Button>
        </Stack>
      </div>

      {errorMessage && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => {
            setErrorMessage(null)
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => {
            setSuccessMessage(null)
          }}
        >
          {successMessage}
        </Alert>
      )}

      {themesError && (
        <Alert variant="danger">
          Fehler beim Laden der Themen: {themesError.message}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col xs={12} md={6}>
              <Form.Check
                type="checkbox"
                id="includeArchivedThemes"
                label="Archivierte anzeigen"
                checked={includeArchived}
                onChange={e => {
                  setIncludeArchived(e.target.checked)
                }}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-2 text-muted">Themen werden geladen...</p>
        </div>
      ) : themes.length === 0 ? (
        <Card className="text-center py-5 text-muted">
          <Card.Body>
            <p className="mb-2 fs-5">Keine Themen gefunden.</p>
            <p className="small mb-0">
              Legen Sie ein neues Thema an, um Lieder zu kategorisieren.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th className="text-center">Zugeordnete Lieder</th>
                <th className="text-center">Status</th>
                <th className="text-end">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {themes.map(theme => (
                <tr key={theme.id}>
                  <td className="fw-semibold">{theme.name}</td>
                  <td className="text-center">
                    <Badge bg="light" text="dark" className="border">
                      {theme.songCount}
                    </Badge>
                  </td>
                  <td className="text-center">
                    {theme.archived ? (
                      <Badge bg="secondary">Archiviert</Badge>
                    ) : (
                      <Badge bg="success">Aktiv</Badge>
                    )}
                  </td>
                  <td className="text-end">
                    <Stack
                      direction="horizontal"
                      gap={2}
                      className="justify-content-end"
                    >
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          handleOpenEditTheme(theme)
                        }}
                      >
                        Umbenennen
                      </Button>
                      {theme.archived ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          disabled={restoreTheme.isPending}
                          onClick={() => {
                            void handleRestoreTheme(theme.id, theme.name)
                          }}
                        >
                          Wiederherstellen
                        </Button>
                      ) : (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          disabled={archiveTheme.isPending}
                          onClick={() => {
                            void handleArchiveTheme(theme.id, theme.name)
                          }}
                        >
                          Archivieren
                        </Button>
                      )}
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Theme Create / Edit Modal */}
      <ThemeFormModal
        show={isThemeModalOpen}
        initialName={themeToEdit?.name ?? ""}
        isEdit={Boolean(themeToEdit)}
        isLoading={createTheme.isPending || renameTheme.isPending}
        onCancel={() => {
          setIsThemeModalOpen(false)
        }}
        onSubmit={name => {
          void handleSaveTheme(name)
        }}
      />

      {/* Usage Warning Confirmation Modal (on 409 Conflict) */}
      <UsageWarningModal
        show={Boolean(usageWarning)}
        itemTitle={usageWarning?.themeName ?? ""}
        usage={usageWarning?.usage ?? null}
        isLoading={archiveTheme.isPending}
        onConfirm={() => {
          if (usageWarning) {
            void handleArchiveTheme(
              usageWarning.themeId,
              usageWarning.themeName,
              true,
            )
          }
        }}
        onCancel={() => {
          setUsageWarning(null)
        }}
      />
    </div>
  )
}
