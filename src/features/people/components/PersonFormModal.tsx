import type { SyntheticEvent } from "react"
import { useEffect, useState } from "react"
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap"
import type { PersonRole, PersonView } from "../types/people.types"
import { PERSON_ROLES } from "../utils/personLabels"

type PersonFormModalProps = {
  show: boolean
  /** Person being edited; omit to create a new one. */
  person?: PersonView | null
  isLoading?: boolean
  error?: string | null
  /** Offered with the error when the name belongs to an archived Person. */
  onRestoreExisting?: (() => void) | null
  onSubmit: (input: { name: string; roles: PersonRole[] }) => void
  onCancel: () => void
}

export const PersonFormModal = ({
  show,
  person = null,
  isLoading = false,
  error = null,
  onRestoreExisting = null,
  onSubmit,
  onCancel,
}: PersonFormModalProps) => {
  const [name, setName] = useState("")
  const [roles, setRoles] = useState<PersonRole[]>([])

  useEffect(() => {
    if (show) {
      setName(person?.name ?? "")
      setRoles(person?.roles ?? [])
    }
  }, [show, person])

  const toggleRole = (role: PersonRole) => {
    setRoles(current =>
      current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role],
    )
  }

  const trimmed = name.trim()
  const canSubmit = trimmed.length > 0 && roles.length > 0

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit({ name: trimmed, roles })
  }

  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>
          {person ? "Person bearbeiten" : "Person hinzufügen"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error ? (
            <Alert variant="danger">
              <div>{error}</div>
              {onRestoreExisting && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="mt-2"
                  onClick={onRestoreExisting}
                  disabled={isLoading}
                >
                  Archivierte Person wiederherstellen
                </Button>
              )}
            </Alert>
          ) : null}
          <Form.Group controlId="person-name" className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              required
              maxLength={100}
              placeholder="z. B. Anna K."
              value={name}
              onChange={e => {
                setName(e.target.value)
              }}
              disabled={isLoading}
              autoFocus
            />
          </Form.Group>
          <fieldset>
            <legend className="fs-6 fw-semibold">Rollen</legend>
            {PERSON_ROLES.map(role => (
              <Form.Check
                key={role.value}
                type="checkbox"
                id={`person-role-${role.value}`}
                label={role.label}
                checked={roles.includes(role.value)}
                onChange={() => {
                  toggleRole(role.value)
                }}
                disabled={isLoading}
              />
            ))}
            <Form.Text className="text-muted">
              Mindestens eine Rolle; beide Rollen sind möglich.
            </Form.Text>
          </fieldset>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading || !canSubmit}
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
            ) : person ? (
              "Speichern"
            ) : (
              "Hinzufügen"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
