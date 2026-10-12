import { useMemo, useState } from "react"
import {
  Alert,
  Badge,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap"
import { Link } from "react-router-dom"
import { getErrorMessage } from "../../../lib/http/httpError"
import { useActiveCommunity } from "../../auth/hooks/useActiveCommunity"
import { useCommunityPermission } from "../../auth/hooks/useCommunityPermission"
import { useCommunitySongs } from "../hooks/useCommunitySongs"
import { filterSongs, getThemeOptions, sortSongs } from "../utils/songFilters"

type RepertoireSongsPageMode = "songs" | "themes"

type RepertoireSongsPageProps = {
  mode: RepertoireSongsPageMode
}

const PAGE_TEXT: Record<
  RepertoireSongsPageMode,
  { title: string; description: string }
> = {
  songs: {
    title: "Lieder",
    description:
      "Alle Lieder des Repertoires: eingebundene Liederbücher und eigene Mappen.",
  },
  themes: {
    title: "Themensuche",
    description: "Lieder nach Thema oder Titel über alle Bücher durchsuchen.",
  },
}

export const RepertoireSongsPage = ({ mode }: RepertoireSongsPageProps) => {
  const community = useActiveCommunity()
  const communityId = community?.communityId ?? ""
  const canManage = useCommunityPermission(communityId, "REPERTOIRE_MANAGE")

  const { data, isLoading, error } = useCommunitySongs(communityId)

  const [search, setSearch] = useState("")
  const [containerId, setContainerId] = useState("")
  const [themeKey, setThemeKey] = useState("")

  const songs = useMemo(() => sortSongs(data ?? []), [data])
  const activeSongs = useMemo(() => songs.filter(s => !s.archived), [songs])

  const containers = useMemo(() => {
    const byId = new Map<string, string>()
    for (const song of activeSongs) {
      byId.set(song.container.id, song.container.title)
    }
    return [...byId.entries()].map(([id, title]) => ({ id, title }))
  }, [activeSongs])

  const themeOptions = useMemo(
    () => getThemeOptions(activeSongs),
    [activeSongs],
  )

  const filteredSongs = useMemo(
    () => filterSongs(activeSongs, { search, containerId, themeKey }),
    [activeSongs, search, containerId, themeKey],
  )

  const text = PAGE_TEXT[mode]

  if (!community) {
    return (
      <Alert variant="info">
        Sie gehören noch keiner Chorgemeinschaft an. Das Repertoire ist erst
        nach der Aufnahme in eine Chorgemeinschaft verfügbar.
      </Alert>
    )
  }

  return (
    <div className="pb-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">{text.title}</h1>
        <p className="text-muted mb-0">{text.description}</p>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
            <div className="small">
              <span className="text-muted fw-semibold me-2">
                Chorgemeinschaft:
              </span>
              <span className="fw-bold">{community.communityName}</span>
            </div>
            {canManage && (
              <Link
                to={`/communities/${communityId}/repertoire`}
                className="btn btn-sm btn-outline-secondary text-decoration-none"
              >
                Repertoire-Einstellungen
              </Link>
            )}
          </div>

          <Row className="g-3">
            <Col xs={12} md={5}>
              <Form.Group controlId="repertoireSearch">
                <Form.Label className="small fw-semibold text-muted">
                  Suche nach Titel oder Nummer
                </Form.Label>
                <Form.Control
                  type="search"
                  placeholder="z. B. 42 oder Großer Gott..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                  }}
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group controlId="repertoireContainer">
                <Form.Label className="small fw-semibold text-muted">
                  Sammlung
                </Form.Label>
                <Form.Select
                  value={containerId}
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
            </Col>
            <Col xs={12} md={3}>
              <Form.Group controlId="repertoireTheme">
                <Form.Label className="small fw-semibold text-muted">
                  Thema
                </Form.Label>
                <Form.Select
                  value={themeKey}
                  onChange={e => {
                    setThemeKey(e.target.value)
                  }}
                >
                  <option value="">Alle Themen</option>
                  {themeOptions.map(t => (
                    <option key={t.key} value={t.key}>
                      {t.name} ({t.songCount})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" role="status" />
          <p className="mt-2 text-muted">Lieder werden geladen...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          {getErrorMessage(error, "Die Lieder konnten nicht geladen werden.")}
        </Alert>
      ) : activeSongs.length === 0 ? (
        <Card className="text-center py-5 text-muted border-0 bg-light">
          <Card.Body>
            <div className="fs-1 mb-2">📖</div>
            <h2 className="h5">Noch keine Lieder im Repertoire</h2>
            <p className="small mb-0">
              Binden Sie ein Liederbuch aus der Bibliothek ein, um Lieder
              anzuzeigen.
            </p>
          </Card.Body>
        </Card>
      ) : filteredSongs.length === 0 ? (
        <Card className="text-center py-5 text-muted">
          <Card.Body>
            <p className="mb-2 fs-5">Keine Lieder gefunden.</p>
            <p className="small mb-0">
              Passen Sie die Filter an oder suchen Sie nach einem anderen
              Begriff.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div>
          <p className="text-muted small mb-2">
            Gefunden: <strong>{filteredSongs.length}</strong>{" "}
            {filteredSongs.length === 1 ? "Lied" : "Lieder"}
          </p>
          <div className="table-responsive bg-white rounded shadow-sm border">
            <Table hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "90px" }}>Nr.</th>
                  <th>Titel</th>
                  <th>Autor / Arrangeur</th>
                  <th>Sammlung</th>
                  <th>Themen</th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map(song => (
                  <tr key={song.id}>
                    <td className="fw-bold">{song.number}</td>
                    <td className="fw-semibold">
                      {song.title}
                      {song.isNew && (
                        <Badge bg="success" className="ms-2">
                          Neu
                        </Badge>
                      )}
                    </td>
                    <td>
                      <div>
                        {song.author ?? <span className="text-muted">—</span>}
                      </div>
                      {song.arranger && (
                        <div className="text-muted small">
                          Arr.: {song.arranger}
                        </div>
                      )}
                    </td>
                    <td className="small">{song.container.title}</td>
                    <td>
                      {song.themes.length === 0 ? (
                        <span className="text-muted small">—</span>
                      ) : (
                        song.themes.map(t => (
                          <Badge
                            key={`${t.source}-${t.id}`}
                            bg="light"
                            text="dark"
                            className="border me-1"
                          >
                            {t.name}
                          </Badge>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
