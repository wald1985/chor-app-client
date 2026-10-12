import { useMemo, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap"
import { useActiveCommunity } from "../../auth/hooks/useActiveCommunity"
import { useCommunityPermission } from "../../auth/hooks/useCommunityPermission"
import { PersonFormModal } from "../components/PersonFormModal"
import {
  useArchivePerson,
  useCreatePerson,
  useRestorePerson,
  usePeople,
  useUpdatePerson,
} from "../hooks/usePeople"
import type { PersonRole, PersonView } from "../types/people.types"
import {
  getArchivedConflictPersonId,
  getPersonErrorMessage,
  PERSON_ROLES,
  roleLabel,
} from "../utils/personLabels"

type Feedback = { variant: "success" | "danger"; message: string }

const collator = new Intl.Collator("de", { sensitivity: "base" })

export const PeoplePage = () => {
  const community = useActiveCommunity()
  const communityId = community?.communityId ?? ""
  const canManage = useCommunityPermission(communityId, "PEOPLE_MANAGE")

  // A choir has tens of people, so everything is loaded once and filtered here.
  const { data, isLoading, error } = usePeople(communityId, {
    includeArchived: true,
  })

  const createMutation = useCreatePerson(communityId)
  const updateMutation = useUpdatePerson(communityId)
  const archiveMutation = useArchivePerson(communityId)
  const restoreMutation = useRestorePerson(communityId)

  const [roleFilter, setRoleFilter] = useState<PersonRole | "">("")
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PersonView | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [archivedConflictId, setArchivedConflictId] = useState<string | null>(
    null,
  )
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const people = useMemo(
    () =>
      [...(data ?? [])]
        .filter(p => showArchived || !p.archived)
        .filter(p => !roleFilter || p.roles.includes(roleFilter))
        .sort((a, b) => collator.compare(a.name, b.name)),
    [data, showArchived, roleFilter],
  )

  if (!community) {
    return (
      <Alert variant="info">
        Sie gehören noch keiner Chorgemeinschaft an. Personen können erst nach
        der Aufnahme in eine Chorgemeinschaft verwaltet werden.
      </Alert>
    )
  }

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    setArchivedConflictId(null)
    setFormOpen(true)
  }

  const openEdit = (person: PersonView) => {
    setEditing(person)
    setFormError(null)
    setArchivedConflictId(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
  }

  const handleSubmit = (input: { name: string; roles: PersonRole[] }) => {
    setFormError(null)
    setArchivedConflictId(null)
    const onError = (err: Error) => {
      setFormError(getPersonErrorMessage(err))
      setArchivedConflictId(getArchivedConflictPersonId(err))
    }

    if (editing) {
      updateMutation.mutate(
        { personId: editing.id, input },
        {
          onSuccess: person => {
            closeForm()
            setFeedback({
              variant: "success",
              message: `«${person.name}» wurde gespeichert.`,
            })
          },
          onError,
        },
      )
      return
    }

    createMutation.mutate(input, {
      onSuccess: person => {
        closeForm()
        setFeedback({
          variant: "success",
          message: `«${person.name}» wurde hinzugefügt.`,
        })
      },
      onError,
    })
  }

  const handleRestoreConflicting = () => {
    if (!archivedConflictId) return
    restoreMutation.mutate(archivedConflictId, {
      onSuccess: person => {
        closeForm()
        setFeedback({
          variant: "success",
          message: `«${person.name}» wurde wiederhergestellt.`,
        })
      },
      onError: err => {
        setFormError(getPersonErrorMessage(err))
        setArchivedConflictId(null)
      },
    })
  }

  const handleToggleArchive = (person: PersonView) => {
    const mutation = person.archived ? restoreMutation : archiveMutation
    mutation.mutate(person.id, {
      onSuccess: () => {
        setFeedback({
          variant: "success",
          message: person.archived
            ? `«${person.name}» wurde wiederhergestellt.`
            : `«${person.name}» wurde archiviert.`,
        })
      },
      onError: err => {
        setFeedback({ variant: "danger", message: getPersonErrorMessage(err) })
      },
    })
  }

  const isBusy = archiveMutation.isPending || restoreMutation.isPending

  return (
    <div className="pb-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Personen verwalten</h1>
          <p className="text-muted mb-0">
            Klavierspieler und Dirigenten von {community.communityName}. Eine
            Person kann beide Rollen haben.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={openCreate}>
            Person hinzufügen
          </Button>
        )}
      </div>

      {!canManage && (
        <Alert variant="secondary" className="small">
          Sie können die Personen einsehen. Zum Ändern benötigen Sie die
          Berechtigung «Personen verwalten» von einem Administrator.
        </Alert>
      )}

      {feedback && (
        <Alert
          variant={feedback.variant}
          dismissible
          onClose={() => {
            setFeedback(null)
          }}
        >
          {feedback.message}
        </Alert>
      )}

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} md={5}>
              <Form.Group controlId="peopleRoleFilter">
                <Form.Label className="small fw-semibold text-muted">
                  Rolle
                </Form.Label>
                <Form.Select
                  value={roleFilter}
                  onChange={e => {
                    setRoleFilter(e.target.value as PersonRole | "")
                  }}
                >
                  <option value="">Alle Rollen</option>
                  {PERSON_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={7}>
              <Form.Check
                type="switch"
                id="peopleShowArchived"
                label="Archivierte Personen anzeigen"
                checked={showArchived}
                onChange={e => {
                  setShowArchived(e.target.checked)
                }}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" role="status" />
          <p className="mt-2 text-muted">Personen werden geladen...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          Die Personen konnten nicht geladen werden.
        </Alert>
      ) : people.length === 0 ? (
        <Card className="text-center py-5 text-muted border-0 bg-light">
          <Card.Body>
            <div className="fs-1 mb-2">🎹</div>
            <h2 className="h5">Keine Personen gefunden</h2>
            <p className="small mb-0">
              {(data ?? []).length === 0
                ? "Es wurden noch keine Personen angelegt."
                : "Passen Sie die Filter an."}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm border">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Rollen</th>
                {canManage && <th className="text-end">Aktionen</th>}
              </tr>
            </thead>
            <tbody>
              {people.map(person => (
                <tr key={person.id}>
                  <td
                    className={person.archived ? "text-muted" : "fw-semibold"}
                  >
                    {person.name}
                    {person.archived && (
                      <Badge bg="secondary" className="ms-2">
                        Archiviert
                      </Badge>
                    )}
                  </td>
                  <td>
                    {person.roles.map(role => (
                      <Badge
                        key={role}
                        bg="light"
                        text="dark"
                        className="border me-1"
                      >
                        {roleLabel(role)}
                      </Badge>
                    ))}
                  </td>
                  {canManage && (
                    <td className="text-end text-nowrap">
                      {!person.archived && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="me-2"
                          aria-label={`${person.name} bearbeiten`}
                          onClick={() => {
                            openEdit(person)
                          }}
                        >
                          Bearbeiten
                        </Button>
                      )}
                      <Button
                        variant={
                          person.archived ? "outline-success" : "outline-danger"
                        }
                        size="sm"
                        disabled={isBusy}
                        aria-label={`${person.name} ${person.archived ? "wiederherstellen" : "archivieren"}`}
                        onClick={() => {
                          handleToggleArchive(person)
                        }}
                      >
                        {person.archived ? "Wiederherstellen" : "Archivieren"}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <PersonFormModal
        show={formOpen}
        person={editing}
        isLoading={
          createMutation.isPending ||
          updateMutation.isPending ||
          restoreMutation.isPending
        }
        error={formError}
        onRestoreExisting={archivedConflictId ? handleRestoreConflicting : null}
        onSubmit={handleSubmit}
        onCancel={closeForm}
      />
    </div>
  )
}
