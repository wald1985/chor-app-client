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
 * Find a song the way the choir does: pick a collection (book or folder),
 * then pick the song from a dropdown of that collection's songs; the text
 * field narrows that dropdown by number or title. Without a collection the
 * text field searches all songs and lists the matches. Collection and search
 * text stay while the form is filled in again; the search clears after a save.
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

  // With a collection chosen the songs go into the dropdown, in number order.
  const collectionSongs = useMemo(
    () =>
      containerId
        ? filterSongs(activeSongs, { search: query, containerId, themeKey: "" })
        : [],
    [activeSongs, query, containerId],
  )

  // Without a collection a search lists matches across all collections.
  const matches = useMemo(() => {
    if (containerId) return collectionSongs
    if (!query.trim()) return []
    const found = filterSongs(activeSongs, {
      search: query,
      containerId: "",
      themeKey: "",
    })
    const exact = query.trim().toLocaleLowerCase("de")
    // An exact number match comes first, like typing a number in the legacy form.
    return [...found].sort(
      (a, b) =>
        Number(b.number.toLocaleLowerCase("de") === exact) -
        Number(a.number.toLocaleLowerCase("de") === exact),
    )
  }, [activeSongs, query, containerId, collectionSongs])

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

  const showSongSelect = containerId !== ""

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
            {showSongSelect
              ? "Nach Nummer oder Titel eingrenzen"
              : "Liednummer oder Titel"}
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

      {showSongSelect ? (
        <Form.Group controlId="songPickerSong" className="mt-2">
          <Form.Label className="small fw-semibold text-muted">
            Lied ({collectionSongs.length})
          </Form.Label>
          <Form.Select
            value=""
            disabled={disabled || collectionSongs.length === 0}
            onChange={e => {
              onChange(e.target.value)
            }}
          >
            <option value="">
              {collectionSongs.length === 0
                ? "Kein Lied gefunden"
                : "Lied wählen ..."}
            </option>
            {collectionSongs.map(song => (
              <option key={song.id} value={song.id}>
                {song.number} – {song.title}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      ) : (
        query.trim() &&
        (matches.length === 0 ? (
          <div className="small text-muted mt-2">
            Kein Lied gefunden. Wählen Sie eine Sammlung oder ändern Sie die
            Suche.
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
        ))
      )}
    </div>
  )
}
