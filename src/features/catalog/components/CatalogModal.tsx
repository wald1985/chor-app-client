import { useMemo, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap"
import { useAppSelector } from "../../../app/hooks"
import { selectAuthMemberships } from "../../auth/authSlice"
import { catalogApi } from "../api/catalogApi"
import {
  useBookDetailQuery,
  useBooksListQuery,
  useThemesListQuery,
} from "../hooks/useCatalogQueries"
import {
  copyBookToCommunity,
  getCopiedBookIds,
} from "../utils/communityRepertoireStorage"

type CatalogModalProps = {
  show: boolean
  onHide: () => void
}

export const CatalogModal = ({ show, onHide }: CatalogModalProps) => {
  const memberships = useAppSelector(selectAuthMemberships)

  // Selected Community for copying
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(() => {
    return memberships.length > 0 ? memberships[0].communityId : ""
  })

  // Selected book in modal
  const [selectedBookId, setSelectedBookId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedThemeId, setSelectedThemeId] = useState<string>("")

  // Copying state & feedback
  const [isCopying, setIsCopying] = useState<boolean>(false)
  const [copySuccessMessage, setCopySuccessMessage] = useState<string | null>(
    null,
  )
  const [copyErrorMessage, setCopyErrorMessage] = useState<string | null>(null)

  // Local copy tracker (triggers re-render on copy)
  const [copyVersion, setCopyVersion] = useState(0)

  // Queries
  const { data: books = [], isLoading: isLoadingBooks } = useBooksListQuery({
    includeArchived: false,
  })

  const { data: themes = [], isLoading: isLoadingThemes } = useThemesListQuery({
    includeArchived: false,
  })

  // Ensure an active book is selected if none chosen yet
  const activeBookId = selectedBookId || (books.length > 0 ? books[0].id : "")

  const { data: currentBook, isLoading: isLoadingBookDetail } =
    useBookDetailQuery(activeBookId, {
      includeArchivedSongs: false,
    })

  // Active community info
  const activeCommunity = useMemo(() => {
    return memberships.find(m => m.communityId === selectedCommunityId)
  }, [memberships, selectedCommunityId])

  // Copied book IDs for active community
  const copiedBookIds = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    copyVersion // track updates
    return getCopiedBookIds(selectedCommunityId)
  }, [selectedCommunityId, copyVersion])

  // Filter songs
  const filteredSongs = useMemo(() => {
    if (!currentBook?.songs) return []

    return currentBook.songs.filter(song => {
      if (song.archived) return false

      if (selectedThemeId && !song.themes.some(t => t.id === selectedThemeId)) {
        return false
      }

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

  const handleCopyBook = async (bookToCopy: { id: string; title?: string }) => {
    if (!selectedCommunityId) {
      setCopyErrorMessage("Bitte wählen Sie zuerst eine Ziel-Community aus.")
      return
    }

    setCopyErrorMessage(null)
    setCopySuccessMessage(null)
    setIsCopying(true)

    try {
      // Fetch full book data if not already the current one
      const fullBook =
        currentBook?.id === bookToCopy.id
          ? currentBook
          : await catalogApi.getBook(bookToCopy.id, {
              includeArchivedSongs: false,
            })

      copyBookToCommunity(selectedCommunityId, fullBook)
      setCopyVersion(v => v + 1)
      setCopySuccessMessage(
        `Das Buch «${fullBook.title}» (${String(fullBook.songs.length)} Lieder, Themen) wurde erfolgreich in die Community «${activeCommunity?.communityName ?? "Ihre Community"}» kopiert!`,
      )
    } catch (err) {
      console.error("Fehler beim Kopieren des Buches:", err)
      setCopyErrorMessage("Fehler beim Kopieren des Buches in die Community.")
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      scrollable
      centered
      aria-labelledby="catalog-modal-title"
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title
          id="catalog-modal-title"
          className="d-flex align-items-center gap-2"
        >
          <span>📖</span>
          <span>Liederbuch-Katalog</span>
          <Badge bg="secondary" className="ms-2 fw-normal fs-6">
            Nur Lesezugriff
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-3 p-md-4">
        {/* Community Selection and Actions Bar */}
        <Card className="mb-3 bg-light border">
          <Card.Body className="py-2 px-3">
            <Row className="align-items-center g-2">
              <Col xs={12} sm={4} md={3}>
                <span className="fw-semibold small text-muted">
                  Ziel-Community für Kopie:
                </span>
              </Col>
              <Col xs={12} sm={8} md={6}>
                {memberships.length === 0 ? (
                  <span className="text-danger small">
                    Keine Community-Mitgliedschaften vorhanden.
                  </span>
                ) : memberships.length === 1 ? (
                  <span className="fw-bold text-dark">
                    {memberships[0].communityName}
                  </span>
                ) : (
                  <Form.Select
                    size="sm"
                    value={selectedCommunityId}
                    onChange={e => {
                      setSelectedCommunityId(e.target.value)
                      setCopySuccessMessage(null)
                    }}
                  >
                    {memberships.map(m => (
                      <option key={m.communityId} value={m.communityId}>
                        {m.communityName} ({m.role})
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Col>
              <Col xs={12} md={3} className="text-md-end text-muted small">
                {activeCommunity ? (
                  <span>
                    Rolle: <strong>{activeCommunity.role}</strong>
                  </span>
                ) : null}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Feedback Alerts */}
        {copySuccessMessage ? (
          <Alert
            variant="success"
            dismissible
            onClose={() => {
              setCopySuccessMessage(null)
            }}
            className="py-2 mb-3"
          >
            <strong>✓ Kopiert:</strong> {copySuccessMessage}
          </Alert>
        ) : null}

        {copyErrorMessage ? (
          <Alert
            variant="danger"
            dismissible
            onClose={() => {
              setCopyErrorMessage(null)
            }}
            className="py-2 mb-3"
          >
            {copyErrorMessage}
          </Alert>
        ) : null}

        {/* Books List / Navigation Tabs */}
        {isLoadingBooks ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" role="status" />
            <p className="text-muted small mt-2">Bücher werden geladen...</p>
          </div>
        ) : books.length === 0 ? (
          <Alert variant="info">
            Derzeit sind keine Bücher im Katalog vorhanden.
          </Alert>
        ) : (
          <div>
            {/* Books Selection Grid */}
            <div className="mb-3">
              <Row className="g-2">
                {books.map(b => {
                  const isSelected = b.id === activeBookId
                  const isCopied = copiedBookIds.has(b.id)

                  return (
                    <Col key={b.id} xs={12} sm={6} md={3}>
                      <Card
                        className={`h-100 cursor-pointer ${
                          isSelected
                            ? "border-primary shadow-sm bg-primary-subtle"
                            : "border-secondary-subtle"
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedBookId(b.id)
                          setSearchTerm("")
                          setSelectedThemeId("")
                        }}
                      >
                        <Card.Body className="p-3 d-flex flex-column justify-content-between">
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <h6
                                className="fw-bold mb-0 text-truncate"
                                title={b.title}
                              >
                                {b.title}
                              </h6>
                              {isCopied ? (
                                <Badge
                                  bg="success"
                                  className="ms-1"
                                  title="In Community vorhanden"
                                >
                                  ✓ Kopiert
                                </Badge>
                              ) : null}
                            </div>
                            <div className="text-muted small mb-2">
                              {b.series ? `${b.series.title} ` : ""}
                              {b.volume !== null
                                ? `(Band ${String(b.volume)})`
                                : ""}
                              <div>{b.songCount} Lieder</div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant={isSelected ? "primary" : "outline-primary"}
                            className="w-100 mt-2"
                            onClick={e => {
                              e.stopPropagation()
                              setSelectedBookId(b.id)
                            }}
                          >
                            {isSelected ? "Ausgewählt" : "Öffnen"}
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  )
                })}
              </Row>
            </div>

            {/* Current Book Content & Songs Table */}
            {isLoadingBookDetail ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" role="status" />
                <p className="text-muted small mt-2">
                  Lieder werden geladen...
                </p>
              </div>
            ) : currentBook ? (
              <Card className="border">
                <Card.Header className="bg-white py-3">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                    <div>
                      <h5 className="mb-1 fw-bold">
                        {currentBook.title}
                        {currentBook.series ? (
                          <span className="text-muted fw-normal fs-6 ms-2">
                            ({currentBook.series.title}
                            {currentBook.volume !== null
                              ? ` — Band ${String(currentBook.volume)}`
                              : ""}
                            )
                          </span>
                        ) : null}
                      </h5>
                      <span className="text-muted small">
                        Gesamtanzahl:{" "}
                        <strong>{currentBook.songs.length}</strong> Lieder
                        {copiedBookIds.has(currentBook.id) ? (
                          <Badge bg="success" className="ms-2">
                            ✓ In Community vorhanden
                          </Badge>
                        ) : (
                          <Badge bg="light" text="dark" className="border ms-2">
                            Noch nicht kopiert
                          </Badge>
                        )}
                      </span>
                    </div>

                    <Button
                      variant={
                        copiedBookIds.has(currentBook.id)
                          ? "outline-success"
                          : "success"
                      }
                      size="sm"
                      disabled={isCopying || !selectedCommunityId}
                      onClick={() => void handleCopyBook(currentBook)}
                      className="d-flex align-items-center gap-2"
                    >
                      {isCopying ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        <span>📋</span>
                      )}
                      <span>
                        {copiedBookIds.has(currentBook.id)
                          ? "Erneut in Community kopieren"
                          : "Buch in Community kopieren"}
                      </span>
                    </Button>
                  </div>

                  {/* Filter Bar inside Book */}
                  <Row className="g-2 mt-3 pt-2 border-top">
                    <Col xs={12} sm={6}>
                      <Form.Control
                        size="sm"
                        type="search"
                        placeholder="Lied suchen (Nummer oder Titel)..."
                        value={searchTerm}
                        onChange={e => {
                          setSearchTerm(e.target.value)
                        }}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Select
                        size="sm"
                        value={selectedThemeId}
                        onChange={e => {
                          setSelectedThemeId(e.target.value)
                        }}
                        disabled={isLoadingThemes}
                      >
                        <option value="">Alle Themen ({themes.length})</option>
                        {themes.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.songCount} Lieder)
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Card.Header>

                <div
                  className="table-responsive"
                  style={{ maxHeight: "360px", overflowY: "auto" }}
                >
                  <Table hover className="align-middle mb-0 small">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th style={{ width: "80px" }}>Nr.</th>
                        <th>Titel</th>
                        <th>Autor / Arrangeur</th>
                        <th>Themen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSongs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-4 text-muted"
                          >
                            Keine Lieder entsprechen den Suchkriterien.
                          </td>
                        </tr>
                      ) : (
                        filteredSongs.map(song => (
                          <tr key={song.id}>
                            <td className="fw-bold">{song.number}</td>
                            <td className="fw-semibold">{song.title}</td>
                            <td className="text-muted">
                              <div>{song.author ?? "—"}</div>
                              {song.arranger ? (
                                <div className="small">
                                  Arr.: {song.arranger}
                                </div>
                              ) : null}
                            </td>
                            <td>
                              {song.themes.length === 0 ? (
                                <span className="text-muted">—</span>
                              ) : (
                                song.themes.map(t => (
                                  <Badge
                                    key={t.id}
                                    bg="light"
                                    text="dark"
                                    className="border me-1 fw-normal"
                                  >
                                    {t.name}
                                  </Badge>
                                ))
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
                <Card.Footer className="bg-light py-2 text-muted small d-flex justify-content-between">
                  <span>
                    Angezeigt: <strong>{filteredSongs.length}</strong> von{" "}
                    {currentBook.songs.length} Liedern
                  </span>
                  <span className="text-secondary">
                    Gedrucktes Buch • Nicht editierbar
                  </span>
                </Card.Footer>
              </Card>
            ) : null}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light d-flex justify-content-between">
        <span className="text-muted small">
          💡 Durch das Kopieren wird das Buch mit all seinen Liedern und Themen
          in Ihre Chorgemeinschaft übernommen.
        </span>
        <Button variant="secondary" onClick={onHide}>
          Schließen
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
