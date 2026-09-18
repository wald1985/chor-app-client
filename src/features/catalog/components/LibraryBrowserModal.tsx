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
} from "react-bootstrap"
import {
  useAttachBook,
  useCommunityAttachments,
} from "../hooks/useCommunityAttachments"
import { useLibraryBooks } from "../hooks/useCatalogQueries"
import type { BookSummaryView } from "../types/catalog.types"

export type LibraryBrowserModalProps = {
  show: boolean
  onHide: () => void
  communityId: string
  communityName?: string
}

export const LibraryBrowserModal = ({
  show,
  onHide,
  communityId,
  communityName,
}: LibraryBrowserModalProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [attachingBookId, setAttachingBookId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    variant: "success" | "danger"
    message: string
  } | null>(null)

  const { data: books = [], isLoading: isLoadingBooks } = useLibraryBooks({
    includeArchived: false,
  })

  const { data: attachments = [], isLoading: isLoadingAttachments } =
    useCommunityAttachments(communityId)

  const attachMutation = useAttachBook(communityId)

  const attachedBookIds = useMemo(() => {
    const ids = new Set<string>()
    attachments.forEach(att => {
      if (!att.archivedAt) {
        ids.add(att.libraryBookId)
      }
    })
    return ids
  }, [attachments])

  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) return books
    const term = searchTerm.toLowerCase().trim()
    return books.filter(b => {
      const matchTitle = b.title.toLowerCase().includes(term)
      const matchSeries = b.series?.title.toLowerCase().includes(term) ?? false
      return matchTitle || matchSeries
    })
  }, [books, searchTerm])

  const handleAttach = (book: BookSummaryView) => {
    setFeedback(null)
    setAttachingBookId(book.id)

    attachMutation.mutate(
      { libraryBookId: book.id },
      {
        onSuccess: () => {
          setAttachingBookId(null)
          setFeedback({
            variant: "success",
            message: `Das Buch «${book.title}» wurde erfolgreich mit dem Repertoire verbunden.`,
          })
        },
        onError: (err: Error) => {
          setAttachingBookId(null)
          setFeedback({
            variant: "danger",
            message:
              err.message ||
              "Fehler beim Verbinden des Buches mit dem Repertoire.",
          })
        },
      },
    )
  }

  const handleClose = () => {
    setFeedback(null)
    setSearchTerm("")
    onHide()
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      scrollable
      centered
      aria-labelledby="library-browser-modal-title"
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title
          id="library-browser-modal-title"
          className="d-flex align-items-center gap-2"
        >
          <span>📚</span>
          <span>Buch aus Bibliothek hinzufügen</span>
          {communityName ? (
            <Badge bg="secondary" className="fw-normal fs-6 ms-2">
              {communityName}
            </Badge>
          ) : null}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-3 p-md-4">
        {feedback ? (
          <Alert
            variant={feedback.variant}
            dismissible
            onClose={() => {
              setFeedback(null)
            }}
            className="py-2 mb-3"
          >
            {feedback.message}
          </Alert>
        ) : null}

        <Form.Group className="mb-3" controlId="librarySearchInput">
          <Form.Control
            type="search"
            placeholder="Buch nach Titel oder Serie suchen..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
            }}
            autoFocus
          />
        </Form.Group>

        {isLoadingBooks || isLoadingAttachments ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" role="status" />
            <p className="text-muted small mt-2">Bücher werden geladen...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <Alert variant="info" className="text-center py-4">
            Keine Bücher in der Bibliothek gefunden.
          </Alert>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filteredBooks.map(book => {
              const isAttached = attachedBookIds.has(book.id)
              const isCurrentlyAttaching =
                attachMutation.isPending && attachingBookId === book.id

              return (
                <Card
                  key={book.id}
                  className={`border ${isAttached ? "bg-light border-success-subtle" : ""}`}
                >
                  <Card.Body className="p-3">
                    <Row className="align-items-center g-2">
                      <Col xs={12} sm={8}>
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="mb-0 fw-bold">{book.title}</h6>
                          {isAttached ? (
                            <Badge bg="success">✓ Bereits verbunden</Badge>
                          ) : null}
                        </div>
                        <div className="text-muted small mt-1">
                          {book.series ? (
                            <span>
                              {book.series.title}
                              {book.volume !== null
                                ? ` (Band ${String(book.volume)})`
                                : ""}{" "}
                              •{" "}
                            </span>
                          ) : null}
                          <span>{book.songCount} Lieder</span>
                        </div>
                      </Col>
                      <Col xs={12} sm={4} className="text-sm-end">
                        {isAttached ? (
                          <Button
                            variant="outline-success"
                            size="sm"
                            disabled
                            className="w-100 w-sm-auto"
                          >
                            Verbunden
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-100 w-sm-auto"
                            disabled={isCurrentlyAttaching}
                            onClick={() => {
                              handleAttach(book)
                            }}
                          >
                            {isCurrentlyAttaching ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-1"
                                />
                                Verbinden...
                              </>
                            ) : (
                              "Verbinden"
                            )}
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )
            })}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light d-flex justify-content-between">
        <span className="text-muted small">
          💡 Verbundene Bücher werden schreibgeschützt ins Repertoire
          übernommen.
        </span>
        <Button variant="secondary" onClick={handleClose}>
          Schließen
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
