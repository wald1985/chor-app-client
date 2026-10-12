import { useState } from "react"
import {
  Alert,
  Badge,
  Card,
  Container,
  Form,
  Spinner,
  Table,
} from "react-bootstrap"
import { Link, useParams } from "react-router-dom"
import { useAppSelector } from "../../../app/hooks"
import { selectAuthMemberships } from "../../auth/authSlice"
import type { CommunityPermission } from "../../auth/types"
import {
  useCommunityMembers,
  useSetMemberPermissions,
} from "../hooks/useMembers"
import type { CommunityMemberView } from "../types/members.types"
import {
  getMemberErrorMessage,
  PERMISSION_OPTIONS,
} from "../utils/permissionLabels"

const collator = new Intl.Collator("de", { sensitivity: "base" })

/** Administrator-only: grant or revoke per-member permissions of a Community. */
export const MembersPage = () => {
  const { communityId = "" } = useParams<{ communityId: string }>()
  const memberships = useAppSelector(selectAuthMemberships)
  const community = memberships.find(m => m.communityId === communityId)
  const isAdministrator = community?.role === "ADMINISTRATOR"

  const { data, isLoading, error } = useCommunityMembers(
    communityId,
    isAdministrator,
  )
  const setPermissions = useSetMemberPermissions(communityId)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const members = [...(data ?? [])].sort(
    (a, b) =>
      Number(b.role === "ADMINISTRATOR") - Number(a.role === "ADMINISTRATOR") ||
      collator.compare(a.name, b.name),
  )

  const handleToggle = (
    member: CommunityMemberView,
    permission: CommunityPermission,
    checked: boolean,
  ) => {
    setErrorMessage(null)
    const next = checked
      ? [...member.permissions, permission]
      : member.permissions.filter(p => p !== permission)
    setPermissions.mutate(
      { membershipId: member.membershipId, permissions: next },
      {
        onError: err => {
          setErrorMessage(getMemberErrorMessage(err))
        },
      },
    )
  }

  const isSaving = (membershipId: string) =>
    setPermissions.isPending &&
    setPermissions.variables.membershipId === membershipId

  return (
    <Container fluid="md" className="py-4 px-0">
      <div className="mb-3">
        <Link
          to="/konto"
          className="text-decoration-none text-muted small d-inline-flex align-items-center gap-1"
        >
          <span>←</span>
          <span>Zurück zum Konto</span>
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="h3 mb-1">Mitglieder &amp; Berechtigungen</h1>
        <p className="text-muted mb-0">
          {community?.communityName ?? "Chorgemeinschaft"}: Legen Sie fest, was
          einzelne Mitglieder ändern dürfen. Ansehen dürfen alle Mitglieder
          alles.
        </p>
      </div>

      {!community ? (
        <Alert variant="warning">
          Diese Chorgemeinschaft wurde nicht gefunden.
        </Alert>
      ) : !isAdministrator ? (
        <Alert variant="secondary">
          Nur Administratoren können Berechtigungen verwalten.
        </Alert>
      ) : (
        <>
          {errorMessage && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => {
                setErrorMessage(null)
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" role="status" />
              <p className="mt-2 text-muted">Mitglieder werden geladen...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              Die Mitglieder konnten nicht geladen werden.
            </Alert>
          ) : (
            <>
              <div className="table-responsive bg-white rounded shadow-sm border">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Mitglied</th>
                      <th>Rolle</th>
                      <th>Berechtigungen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.membershipId}>
                        <td>
                          <div className="fw-semibold">{member.name}</div>
                          <div className="text-muted small">{member.email}</div>
                        </td>
                        <td>
                          <Badge
                            bg={
                              member.role === "ADMINISTRATOR"
                                ? "primary"
                                : "secondary"
                            }
                          >
                            {member.role === "ADMINISTRATOR"
                              ? "Administrator"
                              : "Mitglied"}
                          </Badge>
                        </td>
                        <td>
                          {member.role === "ADMINISTRATOR" ? (
                            <span className="text-muted small">
                              Alle Berechtigungen
                            </span>
                          ) : (
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              {PERMISSION_OPTIONS.map(option => (
                                <Form.Check
                                  key={option.value}
                                  type="switch"
                                  id={`perm-${member.membershipId}-${option.value}`}
                                  label={option.label}
                                  title={option.description}
                                  checked={member.permissions.includes(
                                    option.value,
                                  )}
                                  disabled={isSaving(member.membershipId)}
                                  onChange={e => {
                                    handleToggle(
                                      member,
                                      option.value,
                                      e.target.checked,
                                    )
                                  }}
                                />
                              ))}
                              {isSaving(member.membershipId) && (
                                <Spinner
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-label="Wird gespeichert"
                                />
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {members.every(m => m.role === "ADMINISTRATOR") && (
                <Card className="mt-3 border-0 bg-light">
                  <Card.Body className="small text-muted">
                    Es gibt noch keine weiteren Mitglieder. Einladungen per
                    E-Mail sind noch nicht verfügbar.
                  </Card.Body>
                </Card>
              )}

              <p className="small text-muted mt-3 mb-0">
                Änderungen gelten sofort auf dem Server. Bei dem betroffenen
                Mitglied erscheinen die neuen Rechte nach dem nächsten Laden der
                Seite.
              </p>
            </>
          )}
        </>
      )}
    </Container>
  )
}
