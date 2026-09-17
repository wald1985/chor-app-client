import type { SubmitEvent } from "react"
import { useCallback, useEffect, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Form,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap"
import { useAppDispatch } from "../../../app/hooks"
import { getErrorCode, getErrorMessage } from "../../../lib/http/httpError"
import { FormError } from "../../auth/components/FormError"
import { updateAdminProfile } from "../adminAuthSlice"
import { superadminApi } from "../superadminApi"
import type { SuperadminView } from "../types"

export const SuperadminsListPage = () => {
  const dispatch = useAppDispatch()

  const [superadmins, setSuperadmins] = useState<SuperadminView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)

  // Edit modal state
  const [editingAdmin, setEditingAdmin] = useState<SuperadminView | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Delete modal state
  const [deletingAdmin, setDeletingAdmin] = useState<SuperadminView | null>(
    null,
  )
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const loadSuperadmins = useCallback(async () => {
    setIsLoading(true)
    setGeneralError(null)
    try {
      const list = await superadminApi.listSuperadmins()
      setSuperadmins(list)
    } catch (err) {
      setGeneralError(
        getErrorMessage(err, "Superadmins konnten nicht geladen werden."),
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSuperadmins()
  }, [loadSuperadmins])

  const handleOpenCreate = () => {
    setCreateName("")
    setCreateEmail("")
    setCreatePassword("")
    setCreateError(null)
    setShowCreateModal(true)
  }

  const handleCreateSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setCreateError(null)
    setIsSubmittingCreate(true)

    try {
      const created = await superadminApi.createSuperadmin({
        name: createName,
        email: createEmail,
        password: createPassword,
      })
      setShowCreateModal(false)
      setSuperadmins(prev => [...prev, created])
      setSuccessMessage(`Superadmin "${created.name}" wurde erstellt.`)
    } catch (err) {
      const code = getErrorCode(err)
      if (code === "SUPERADMIN_EMAIL_TAKEN") {
        setCreateError("Diese E-Mail-Adresse wird bereits verwendet.")
      } else {
        setCreateError(
          getErrorMessage(err, "Superadmin konnte nicht erstellt werden."),
        )
      }
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  const handleOpenEdit = (admin: SuperadminView) => {
    setEditingAdmin(admin)
    setEditName(admin.name)
    setEditEmail(admin.email)
    setEditError(null)
  }

  const handleEditSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (!editingAdmin) return

    setEditError(null)
    setIsSubmittingEdit(true)

    try {
      const updated = await superadminApi.updateSuperadmin(editingAdmin.id, {
        name: editName,
        email: editEmail,
      })
      setSuperadmins(prev =>
        prev.map(item => (item.id === updated.id ? updated : item)),
      )
      if (editingAdmin.isCurrent) {
        void dispatch(
          updateAdminProfile({ name: updated.name, email: updated.email }),
        )
      }
      setEditingAdmin(null)
      setSuccessMessage(`Superadmin "${updated.name}" wurde aktualisiert.`)
    } catch (err) {
      const code = getErrorCode(err)
      if (code === "SUPERADMIN_EMAIL_TAKEN") {
        setEditError("Diese E-Mail-Adresse wird bereits verwendet.")
      } else {
        setEditError(
          getErrorMessage(err, "Superadmin konnte nicht aktualisiert werden."),
        )
      }
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingAdmin) return

    setDeleteError(null)
    setIsSubmittingDelete(true)

    try {
      await superadminApi.deleteSuperadmin(deletingAdmin.id)
      setSuperadmins(prev => prev.filter(item => item.id !== deletingAdmin.id))
      setSuccessMessage(`Superadmin "${deletingAdmin.name}" wurde gelöscht.`)
      setDeletingAdmin(null)
    } catch (err) {
      const code = getErrorCode(err)
      if (code === "SUPERADMIN_LAST_REMAINING") {
        setDeleteError(
          "Der letzte verbleibende Superadmin kann nicht gelöscht werden.",
        )
      } else if (code === "SUPERADMIN_CANNOT_DELETE_SELF") {
        setDeleteError("Du kannst dich nicht selbst löschen.")
      } else {
        setDeleteError(
          getErrorMessage(err, "Superadmin konnte nicht gelöscht werden."),
        )
      }
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Superadmins</h1>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Superadmin hinzufügen
        </Button>
      </div>

      {successMessage ? (
        <Alert
          variant="success"
          dismissible
          onClose={() => {
            setSuccessMessage(null)
          }}
        >
          {successMessage}
        </Alert>
      ) : null}

      <FormError message={generalError} />

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table responsive hover className="align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Erstellt am</th>
              <th className="text-end">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {superadmins.map(admin => (
              <tr key={admin.id}>
                <td>
                  {admin.name}{" "}
                  {admin.isCurrent ? (
                    <Badge bg="secondary" className="ms-1">
                      Du
                    </Badge>
                  ) : null}
                </td>
                <td>{admin.email}</td>
                <td>{new Date(admin.createdAt).toLocaleDateString("de-DE")}</td>
                <td className="text-end">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      handleOpenEdit(admin)
                    }}
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    disabled={admin.isCurrent}
                    title={
                      admin.isCurrent
                        ? "Du kannst dich nicht selbst löschen"
                        : undefined
                    }
                    onClick={() => {
                      setDeletingAdmin(admin)
                      setDeleteError(null)
                    }}
                  >
                    Löschen
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Create Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => {
          if (!isSubmittingCreate) setShowCreateModal(false)
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Neuen Superadmin anlegen
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={event => void handleCreateSubmit(event)}>
          <Modal.Body>
            <FormError message={createError} />
            <Form.Group className="mb-3" controlId="create-admin-name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={createName}
                onChange={e => {
                  setCreateName(e.target.value)
                }}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="create-admin-email">
              <Form.Label>E-Mail</Form.Label>
              <Form.Control
                type="email"
                value={createEmail}
                onChange={e => {
                  setCreateEmail(e.target.value)
                }}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="create-admin-password">
              <Form.Label>Initiales Passwort</Form.Label>
              <Form.Control
                type="password"
                value={createPassword}
                onChange={e => {
                  setCreatePassword(e.target.value)
                }}
                required
                minLength={8}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false)
              }}
              disabled={isSubmittingCreate}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingCreate}
            >
              {isSubmittingCreate ? (
                <Spinner size="sm" animation="border" />
              ) : (
                "Anlegen"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={editingAdmin !== null}
        onHide={() => {
          if (!isSubmittingEdit) setEditingAdmin(null)
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Superadmin bearbeiten
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={event => void handleEditSubmit(event)}>
          <Modal.Body>
            <FormError message={editError} />
            <Form.Group className="mb-3" controlId="edit-admin-name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={editName}
                onChange={e => {
                  setEditName(e.target.value)
                }}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="edit-admin-email">
              <Form.Label>E-Mail</Form.Label>
              <Form.Control
                type="email"
                value={editEmail}
                onChange={e => {
                  setEditEmail(e.target.value)
                }}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingAdmin(null)
              }}
              disabled={isSubmittingEdit}
            >
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? (
                <Spinner size="sm" animation="border" />
              ) : (
                "Speichern"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={deletingAdmin !== null}
        onHide={() => {
          if (!isSubmittingDelete) setDeletingAdmin(null)
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            Superadmin löschen
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormError message={deleteError} />
          {deletingAdmin ? (
            <p>
              Möchtest du den Superadmin{" "}
              <strong>&quot;{deletingAdmin.name}&quot;</strong> (
              {deletingAdmin.email}) wirklich löschen?
            </p>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setDeletingAdmin(null)
            }}
            disabled={isSubmittingDelete}
          >
            Abbrechen
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              void handleDelete()
            }}
            disabled={isSubmittingDelete}
          >
            {isSubmittingDelete ? (
              <Spinner size="sm" animation="border" />
            ) : (
              "Löschen"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
