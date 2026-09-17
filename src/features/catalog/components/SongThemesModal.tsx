import type { SyntheticEvent } from "react"
import { useEffect, useState } from "react"
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap"
import type { ThemeView } from "../types/catalog.types"

type SongThemesModalProps = {
  show: boolean
  songTitle: string
  songNumber: string
  currentThemeIds: string[]
  themesList: ThemeView[]
  isLoading?: boolean
  error?: string | null
  onSubmit: (themeIds: string[]) => void
  onCancel: () => void
}

export const SongThemesModal = ({
  show,
  songTitle,
  songNumber,
  currentThemeIds,
  themesList,
  isLoading = false,
  error = null,
  onSubmit,
  onCancel,
}: SongThemesModalProps) => {
  const [selectedThemeIds, setSelectedThemeIds] =
    useState<string[]>(currentThemeIds)

  useEffect(() => {
    if (show) {
      setSelectedThemeIds(currentThemeIds)
    }
  }, [show, currentThemeIds])

  const handleToggleTheme = (themeId: string, checked: boolean) => {
    if (checked) {
      setSelectedThemeIds(prev => [...prev, themeId])
    } else {
      setSelectedThemeIds(prev => prev.filter(id => id !== themeId))
    }
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(selectedThemeIds)
  }

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>Themen zuweisen</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <div className="mb-3">
            <span className="text-muted small">Lied:</span>
            <div className="fw-semibold">
              Nr. {songNumber} — {songTitle}
            </div>
          </div>

          <p className="small text-muted mb-2">
            Wählen Sie die zutreffenden Hauptthemen für dieses Lied aus:
          </p>

          {themesList.length === 0 ? (
            <p className="text-muted small">
              Es sind noch keine Hauptthemen im Katalog vorhanden.
            </p>
          ) : (
            <div
              className="border rounded p-3 bg-light"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {themesList.map(theme => (
                <Form.Check
                  key={theme.id}
                  type="checkbox"
                  id={`song-theme-${theme.id}`}
                  label={
                    <span>
                      {theme.name}{" "}
                      {theme.archived ? (
                        <span className="text-muted small">(archiviert)</span>
                      ) : null}
                    </span>
                  }
                  checked={selectedThemeIds.includes(theme.id)}
                  onChange={e => {
                    handleToggleTheme(theme.id, e.target.checked)
                  }}
                  disabled={isLoading}
                  className="mb-2"
                />
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Wird gespeichert...
              </>
            ) : (
              "Themen speichern"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
