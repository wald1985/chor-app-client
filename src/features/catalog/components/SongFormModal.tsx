import type { SyntheticEvent } from "react"
import { useEffect, useState } from "react"
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap"

export type SongFormData = {
  number: string
  title: string
  author: string | null
  arranger: string | null
}

type SongFormModalProps = {
  show: boolean
  initialNumber?: string
  initialTitle?: string
  initialAuthor?: string | null
  initialArranger?: string | null
  isEdit?: boolean
  isLoading?: boolean
  error?: string | null
  onSubmit: (data: SongFormData) => void
  onCancel: () => void
}

export const SongFormModal = ({
  show,
  initialNumber = "",
  initialTitle = "",
  initialAuthor = null,
  initialArranger = null,
  isEdit = false,
  isLoading = false,
  error = null,
  onSubmit,
  onCancel,
}: SongFormModalProps) => {
  const [number, setNumber] = useState(initialNumber)
  const [title, setTitle] = useState(initialTitle)
  const [author, setAuthor] = useState(initialAuthor ?? "")
  const [arranger, setArranger] = useState(initialArranger ?? "")

  useEffect(() => {
    if (show) {
      setNumber(initialNumber)
      setTitle(initialTitle)
      setAuthor(initialAuthor ?? "")
      setArranger(initialArranger ?? "")
    }
  }, [show, initialNumber, initialTitle, initialAuthor, initialArranger])

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedNumber = number.trim()
    const trimmedTitle = title.trim()
    if (!trimmedNumber || !trimmedTitle) {
      return
    }

    onSubmit({
      number: trimmedNumber,
      title: trimmedTitle,
      author: author.trim() || null,
      arranger: arranger.trim() || null,
    })
  }

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>
          {isEdit ? "Lied bearbeiten" : "Neues Lied anlegen"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <Form.Group controlId="song-number" className="mb-3">
            <Form.Label>Liednummer *</Form.Label>
            <Form.Control
              type="text"
              required
              maxLength={20}
              placeholder="z. B. 42 oder 105a"
              value={number}
              onChange={e => {
                setNumber(e.target.value)
              }}
              disabled={isLoading}
              autoFocus
            />
          </Form.Group>

          <Form.Group controlId="song-title" className="mb-3">
            <Form.Label>Titel des Liedes *</Form.Label>
            <Form.Control
              type="text"
              required
              maxLength={300}
              placeholder="z. B. Großer Gott, wir loben dich"
              value={title}
              onChange={e => {
                setTitle(e.target.value)
              }}
              disabled={isLoading}
            />
          </Form.Group>

          <Form.Group controlId="song-author" className="mb-3">
            <Form.Label>Autor / Text (optional)</Form.Label>
            <Form.Control
              type="text"
              maxLength={200}
              placeholder="z. B. Ignaz Franz"
              value={author}
              onChange={e => {
                setAuthor(e.target.value)
              }}
              disabled={isLoading}
            />
          </Form.Group>

          <Form.Group controlId="song-arranger" className="mb-3">
            <Form.Label>Arrangeur / Melodie (optional)</Form.Label>
            <Form.Control
              type="text"
              maxLength={200}
              placeholder="z. B. Peter Ritter"
              value={arranger}
              onChange={e => {
                setArranger(e.target.value)
              }}
              disabled={isLoading}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading || !number.trim() || !title.trim()}
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
              "Lied anlegen"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
