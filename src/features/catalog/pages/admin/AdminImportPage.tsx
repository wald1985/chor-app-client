import type { ChangeEvent } from "react"
import { useState } from "react"
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  ProgressBar,
  Row,
  Spinner,
  Stack,
  Table,
} from "react-bootstrap"
import { Link } from "react-router-dom"
import { HttpError } from "../../../../lib/http/httpError"
import { ImportInUseList } from "../../components/ImportInUseList"
import { ImportSummaryAlert } from "../../components/ImportSummaryAlert"
import { useCatalogAdminMutations } from "../../hooks/useCatalogAdminMutations"
import type {
  ImportPreviewView,
  LibraryFileValidationError,
} from "../../types/catalog.types"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export const AdminImportPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreviewView | null>(null)
  const [confirmInUse, setConfirmInUse] = useState<boolean>(false)

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<
    LibraryFileValidationError[]
  >([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { previewImport, applyImport } = useCatalogAdminMutations()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    setErrorMessage(null)
    setValidationErrors([])
    setPreview(null)
    setConfirmInUse(false)

    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `Die Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximale Dateigröße ist 5 MB.`,
      )
      setSelectedFile(null)
      return
    }

    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!ext || !["json", "csv", "xlsx"].includes(ext)) {
      setFileError(
        "Ungültiges Dateiformat. Bitte wählen Sie eine Datei im Format .json, .csv oder .xlsx.",
      )
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleGeneratePreview = async () => {
    if (!selectedFile) {
      return
    }

    setErrorMessage(null)
    setValidationErrors([])
    setSuccessMessage(null)
    setPreview(null)
    setConfirmInUse(false)

    try {
      const result = await previewImport.mutateAsync(selectedFile)
      setPreview(result)
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.code === "LIBRARY_FILE_INVALID") {
          const payload = err.payload as
            { errors?: LibraryFileValidationError[] } | undefined
          if (payload?.errors && payload.errors.length > 0) {
            setValidationErrors(payload.errors)
            return
          }
        }
        setErrorMessage(err.message || "Fehler beim Erstellen der Vorschau.")
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Fehler beim Erstellen der Vorschau.",
        )
      }
    }
  }

  const handleApplyImport = async () => {
    if (!selectedFile || !preview) {
      return
    }

    setErrorMessage(null)
    setValidationErrors([])

    try {
      await applyImport.mutateAsync({
        file: selectedFile,
        planHash: preview.planHash,
        confirmInUse,
      })
      setSuccessMessage(
        "Katalog wurde erfolgreich importiert und die Datenbank aktualisiert.",
      )
      setPreview(null)
      setSelectedFile(null)
      setConfirmInUse(false)
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.code === "LIBRARY_IMPORT_PLAN_CHANGED") {
          setErrorMessage(
            "Der Importplan ist veraltet oder die Quelldatei hat sich geändert. Bitte erstellen Sie die Vorschau erneut.",
          )
          return
        }
        if (err.code === "LIBRARY_ITEM_IN_USE") {
          setErrorMessage(
            "Verwendete Elemente müssen vor der Archivierung bestätigt werden.",
          )
          return
        }
        setErrorMessage(err.message || "Fehler beim Anwenden des Imports.")
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Fehler beim Anwenden des Imports.",
        )
      }
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

      <div className="mb-4">
        <h1 className="h3 mb-1">Katalog importieren</h1>
        <p className="text-muted mb-0">
          Unterstützte Formate: JSON, CSV, XLSX (Excel) bis max. 5 MB. Der
          Import wird zuerst geprüft und erzeugt eine Vorschau aller Änderungen.
        </p>
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

      {fileError && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => {
            setFileError(null)
          }}
        >
          {fileError}
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
          <Alert.Heading className="h6 mb-2">Import erfolgreich!</Alert.Heading>
          <p className="mb-2">{successMessage}</p>
          <hr />
          <div className="d-flex gap-2">
            <Link
              to="/admin/library/books"
              className="btn btn-sm btn-outline-success"
            >
              Zu den Büchern
            </Link>
          </div>
        </Alert>
      )}

      {/* Validation Errors Table */}
      {validationErrors.length > 0 && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading className="h6 mb-2">
            Validierungsfehler in der Importdatei:
          </Alert.Heading>
          <p className="small mb-3">
            Die Datei konnte nicht verarbeitet werden. Bitte korrigieren Sie die
            folgenden Fehler und laden Sie die Datei erneut hoch:
          </p>
          <div className="table-responsive bg-white rounded border">
            <Table hover size="sm" className="mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "80px" }}>Zeile</th>
                  <th style={{ width: "160px" }}>Code</th>
                  <th>Beschreibung</th>
                </tr>
              </thead>
              <tbody>
                {validationErrors.map((err, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold">{err.line ?? "—"}</td>
                    <td>
                      <code>{err.code}</code>
                    </td>
                    <td>{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Alert>
      )}

      {/* Step 1: File Selection Card */}
      <Card className="mb-4">
        <Card.Header className="fw-semibold">
          Schritt 1: Datei auswählen &amp; Vorschau erstellen
        </Card.Header>
        <Card.Body>
          <Form.Group controlId="importFileSelect" className="mb-3">
            <Form.Label className="fw-semibold">
              Katalogdatei auswählen
            </Form.Label>
            <Form.Control
              type="file"
              accept=".json,.csv,.xlsx,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              disabled={previewImport.isPending || applyImport.isPending}
            />
            <Form.Text className="text-muted">
              Wählen Sie eine gültige Katalogdatei (.json, .csv, .xlsx).
              Maximale Dateigröße: 5 MB.
            </Form.Text>
          </Form.Group>

          {previewImport.isPending && (
            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <Spinner animation="border" size="sm" variant="primary" />
                <span className="small text-muted">
                  Datei wird hochgeladen und analysiert...
                </span>
              </div>
              <ProgressBar animated now={100} variant="primary" />
            </div>
          )}

          <Button
            variant="primary"
            onClick={() => {
              void handleGeneratePreview()
            }}
            disabled={
              !selectedFile || previewImport.isPending || applyImport.isPending
            }
          >
            {previewImport.isPending
              ? "Vorschau wird erstellt..."
              : "Vorschau erstellen"}
          </Button>
        </Card.Body>
      </Card>

      {/* Step 2 & 3: Preview Results & Apply Plan */}
      {preview && (
        <div>
          <h2 className="h5 mb-3">Schritt 2: Geplante Änderungen prüfen</h2>

          {/* Metric Cards Summary */}
          <ImportSummaryAlert summary={preview.summary} />

          {/* In-Use Warning Banner */}
          <ImportInUseList inUse={preview.inUse} />

          {/* Detailed Books Accordion */}
          <Card className="mb-4">
            <Card.Header className="fw-semibold">
              Bücher &amp; Lieder Details ({preview.books.length} Bücher)
            </Card.Header>
            <Card.Body className="p-0">
              {preview.books.length === 0 ? (
                <div className="p-3 text-muted small">
                  Keine Bücher im Importplan enthalten.
                </div>
              ) : (
                <Accordion flush>
                  {preview.books.map((b, idx) => (
                    <Accordion.Item key={idx} eventKey={String(idx)}>
                      <Accordion.Header>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="fw-bold">{b.title}</span>
                          {b.series ? (
                            <Badge bg="info" className="text-dark">
                              {b.series}
                              {b.volume !== null
                                ? ` — Band ${String(b.volume)}`
                                : ""}
                            </Badge>
                          ) : null}
                          <Badge
                            bg={
                              b.action === "CREATE"
                                ? "success"
                                : b.action === "RESTORE"
                                  ? "info"
                                  : "secondary"
                            }
                          >
                            {b.action}
                          </Badge>
                          <span className="text-muted small ms-2">
                            (+{b.songs.create.length} neu, ~
                            {b.songs.update.length} aktualisiert, -
                            {b.songs.archive.length} archiviert)
                          </span>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row className="g-2 small">
                          <Col xs={12} md={6}>
                            <strong>Neu anzulegende Lieder:</strong>
                            <p className="text-muted mb-2">
                              {b.songs.create.length > 0
                                ? b.songs.create.join(", ")
                                : "Keine"}
                            </p>
                          </Col>
                          <Col xs={12} md={6}>
                            <strong>Aktualisierte Lieder:</strong>
                            <p className="text-muted mb-2">
                              {b.songs.update.length > 0
                                ? b.songs.update
                                    .map(
                                      u =>
                                        `Nr. ${u.number} (${u.fields.join(", ")})`,
                                    )
                                    .join("; ")
                                : "Keine"}
                            </p>
                          </Col>
                          {b.songs.archive.length > 0 && (
                            <Col xs={12}>
                              <strong className="text-danger">
                                Zu archivierende Lieder:
                              </strong>
                              <p className="text-danger mb-0">
                                {b.songs.archive.join(", ")}
                              </p>
                            </Col>
                          )}
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </Card.Body>
          </Card>

          {/* Step 3: Confirmation and Apply Action */}
          <Card className="border-success mb-4">
            <Card.Header className="bg-success bg-opacity-10 fw-semibold text-success-emphasis">
              Schritt 3: Plan anwenden &amp; Datenbank aktualisieren
            </Card.Header>
            <Card.Body>
              {preview.requiresConfirmation && (
                <div className="mb-3 p-3 bg-warning bg-opacity-10 border border-warning rounded">
                  <Form.Check
                    type="checkbox"
                    id="confirmInUseCheckbox"
                    label={
                      <strong>
                        Ich bestätige die Archivierung der oben aufgelisteten
                        verwendeten Elemente.
                      </strong>
                    }
                    checked={confirmInUse}
                    onChange={e => {
                      setConfirmInUse(e.target.checked)
                    }}
                    className="text-dark"
                  />
                  <small className="text-muted d-block mt-1">
                    Ohne diese Bestätigung kann der Importplan nicht angewendet
                    werden, da Elemente betroffen sind, die in bestehenden
                    Verläufen verwendet werden.
                  </small>
                </div>
              )}

              {applyImport.isPending && (
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Spinner animation="border" size="sm" variant="success" />
                    <span className="small text-muted">
                      Import wird angewendet und Datenbank aktualisiert...
                    </span>
                  </div>
                  <ProgressBar animated now={100} variant="success" />
                </div>
              )}

              <Stack direction="horizontal" gap={3}>
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => {
                    void handleApplyImport()
                  }}
                  disabled={
                    applyImport.isPending ||
                    (preview.requiresConfirmation && !confirmInUse)
                  }
                >
                  {applyImport.isPending
                    ? "Import wird angewendet..."
                    : "Plan anwenden"}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setPreview(null)
                  }}
                  disabled={applyImport.isPending}
                >
                  Abbrechen
                </Button>
              </Stack>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  )
}
