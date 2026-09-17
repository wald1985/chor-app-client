import type { SyntheticEvent } from "react"
import { useEffect, useState } from "react"
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap"

type ThemeFormModalProps = {
  show: boolean
  initialName?: string
  isEdit?: boolean
  isLoading?: boolean
  error?: string | null
  onSubmit: (name: string) => void
  onCancel: () => void
}

export const ThemeFormModal = ({
  show,
  initialName = "",
  isEdit = false,
  isLoading = false,
  error = null,
  onSubmit,
  onCancel,
}: ThemeFormModalProps) => {
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (show) {
      setName(initialName)
    }
  }, [show, initialName])

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>
          {isEdit ? "Thema umbenennen" : "Neues Hauptthema anlegen"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <Form.Group controlId="theme-name" className="mb-3">
            <Form.Label>Name des Hauptthemas</Form.Label>
            <Form.Control
              type="text"
              required
              maxLength={200}
              placeholder="z. B. Lob, Dank, Anbetung"
              value={name}
              onChange={e => {
                setName(e.target.value)
              }}
              disabled={isLoading}
              autoFocus
            />
            <Form.Text className="text-muted">
              Hauptthemen stehen global allen Büchern und Liedern zur Verfügung.
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
            disabled={isLoading || !name.trim()}
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
              "Thema anlegen"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
