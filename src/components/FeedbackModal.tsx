import type { SyntheticEvent } from "react"
import { useState } from "react"
import { Alert, Button, Form, Modal } from "react-bootstrap"

type FeedbackModalProps = {
  show: boolean
  onHide: () => void
}

export const FeedbackModal = ({ show, onHide }: FeedbackModalProps) => {
  const [category, setCategory] = useState<string>("vorschlag")
  const [message, setMessage] = useState<string>("")
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

  const handleClose = () => {
    setIsSubmitted(false)
    setMessage("")
    onHide()
  }

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setIsSubmitted(true)
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      aria-labelledby="feedback-modal-title"
    >
      <Modal.Header closeButton>
        <Modal.Title
          id="feedback-modal-title"
          className="d-flex align-items-center gap-2"
        >
          <span>💬</span>
          <span>Feedback geben</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="info" className="small mb-3">
          <strong>Hinweis:</strong> Die direkte Feedback-Übermittlung befindet
          sich aktuell im Aufbau. Sie können uns Ihre Nachricht gerne schon
          hinterlassen.
        </Alert>

        {isSubmitted ? (
          <Alert variant="success" className="mb-0">
            <strong>Vielen Dank!</strong> Ihre Rückmeldung wurde
            entgegengenommen und hilft uns bei der Weiterentwicklung der
            Chor-App.
          </Alert>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="feedbackCategory">
              <Form.Label className="small fw-semibold text-muted">
                Kategorie
              </Form.Label>
              <Form.Select
                value={category}
                onChange={e => {
                  setCategory(e.target.value)
                }}
              >
                <option value="vorschlag">Verbesserungsvorschlag</option>
                <option value="fehler">Fehlerbericht</option>
                <option value="frage">Frage zur Bedienung</option>
                <option value="lob">Lob &amp; Sonstiges</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="feedbackMessage">
              <Form.Label className="small fw-semibold text-muted">
                Ihre Nachricht
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Beschreiben Sie Ihre Erfahrungen, Wünsche oder Anmerkungen..."
                value={message}
                onChange={e => {
                  setMessage(e.target.value)
                }}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!message.trim()}
              >
                Feedback absenden
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>

      {isSubmitted ? (
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            Schließen
          </Button>
        </Modal.Footer>
      ) : null}
    </Modal>
  )
}
