import { useState } from "react"
import { Alert, Badge, Button, Card, Spinner, Table } from "react-bootstrap"
import { useActiveCommunity } from "../../auth/hooks/useActiveCommunity"
import { useCommunityPermission } from "../../auth/hooks/useCommunityPermission"
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal"
import { SungSongForm } from "../components/SungSongForm"
import {
  useDeletePerformance,
  usePerformances,
  useRecordPerformance,
} from "../hooks/usePerformances"
import type { PerformanceView } from "../types/singing-log.types"
import { formatLogDate, getLogErrorMessage } from "../utils/logLabels"

const RECENT_LIMIT = 8

/** Vortrag: a song sung outside of a rehearsal. */
export const PerformancePage = () => {
  const community = useActiveCommunity()
  const communityId = community?.communityId ?? ""
  const canLog = useCommunityPermission(communityId, "SINGING_LOG_MANAGE")

  const {
    data: recent = [],
    isLoading,
    error,
  } = usePerformances(communityId, { limit: RECENT_LIMIT })
  const recordMutation = useRecordPerformance(communityId)
  const deleteMutation = useDeletePerformance(communityId)

  const [confirmed, setConfirmed] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PerformanceView | null>(null)
  const [feedback, setFeedback] = useState<{
    variant: "success" | "danger"
    message: string
  } | null>(null)

  if (!community) {
    return (
      <Alert variant="info">
        Sie gehören noch keiner Chorgemeinschaft an. Vorträge können erst nach
        der Aufnahme in eine Chorgemeinschaft erfasst werden.
      </Alert>
    )
  }

  const handleDelete = () => {
    if (!toDelete) return
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        setToDelete(null)
        setFeedback({
          variant: "success",
          message: "Der Eintrag wurde gelöscht.",
        })
      },
      onError: err => {
        setToDelete(null)
        setFeedback({ variant: "danger", message: getLogErrorMessage(err) })
      },
    })
  }

  return (
    <div className="pb-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">Vortrag</h1>
        <p className="text-muted mb-0">
          Im Vortrag gesungene Lieder von {community.communityName} eintragen
          und die zuletzt eingetragenen Einträge einsehen.
        </p>
      </div>

      {canLog ? (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h2 className="h5 mb-3">Im Vortrag gesungenes Lied eintragen</h2>
            <SungSongForm
              communityId={communityId}
              withDate
              submitLabel="Eintragen"
              onSubmit={async input => {
                const performance = await recordMutation.mutateAsync({
                  date: input.date,
                  songId: input.songId,
                  pianistId: input.pianistId,
                  conductorId: input.conductorId,
                  note: input.note,
                })
                setConfirmed(performance.song?.title ?? "Lied")
              }}
            />
            {confirmed && (
              <div className="text-success small mt-2">
                ✓ eingetragen: {confirmed}
              </div>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="secondary" className="small">
          Sie können die Einträge einsehen. Zum Eintragen benötigen Sie die
          Berechtigung «Vorträge und Proben erfassen» von einem Administrator.
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

      <h2 className="h5 mb-2">Zuletzt eingetragen</h2>
      {isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" role="status" />
        </div>
      ) : error ? (
        <Alert variant="danger">
          Die Einträge konnten nicht geladen werden.
        </Alert>
      ) : recent.length === 0 ? (
        <div className="text-muted">Noch keine Eintragungen.</div>
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm border">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Datum</th>
                <th>Sammlung</th>
                <th>Nr.</th>
                <th>Titel</th>
                <th>Klavierspieler</th>
                <th>Dirigent</th>
                {canLog && <th />}
              </tr>
            </thead>
            <tbody>
              {recent.map(performance => (
                <tr key={performance.id}>
                  <td>{formatLogDate(performance.date)}</td>
                  <td className="small">
                    {performance.song?.container.title ?? "–"}
                  </td>
                  <td className="fw-bold">{performance.song?.number ?? "–"}</td>
                  <td>
                    {performance.song?.title ?? (
                      <span className="text-muted">
                        Lied nicht mehr verfügbar
                      </span>
                    )}
                    {performance.song?.archived && (
                      <Badge bg="secondary" className="ms-2">
                        Archiviert
                      </Badge>
                    )}
                    {performance.note && (
                      <div className="text-muted small">{performance.note}</div>
                    )}
                  </td>
                  <td>{performance.pianist?.name ?? ""}</td>
                  <td>{performance.conductor?.name ?? ""}</td>
                  {canLog && (
                    <td className="text-end">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        aria-label={`Eintrag ${performance.song?.title ?? ""} vom ${formatLogDate(performance.date)} löschen`}
                        onClick={() => {
                          setToDelete(performance)
                        }}
                      >
                        Löschen
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <ConfirmDeleteModal
        show={toDelete !== null}
        title="Eintrag löschen"
        message="Soll dieser Eintrag wirklich gelöscht werden? Das kann nicht rückgängig gemacht werden."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => {
          setToDelete(null)
        }}
      />
    </div>
  )
}
