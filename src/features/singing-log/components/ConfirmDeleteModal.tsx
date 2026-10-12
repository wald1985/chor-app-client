import { Button, Modal } from "react-bootstrap"

type ConfirmDeleteModalProps = {
  show: boolean
  title: string
  message: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDeleteModal = ({
  show,
  title,
  message,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) => (
  <Modal show={show} onHide={onCancel} centered>
    <Modal.Header closeButton={!isLoading}>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>{message}</Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
        Abbrechen
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
        Löschen
      </Button>
    </Modal.Footer>
  </Modal>
)
