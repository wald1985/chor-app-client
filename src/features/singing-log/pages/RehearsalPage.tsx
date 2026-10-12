import { useState } from "react"
import type { SyntheticEvent } from "react"
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
import { useSearchParams } from "react-router-dom"
import { useActiveCommunity } from "../../auth/hooks/useActiveCommunity"
import { useCommunityPermission } from "../../auth/hooks/useCommunityPermission"
import { usePeople } from "../../people/hooks/usePeople"
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal"
import { EntriesTable } from "../components/EntriesTable"
import { SungSongForm } from "../components/SungSongForm"
import {
  useAddRehearsalEntry,
  useCreateRehearsal,
  useDeleteRehearsal,
  useRehearsal,
  useRehearsals,
  useRemoveRehearsalEntry,
  useUpdateRehearsal,
} from "../hooks/useRehearsals"
import type { RehearsalSummaryView } from "../types/singing-log.types"
import {
  formatLogDate,
  getExistingRehearsalId,
  getLogErrorMessage,
  todayIso,
} from "../utils/logLabels"

const ACTIVE_PARAM = "probe"

/** The songs of one past rehearsal, loaded when it is opened. */
const RehearsalSongs = ({
  communityId,
  rehearsalId,
}: {
  communityId: string
  rehearsalId: string
}) => {
  const { data, isLoading, error } = useRehearsal(communityId, rehearsalId)
  if (isLoading) return <Spinner animation="border" size="sm" role="status" />
  if (error || !data) {
    return (
      <div className="text-danger small">
        Die Lieder konnten nicht geladen werden.
      </div>
    )
  }
  return <EntriesTable entries={data.entries} />
}

/** Chorprobe: a rehearsal on a date with its warm-up and the songs practised. */
export const RehearsalPage = () => {
  const community = useActiveCommunity()
  const communityId = community?.communityId ?? ""
  const canLog = useCommunityPermission(communityId, "SINGING_LOG_MANAGE")

  const [params, setParams] = useSearchParams()
  const activeId = params.get(ACTIVE_PARAM) ?? ""
  const setActive = (id: string | null) => {
    setParams(
      previous => {
        const next = new URLSearchParams(previous)
        if (id) next.set(ACTIVE_PARAM, id)
        else next.delete(ACTIVE_PARAM)
        return next
      },
      { replace: true },
    )
  }

  const { data: rehearsals = [], isLoading, error } = useRehearsals(communityId)
  const { data: active } = useRehearsal(communityId, activeId)
  const { data: people = [] } = usePeople(communityId)
  const conductors = people.filter(
    p => !p.archived && p.roles.includes("CONDUCTOR"),
  )

  const createMutation = useCreateRehearsal(communityId)
  const updateMutation = useUpdateRehearsal(communityId)
  const deleteMutation = useDeleteRehearsal(communityId)
  const addEntryMutation = useAddRehearsalEntry(communityId)
  const removeEntryMutation = useRemoveRehearsalEntry(communityId)

  const [date, setDate] = useState(todayIso())
  const [leaderId, setLeaderId] = useState("")
  const [note, setNote] = useState("")
  const [startError, setStartError] = useState<string | null>(null)
  const [startInfo, setStartInfo] = useState<string | null>(null)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<RehearsalSummaryView | null>(null)
  const [feedback, setFeedback] = useState<{
    variant: "success" | "danger"
    message: string
  } | null>(null)

  if (!community) {
    return (
      <Alert variant="info">
        Sie gehören noch keiner Chorgemeinschaft an. Proben können erst nach der
        Aufnahme in eine Chorgemeinschaft erfasst werden.
      </Alert>
    )
  }

  /** "Probe anlegen / fortsetzen": create, or continue the rehearsal of that date. */
  const handleStart = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStartError(null)
    setStartInfo(null)
    const input = {
      warmUpLeaderId: leaderId || null,
      note: note.trim() || null,
    }
    try {
      const created = await createMutation.mutateAsync({ date, ...input })
      setActive(created.id)
      setStartInfo(`Probe vom ${formatLogDate(date)} ist jetzt aktiv.`)
    } catch (err) {
      const existingId = getExistingRehearsalId(err)
      if (!existingId) {
        setStartError(getLogErrorMessage(err))
        return
      }
      try {
        await updateMutation.mutateAsync({ rehearsalId: existingId, input })
        setActive(existingId)
        setStartInfo(
          `Probe vom ${formatLogDate(date)} wird fortgesetzt und ist jetzt aktiv.`,
        )
      } catch (updateErr) {
        setStartError(getLogErrorMessage(updateErr))
      }
    }
  }

  const handleDelete = () => {
    if (!toDelete) return
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        if (toDelete.id === activeId) setActive(null)
        setToDelete(null)
        setFeedback({
          variant: "success",
          message: "Die Probe wurde gelöscht.",
        })
      },
      onError: err => {
        setToDelete(null)
        setFeedback({ variant: "danger", message: getLogErrorMessage(err) })
      },
    })
  }

  const isStarting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="pb-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">Chorprobe</h1>
        <p className="text-muted mb-0">
          Proben von {community.communityName} anlegen, das Einsingen und die je
          Probe gesungenen Lieder erfassen.
        </p>
      </div>

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

      {canLog ? (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h2 className="h5">Neue Probe anlegen</h2>
            <p className="text-muted small">
              Eine Probe fasst alle an diesem Termin geprobten Lieder zusammen.
              Für ein bereits bestehendes Datum wird die gleiche Probe
              fortgesetzt.
            </p>
            {startError && <Alert variant="danger">{startError}</Alert>}
            <Form
              onSubmit={e => {
                void handleStart(e)
              }}
            >
              <Row className="g-3">
                <Col xs={12} md={3}>
                  <Form.Group controlId="rehearsalDate">
                    <Form.Label className="small fw-semibold text-muted">
                      Datum
                    </Form.Label>
                    <Form.Control
                      type="date"
                      required
                      value={date}
                      onChange={e => {
                        setDate(e.target.value)
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group controlId="rehearsalLeader">
                    <Form.Label className="small fw-semibold text-muted">
                      Einsingen (Dirigent)
                    </Form.Label>
                    <Form.Select
                      value={leaderId}
                      onChange={e => {
                        setLeaderId(e.target.value)
                      }}
                    >
                      <option value="">–</option>
                      {conductors.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={12} md={5}>
                  <Form.Group controlId="rehearsalNote">
                    <Form.Label className="small fw-semibold text-muted">
                      Notiz zur Probe (optional)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      maxLength={500}
                      placeholder="z. B. Ort, Besonderheiten..."
                      value={note}
                      onChange={e => {
                        setNote(e.target.value)
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="mt-3 d-flex align-items-center gap-3 flex-wrap">
                <Button type="submit" disabled={isStarting || !date}>
                  Probe anlegen / fortsetzen
                </Button>
                {startInfo && (
                  <span className="text-success small">✓ {startInfo}</span>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="secondary" className="small">
          Sie können die Proben einsehen. Zum Erfassen benötigen Sie die
          Berechtigung «Vorträge und Proben erfassen» von einem Administrator.
        </Alert>
      )}

      {active && canLog && (
        <Card className="mb-4 shadow-sm border-primary">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h2 className="h5 mb-0">
                Aktive Probe – {formatLogDate(active.date)}
              </h2>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setActive(null)
                }}
              >
                Probe schließen
              </Button>
            </div>
            <div className="text-muted my-2">
              Einsingen: <strong>{active.warmUpLeader?.name ?? "–"}</strong>
              {active.note ? ` · ${active.note}` : ""}
            </div>
            <SungSongForm
              communityId={communityId}
              submitLabel="Lied zur Probe hinzufügen"
              onSubmit={async input => {
                await addEntryMutation.mutateAsync({
                  rehearsalId: active.id,
                  input: {
                    songId: input.songId,
                    pianistId: input.pianistId,
                    conductorId: input.conductorId,
                    note: input.note,
                  },
                })
              }}
            />
            <h3 className="h6 mt-4">Lieder dieser Probe</h3>
            <EntriesTable
              entries={active.entries}
              disabled={removeEntryMutation.isPending}
              onRemove={entry => {
                removeEntryMutation.mutate(
                  { rehearsalId: active.id, entryId: entry.id },
                  {
                    onError: err => {
                      setFeedback({
                        variant: "danger",
                        message: getLogErrorMessage(err),
                      })
                    },
                  },
                )
              }}
            />
          </Card.Body>
        </Card>
      )}

      <h2 className="h5 mb-2">Bisherige Proben</h2>
      {isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" role="status" />
        </div>
      ) : error ? (
        <Alert variant="danger">Die Proben konnten nicht geladen werden.</Alert>
      ) : rehearsals.length === 0 ? (
        <div className="text-muted">Noch keine Proben.</div>
      ) : (
        <div className="bg-white rounded shadow-sm border">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Datum</th>
                <th>Einsingen</th>
                <th>Lieder</th>
                <th>Notiz</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rehearsals.map(rehearsal => (
                <RehearsalRow
                  key={rehearsal.id}
                  rehearsal={rehearsal}
                  communityId={communityId}
                  isOpen={openedId === rehearsal.id}
                  canLog={canLog}
                  onToggle={() => {
                    setOpenedId(openedId === rehearsal.id ? null : rehearsal.id)
                  }}
                  onContinue={() => {
                    setActive(rehearsal.id)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  onDelete={() => {
                    setToDelete(rehearsal)
                  }}
                />
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <ConfirmDeleteModal
        show={toDelete !== null}
        title="Probe löschen"
        message={`Soll die leere Probe vom ${toDelete ? formatLogDate(toDelete.date) : ""} wirklich gelöscht werden?`}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => {
          setToDelete(null)
        }}
      />
    </div>
  )
}

type RehearsalRowProps = {
  rehearsal: RehearsalSummaryView
  communityId: string
  isOpen: boolean
  canLog: boolean
  onToggle: () => void
  onContinue: () => void
  onDelete: () => void
}

const RehearsalRow = ({
  rehearsal,
  communityId,
  isOpen,
  canLog,
  onToggle,
  onContinue,
  onDelete,
}: RehearsalRowProps) => (
  <>
    <tr>
      <td className="fw-semibold">{formatLogDate(rehearsal.date)}</td>
      <td>{rehearsal.warmUpLeader?.name ?? "–"}</td>
      <td>
        <Badge bg="light" text="dark" className="border">
          {rehearsal.entryCount}
        </Badge>
      </td>
      <td className="small">{rehearsal.note ?? ""}</td>
      <td className="text-end text-nowrap">
        <Button
          variant="outline-secondary"
          size="sm"
          className="me-2"
          aria-expanded={isOpen}
          aria-label={`Lieder der Probe vom ${formatLogDate(rehearsal.date)} ${isOpen ? "ausblenden" : "anzeigen"}`}
          onClick={onToggle}
        >
          {isOpen ? "Ausblenden" : "Lieder"}
        </Button>
        {canLog && (
          <Button
            variant="outline-primary"
            size="sm"
            className="me-2"
            aria-label={`Probe vom ${formatLogDate(rehearsal.date)} fortsetzen`}
            onClick={onContinue}
          >
            Fortsetzen
          </Button>
        )}
        {canLog && rehearsal.entryCount === 0 && (
          <Button
            variant="outline-danger"
            size="sm"
            aria-label={`Probe vom ${formatLogDate(rehearsal.date)} löschen`}
            onClick={onDelete}
          >
            Löschen
          </Button>
        )}
      </td>
    </tr>
    {isOpen && (
      <tr>
        <td colSpan={5} className="bg-light">
          <RehearsalSongs
            communityId={communityId}
            rehearsalId={rehearsal.id}
          />
        </td>
      </tr>
    )}
  </>
)
