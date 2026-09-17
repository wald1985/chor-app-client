import type { SyntheticEvent } from "react"
import { useEffect, useState } from "react"
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap"

type SeriesFormModalProps = {
  show: boolean
  initialTitle?: string
  isEdit?: boolean
  isLoading?: boolean
  error?: string | null
  onSubmit: (title: string) => void
  onCancel: () => void
}

export const SeriesFormModal = ({
  show,
  initialTitle = "",
  isEdit = false,
  isLoading = false,
  error = null,
  onSubmit,
  onCancel,
}: SeriesFormModalProps) => {
  const [title, setTitle] = useState(initialTitle)

  useEffect(() => {
    if (show) {
      setTitle(initialTitle)
    }
  }, [show, initialTitle])

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>
          {isEdit ? "Serie bearbeiten" : "Neue Serie anlegen"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <Form.Group controlId="series-title" className="mb-3">
            <Form.Label>Titel der Serie</Form.Label>
            <Form.Control
              type="text"
              required
              maxLength={200}
              placeholder="z. B. Bücher"
              value={title}
              onChange={e => {
                setTitle(e.target.value)
              }}
              disabled={isLoading}
              autoFocus
            />
            <Form.Text className="text-muted">
              Eine Serie fasst mehrere Buchbände mit fortlaufender Nummerierung
              zusammen.
            </Form.Text>
          </Form.Group>
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
              "Serie anlegen"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
