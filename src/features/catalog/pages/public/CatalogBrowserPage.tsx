import { useMemo, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Nav,
  Row,
  Spinner,
  Table,
} from "react-bootstrap"
import {
  useBookDetailQuery,
  useBooksListQuery,
  useSongLookupQuery,
  useThemesListQuery,
} from "../../hooks/useCatalogQueries"

type BrowserMode = "songs" | "themes" | "lookup"

type CatalogBrowserPageProps = {
  defaultMode?: BrowserMode
}

export const CatalogBrowserPage = ({
  defaultMode = "songs",
}: CatalogBrowserPageProps) => {
  const [mode, setMode] = useState<BrowserMode>(defaultMode)

  // Filters
  const [selectedBookId, setSelectedBookId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedThemeId, setSelectedThemeId] = useState<string>("")

  // Quick lookup state
  const [lookupNumber, setLookupNumber] = useState<string>("")
  const [lookupBookId, setLookupBookId] = useState<string>("")

  // Queries
  const { data: books = [], isLoading: isLoadingBooks } = useBooksListQuery({
    includeArchived: false,
  })

  const { data: themes = [], isLoading: isLoadingThemes } = useThemesListQuery({
    includeArchived: false,
  })

  // Selected book detail
  const { data: currentBook, isLoading: isLoadingBookDetail } =
    useBookDetailQuery(selectedBookId, {
      includeArchivedSongs: false,
    })

  // Lookup query
  const {
    data: lookupResult,
    isLoading: isLoadingLookup,
    error: lookupError,
  } = useSongLookupQuery(
    {
      number: lookupNumber.trim(),
      bookId: lookupBookId || undefined,
    },
    {
      enabled: Boolean(lookupNumber.trim() && lookupBookId),
    },
  )

  // Filter songs in selected book
  const filteredSongs = useMemo(() => {
    if (!currentBook?.songs) {
      return []
    }

    return currentBook.songs.filter(song => {
      if (song.archived) {
        return false
      }

      // Filter by theme
      if (selectedThemeId && !song.themes.some(t => t.id === selectedThemeId)) {
        return false
      }

      // Filter by search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchTitle = song.title.toLowerCase().includes(query)
        const matchNumber = song.number.toLowerCase().includes(query)
        const matchAuthor = song.author?.toLowerCase().includes(query) ?? false
        if (!matchTitle && !matchNumber && !matchAuthor) {
          return false
        }
      }

      return true
    })
  }, [currentBook, searchTerm, selectedThemeId])

  return (
    <div className="pb-4">
      {/* Page Title */}
      <div className="mb-4">
        <h1 className="h3 mb-1">Bibliothek &amp; Liederbuch-Katalog</h1>
        <p className="text-muted mb-0">
          Zentraler Katalog der gedruckten Liederbücher und Hauptthemen für
          unsere Chorgemeinschaft.
        </p>
      </div>

      {/* Mode navigation */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link
            active={mode === "songs"}
            onClick={() => {
              setMode("songs")
            }}
          >
            Liedersuche nach Buch
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={mode === "themes"}
            onClick={() => {
              setMode("themes")
            }}
          >
            Themensuche
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={mode === "lookup"}
            onClick={() => {
              setMode("lookup")
            }}
          >
            Schnellsuche (Liednummer)
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Mode: Songs or Themes */}
      {(mode === "songs" || mode === "themes") && (
        <div>
          {/* Controls / Filter Card */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Row className="g-3">
                <Col xs={12} md={mode === "themes" ? 6 : 7}>
                  <Form.Group controlId="catalogBookSelect">
                    <Form.Label className="small fw-semibold text-muted">
                      Liederbuch auswählen
                    </Form.Label>
                    <Form.Select
                      value={selectedBookId}
                      onChange={e => {
                        setSelectedBookId(e.target.value)
                      }}
                      disabled={isLoadingBooks}
                    >
                      <option value="">Bitte ein Buch wählen...</option>
                      {books.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.title}{" "}
                          {b.series
                            ? `(${b.series.title}${b.volume !== null ? ` — Band ${String(b.volume)}` : ""})`
                            : ""}{" "}
                          [{b.songCount} Lieder]
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {mode === "themes" ? (
                  <Col xs={12} md={6}>
                    <Form.Group controlId="catalogThemeSelect">
                      <Form.Label className="small fw-semibold text-muted">
                        Thema filtern
                      </Form.Label>
                      <Form.Select
                        value={selectedThemeId}
                        onChange={e => {
                          setSelectedThemeId(e.target.value)
                        }}
                        disabled={isLoadingThemes}
                      >
                        <option value="">Alle Themen</option>
                        {themes.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.songCount} Lieder)
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                ) : (
                  <Col xs={12} md={5}>
                    <Form.Group controlId="catalogSongSearch">
                      <Form.Label className="small fw-semibold text-muted">
                        Suche nach Titel oder Nummer
                      </Form.Label>
                      <Form.Control
                        type="search"
                        placeholder="z. B. 42 oder Großer Gott..."
                        value={searchTerm}
                        onChange={e => {
                          setSearchTerm(e.target.value)
                        }}
                      />
                    </Form.Group>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Song list or Selection Prompt */}
          {!selectedBookId ? (
            <Card className="text-center py-5 text-muted border-0 bg-light">
              <Card.Body>
                <div className="fs-1 mb-2">📖</div>
                <h2 className="h5">Bitte wählen Sie ein Liederbuch aus</h2>
                <p className="small mb-0">
                  Wählen Sie oben ein Buch aus, um die darin enthaltenen Lieder
                  anzuzeigen.
                </p>
              </Card.Body>
            </Card>
          ) : isLoadingBookDetail ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" role="status" />
              <p className="mt-2 text-muted">Lieder werden geladen...</p>
            </div>
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
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">
                  Gefunden: <strong>{filteredSongs.length}</strong>{" "}
                  {filteredSongs.length === 1 ? "Lied" : "Lieder"}
                </span>
              </div>
              <div className="table-responsive bg-white rounded shadow-sm border">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "90px" }}>Nr.</th>
                      <th>Titel</th>
                      <th>Autor / Arrangeur</th>
                      <th>Themen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSongs.map(song => (
                      <tr key={song.id}>
                        <td className="fw-bold">{song.number}</td>
                        <td className="fw-semibold">{song.title}</td>
                        <td>
                          <div>
                            {song.author ?? (
                              <span className="text-muted">—</span>
                            )}
                          </div>
                          {song.arranger && (
                            <div className="text-muted small">
                              Arr.: {song.arranger}
                            </div>
                          )}
                        </td>
                        <td>
                          {song.themes.length === 0 ? (
                            <span className="text-muted small">—</span>
                          ) : (
                            song.themes.map(t => (
                              <Badge
                                key={t.id}
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
      )}

      {/* Mode: Quick Lookup */}
      {mode === "lookup" && (
        <div>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h2 className="h6 mb-3 fw-bold">
                Lied über Nummer &amp; Buch nachschlagen
              </h2>
              <Row className="g-3 align-items-end">
                <Col xs={12} md={6}>
                  <Form.Group controlId="lookupBookSelect">
                    <Form.Label className="small fw-semibold text-muted">
                      Liederbuch
                    </Form.Label>
                    <Form.Select
                      value={lookupBookId}
                      onChange={e => {
                        setLookupBookId(e.target.value)
                      }}
                      disabled={isLoadingBooks}
                    >
                      <option value="">Bitte Liederbuch wählen...</option>
                      {books.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.title}{" "}
                          {b.series
                            ? `(${b.series.title}${b.volume !== null ? ` — Band ${String(b.volume)}` : ""})`
                            : ""}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group controlId="lookupNumberInput">
                    <Form.Label className="small fw-semibold text-muted">
                      Liednummer
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="z. B. 42 oder 105a"
                      value={lookupNumber}
                      onChange={e => {
                        setLookupNumber(e.target.value)
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={2}>
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => {
                      setLookupNumber("")
                      setLookupBookId("")
                    }}
                  >
                    Zurücksetzen
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lookup Result Card */}
          {isLoadingLookup && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" role="status" />
              <p className="mt-2 text-muted">Suche Lied...</p>
            </div>
          )}

          {lookupError && (
            <Alert variant="warning" className="text-center py-4">
              <Alert.Heading className="h6 mb-1">
                Kein Lied gefunden
              </Alert.Heading>
              <p className="small mb-0">
                Im gewählten Buch wurde kein Lied mit der Nummer „
                {lookupNumber.trim()}“ gefunden.
              </p>
            </Alert>
          )}

          {lookupResult && (
            <Card className="border-primary shadow-sm">
              <Card.Header className="bg-primary text-white fw-semibold d-flex justify-content-between align-items-center">
                <span>Gefundenes Lied</span>
                <Badge bg="light" text="dark">
                  Nr. {lookupResult.number}
                </Badge>
              </Card.Header>
              <Card.Body>
                <h3 className="h4 mb-2">{lookupResult.title}</h3>

                <Row className="g-3 my-2">
                  <Col xs={12} md={6}>
                    <span className="text-muted small d-block">Buch:</span>
                    <strong>{lookupResult.book.title}</strong>
                    {lookupResult.book.volume !== null ? (
                      <span> (Band {String(lookupResult.book.volume)})</span>
                    ) : null}
                  </Col>
                  {lookupResult.series && (
                    <Col xs={12} md={6}>
                      <span className="text-muted small d-block">Serie:</span>
                      <strong>{lookupResult.series.title}</strong>
                    </Col>
                  )}
                  <Col xs={12} md={6}>
                    <span className="text-muted small d-block">Autor:</span>
                    <span>{lookupResult.author ?? "—"}</span>
                  </Col>
                  <Col xs={12} md={6}>
                    <span className="text-muted small d-block">Arrangeur:</span>
                    <span>{lookupResult.arranger ?? "—"}</span>
                  </Col>
                </Row>

                <div className="mt-3">
                  <span className="text-muted small d-block mb-1">
                    Zugewiesene Hauptthemen:
                  </span>
                  {lookupResult.themes.length === 0 ? (
                    <span className="text-muted small">
                      Keine Themen zugewiesen
                    </span>
                  ) : (
                    lookupResult.themes.map(t => (
                      <Badge key={t.id} bg="info" className="text-dark me-1">
                        {t.name}
                      </Badge>
                    ))
                  )}
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
