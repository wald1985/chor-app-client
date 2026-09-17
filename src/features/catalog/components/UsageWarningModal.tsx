import { Alert, Button, Modal, Spinner } from "react-bootstrap"
import type { LibraryItemUsage } from "../types/catalog.types"

type UsageWarningModalProps = {
  show: boolean
  itemTitle: string
  usage?: LibraryItemUsage | null
  isLoading?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export const UsageWarningModal = ({
  show,
  itemTitle,
  usage,
  isLoading = false,
  error = null,
  onConfirm,
  onCancel,
}: UsageWarningModalProps) => {
  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>Element ist in Verwendung</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <p>
          Das Element <strong>„{itemTitle}“</strong> wird aktuell in{" "}
          <strong>{usage?.communities ?? 0}</strong> Gemeinschaft(en) verwendet
          (<strong>{usage?.references ?? 0}</strong> Verweise).
        </p>
        <p className="text-muted small mb-0">
          Wenn Sie dieses Element archivieren, bleibt es in bestehenden
          Verläufen und Protokollen erhalten, kann jedoch in Gemeinschaften
          nicht neu ausgewählt werden.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Abbrechen
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
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
              Wird archiviert...
            </>
          ) : (
            "Trotzdem archivieren"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
