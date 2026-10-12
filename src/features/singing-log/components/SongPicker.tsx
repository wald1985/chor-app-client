import { useEffect, useMemo, useState } from "react"
import { Badge, Button, Form, ListGroup } from "react-bootstrap"
import type { CommunitySongView } from "../../repertoire/types/repertoire.types"
import { filterSongs, sortSongs } from "../../repertoire/utils/songFilters"

const MAX_RESULTS = 8

type SongPickerProps = {
  songs: CommunitySongView[]
  value: string
  onChange: (songId: string) => void
  disabled?: boolean
}

/**
 * Find a song the way the choir does: pick a collection, type the number (or
 * part of the title) and click the match. Collection and search text stay
 * while the same list is filled in again; the search clears after a save.
 */
export const SongPicker = ({
  songs,
  value,
  onChange,
  disabled = false,
}: SongPickerProps) => {
  const [containerId, setContainerId] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (value === "") setQuery("")
  }, [value])

  const activeSongs = useMemo(
    () => sortSongs(songs).filter(s => !s.archived),
    [songs],
  )
  const containers = useMemo(() => {
    const byId = new Map<string, string>()
    for (const song of activeSongs)
      byId.set(song.container.id, song.container.title)
    return [...byId.entries()].map(([id, title]) => ({ id, title }))
  }, [activeSongs])

  const selected = activeSongs.find(s => s.id === value) ?? null

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const found = filterSongs(activeSongs, {
      search: query,
      containerId,
      themeKey: "",
    })
    const exact = query.trim().toLocaleLowerCase("de")
    // An exact number match comes first, like typing a number in the legacy form.
    return [...found].sort(
      (a, b) =>
        Number(b.number.toLocaleLowerCase("de") === exact) -
        Number(a.number.toLocaleLowerCase("de") === exact),
    )
  }, [activeSongs, query, containerId])

  if (selected) {
    return (
      <div className="border rounded p-2 bg-light d-flex justify-content-between align-items-center gap-2">
        <div>
          <Badge bg="secondary" className="me-2">
            {selected.container.title}
          </Badge>
          <strong>Nr. {selected.number}</strong> – {selected.title}
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          disabled={disabled}
          onClick={() => {
            onChange("")
          }}
        >
          Ändern
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex gap-2 flex-wrap">
        <Form.Group controlId="songPickerContainer" className="flex-fill">
          <Form.Label className="small fw-semibold text-muted">
            Sammlung
          </Form.Label>
          <Form.Select
            value={containerId}
            disabled={disabled}
            onChange={e => {
              setContainerId(e.target.value)
            }}
          >
            <option value="">Alle Sammlungen</option>
            {containers.map(c => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="songPickerQuery" className="flex-fill">
          <Form.Label className="small fw-semibold text-muted">
            Liednummer oder Titel
          </Form.Label>
          <Form.Control
            type="search"
            placeholder="z. B. 42 oder Großer Gott"
            value={query}
            disabled={disabled}
            onChange={e => {
              setQuery(e.target.value)
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && matches.length > 0) {
                e.preventDefault()
                onChange(matches[0].id)
              }
            }}
          />
        </Form.Group>
      </div>
      {query.trim() &&
        (matches.length === 0 ? (
          <div className="small text-muted mt-2">
            Kein Lied gefunden. Prüfen Sie Sammlung und Nummer.
          </div>
        ) : (
          <ListGroup className="mt-2">
            {matches.slice(0, MAX_RESULTS).map(song => (
              <ListGroup.Item
                key={song.id}
                action
                disabled={disabled}
                onClick={() => {
                  onChange(song.id)
                }}
              >
                <strong>Nr. {song.number}</strong> – {song.title}
                <span className="text-muted small ms-2">
                  {song.container.title}
                </span>
              </ListGroup.Item>
            ))}
            {matches.length > MAX_RESULTS && (
              <ListGroup.Item className="small text-muted">
                … weitere Treffer: Suche eingrenzen
              </ListGroup.Item>
            )}
          </ListGroup>
        ))}
    </div>
  )
}
