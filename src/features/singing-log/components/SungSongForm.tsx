import type { SyntheticEvent } from "react"
import { useMemo, useState } from "react"
import { Alert, Button, Col, Form, Row, Spinner } from "react-bootstrap"
import { usePeople } from "../../people/hooks/usePeople"
import { useCommunitySongs } from "../../repertoire/hooks/useCommunitySongs"
import type { SungSongInput } from "../types/singing-log.types"
import { getLogErrorMessage, todayIso } from "../utils/logLabels"
import { SongPicker } from "./SongPicker"

type SungSongFormProps = {
  communityId: string
  /** Shows the date field (Vortrag); a Chorprobe entry takes the rehearsal's date. */
  withDate?: boolean
  submitLabel: string
  /** Resolve on success, reject on failure. */
  onSubmit: (input: SungSongInput & { date: string }) => Promise<unknown>
}

/** The shared "which song, who played, who conducted" form of Vortrag and Chorprobe. */
export const SungSongForm = ({
  communityId,
  withDate = false,
  submitLabel,
  onSubmit,
}: SungSongFormProps) => {
  const [date, setDate] = useState(todayIso())
  const [songId, setSongId] = useState("")
  const [pianistId, setPianistId] = useState("")
  const [conductorId, setConductorId] = useState("")
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: songs = [], isLoading: songsLoading } =
    useCommunitySongs(communityId)
  const { data: people = [] } = usePeople(communityId)
  const pianists = useMemo(
    () => people.filter(p => !p.archived && p.roles.includes("PIANIST")),
    [people],
  )
  const conductors = useMemo(
    () => people.filter(p => !p.archived && p.roles.includes("CONDUCTOR")),
    [people],
  )

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!songId || (withDate && !date)) return
    setError(null)
    setIsSaving(true)
    try {
      await onSubmit({
        date,
        songId,
        pianistId: pianistId || null,
        conductorId: conductorId || null,
        note: note.trim() || null,
      })
      // Date and collection stay, like in the legacy form.
      setSongId("")
      setPianistId("")
      setConductorId("")
      setNote("")
    } catch (err) {
      setError(getLogErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Form
      onSubmit={e => {
        void handleSubmit(e)
      }}
    >
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-3">
        {withDate && (
          <Col xs={12} md={4}>
            <Form.Group controlId="sungSongDate">
              <Form.Label className="small fw-semibold text-muted">
                Datum
              </Form.Label>
              <Form.Control
                type="date"
                required
                value={date}
                disabled={isSaving}
                onChange={e => {
                  setDate(e.target.value)
                }}
              />
            </Form.Group>
          </Col>
        )}
        <Col xs={12}>
          {songsLoading ? (
            <Spinner animation="border" size="sm" role="status" />
          ) : (
            <SongPicker
              songs={songs}
              value={songId}
              onChange={setSongId}
              disabled={isSaving}
            />
          )}
        </Col>
        <Col xs={12} md={4}>
          <Form.Group controlId="sungSongPianist">
            <Form.Label className="small fw-semibold text-muted">
              Klavierspieler (optional)
            </Form.Label>
            <Form.Select
              value={pianistId}
              disabled={isSaving}
              onChange={e => {
                setPianistId(e.target.value)
              }}
            >
              <option value="">–</option>
              {pianists.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={12} md={4}>
          <Form.Group controlId="sungSongConductor">
            <Form.Label className="small fw-semibold text-muted">
              Dirigent (optional)
            </Form.Label>
            <Form.Select
              value={conductorId}
              disabled={isSaving}
              onChange={e => {
                setConductorId(e.target.value)
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
        <Col xs={12} md={withDate ? 12 : 4}>
          <Form.Group controlId="sungSongNote">
            <Form.Label className="small fw-semibold text-muted">
              Notiz (optional)
            </Form.Label>
            <Form.Control
              type="text"
              maxLength={500}
              placeholder="z. B. Gottesdienst, Anlass ..."
              value={note}
              disabled={isSaving}
              onChange={e => {
                setNote(e.target.value)
              }}
            />
          </Form.Group>
        </Col>
      </Row>
      <div className="mt-3">
        <Button type="submit" disabled={isSaving || !songId}>
          {isSaving ? "Wird gespeichert..." : submitLabel}
        </Button>
      </div>
    </Form>
  )
}
