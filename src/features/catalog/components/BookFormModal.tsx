import type { SyntheticEvent } from "react"
import { useEffect, useState } from "react"
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap"
import type { SeriesView } from "../types/catalog.types"

type BookFormData = {
  title: string
  seriesId: string | null
  volume: number | null
}

type BookFormModalProps = {
  show: boolean
  initialTitle?: string
  initialSeriesId?: string | null
  initialVolume?: number | null
  seriesList: SeriesView[]
  isEdit?: boolean
  isLoading?: boolean
  error?: string | null
  onSubmit: (data: BookFormData) => void
  onCancel: () => void
}

export const BookFormModal = ({
  show,
  initialTitle = "",
  initialSeriesId = null,
  initialVolume = null,
  seriesList,
  isEdit = false,
  isLoading = false,
  error = null,
  onSubmit,
  onCancel,
}: BookFormModalProps) => {
  const [title, setTitle] = useState(initialTitle)
  const [seriesId, setSeriesId] = useState<string>(initialSeriesId ?? "")
  const [volume, setVolume] = useState<string>(
    typeof initialVolume === "number" ? String(initialVolume) : "",
  )

  useEffect(() => {
    if (show) {
      setTitle(initialTitle)
      setSeriesId(initialSeriesId ?? "")
      setVolume(typeof initialVolume === "number" ? String(initialVolume) : "")
    }
  }, [show, initialTitle, initialSeriesId, initialVolume])

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const parsedSeriesId = seriesId.trim() ? seriesId : null
    const parsedVolume = parsedSeriesId && volume.trim() ? Number(volume) : null

    onSubmit({
      title: trimmedTitle,
      seriesId: parsedSeriesId,
      volume: parsedVolume,
    })
  }

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>
          {isEdit ? "Buch bearbeiten" : "Neues Buch anlegen"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <Form.Group controlId="book-title" className="mb-3">
            <Form.Label>Titel des Buches</Form.Label>
            <Form.Control
              type="text"
              required
              maxLength={200}
              placeholder="z. B. Buch 1"
              value={title}
              onChange={e => {
                setTitle(e.target.value)
              }}
              disabled={isLoading}
              autoFocus
            />
          </Form.Group>

          <Form.Group controlId="book-series" className="mb-3">
            <Form.Label>Serie (optional)</Form.Label>
            <Form.Select
              value={seriesId}
              onChange={e => {
                const nextSeriesId = e.target.value
                setSeriesId(nextSeriesId)
                if (!nextSeriesId) {
                  setVolume("")
                }
              }}
              disabled={isLoading}
            >
              <option value="">Keine Serie (eigenständiges Buch)</option>
              {seriesList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} {s.archived ? "(archiviert)" : ""}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Wählen Sie eine Serie, wenn dieses Buch Teil einer fortlaufend
              nummerierten Reihe ist.
            </Form.Text>
          </Form.Group>

          {seriesId ? (
            <Form.Group controlId="book-volume" className="mb-3">
              <Form.Label>Bandnummer in der Serie</Form.Label>
              <Form.Control
                type="number"
                min={1}
                step={1}
                placeholder="z. B. 1"
                value={volume}
                onChange={e => {
                  setVolume(e.target.value)
                }}
                disabled={isLoading}
              />
              <Form.Text className="text-muted">
                Band innerhalb der Serie (z. B. 1 für „Buch 1“).
              </Form.Text>
            </Form.Group>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading || !title.trim()}
          >
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
            ) : isEdit ? (
              "Speichern"
            ) : (
              "Buch anlegen"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
