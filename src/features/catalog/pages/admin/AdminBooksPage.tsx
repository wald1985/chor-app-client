import { useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Stack,
  Table,
} from "react-bootstrap"
import { Link } from "react-router-dom"
import { HttpError } from "../../../../lib/http/httpError"
import { BookFormModal } from "../../components/BookFormModal"
import { SeriesFormModal } from "../../components/SeriesFormModal"
import { UsageWarningModal } from "../../components/UsageWarningModal"
import { useCatalogAdminMutations } from "../../hooks/useCatalogAdminMutations"
import {
  useBooksListQuery,
  useSeriesListQuery,
} from "../../hooks/useCatalogQueries"
import type {
  BookSummaryView,
  LibraryItemUsage,
} from "../../types/catalog.types"

export const AdminBooksPage = () => {
  // Query Filters State
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [includeArchived, setIncludeArchived] = useState<boolean>(false)

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modals State
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false)
  const [bookToEdit, setBookToEdit] = useState<BookSummaryView | null>(null)
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState<boolean>(false)
  const [usageWarning, setUsageWarning] = useState<{
    bookId: string
    bookTitle: string
    usage: LibraryItemUsage
  } | null>(null)

  // React Query Queries & Mutations
  const { data: seriesList = [], isLoading: isLoadingSeries } =
    useSeriesListQuery({ includeArchived: true })

  const {
    data: books = [],
    isLoading: isLoadingBooks,
    error: booksError,
  } = useBooksListQuery({
    seriesId: selectedSeriesId || undefined,
    q: searchQuery.trim() || undefined,
    includeArchived,
  })

  const { createBook, patchBook, archiveBook, restoreBook, createSeries } =
    useCatalogAdminMutations()

  const handleOpenCreateBook = () => {
    setBookToEdit(null)
    setIsBookModalOpen(true)
  }

  const handleOpenEditBook = (book: BookSummaryView) => {
    setBookToEdit(book)
    setIsBookModalOpen(true)
  }

  const handleSaveBook = async (data: {
    title: string
    seriesId: string | null
    volume: number | null
  }) => {
    setErrorMessage(null)
    if (bookToEdit) {
      await patchBook.mutateAsync({
        bookId: bookToEdit.id,
        input: data,
      })
      setSuccessMessage(`Buch „${data.title}“ wurde aktualisiert.`)
    } else {
      await createBook.mutateAsync(data)
      setSuccessMessage(`Buch „${data.title}“ wurde angelegt.`)
    }
    setIsBookModalOpen(false)
  }

  const handleSaveSeries = async (title: string) => {
    setErrorMessage(null)
    await createSeries.mutateAsync({ title })
    setSuccessMessage(`Serie „${title}“ wurde angelegt.`)
    setIsSeriesModalOpen(false)
  }

  const handleArchiveBook = async (
    bookId: string,
    bookTitle: string,
    confirmInUse = false,
  ) => {
    setErrorMessage(null)
    try {
      await archiveBook.mutateAsync({ bookId, confirmInUse })
      setUsageWarning(null)
      setSuccessMessage(`Buch „${bookTitle}“ wurde archiviert.`)
    } catch (err) {
      if (err instanceof HttpError && err.code === "LIBRARY_ITEM_IN_USE") {
        const payload = err.payload as { usage?: LibraryItemUsage } | undefined
        if (payload?.usage) {
          setUsageWarning({
            bookId,
            bookTitle,
            usage: payload.usage,
          })
          return
        }
      }
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Fehler beim Archivieren des Buches.",
      )
    }
  }

  const handleRestoreBook = async (bookId: string, bookTitle: string) => {
    setErrorMessage(null)
    try {
      await restoreBook.mutateAsync(bookId)
      setSuccessMessage(`Buch „${bookTitle}“ wurde wiederhergestellt.`)
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Fehler beim Wiederherstellen des Buches.",
      )
    }
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Bibliothek — Bücher &amp; Serien</h1>
          <p className="text-muted mb-0">
            Verwaltung des zentralen Katalogs für Liederbücher, Serien und
            Bände.
          </p>
        </div>
        <Stack direction="horizontal" gap={2} className="flex-wrap">
          <Button variant="primary" onClick={handleOpenCreateBook}>
            + Buch anlegen
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => {
              setIsSeriesModalOpen(true)
            }}
          >
            + Serie anlegen
          </Button>
          <Link
            to="/admin/library/themes"
            className="btn btn-outline-secondary"
          >
            Themen verwalten
          </Link>
          <Link
            to="/admin/library/import"
            className="btn btn-outline-secondary"
          >
            Importieren
          </Link>
        </Stack>
      </div>

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

      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => {
            setSuccessMessage(null)
          }}
        >
          {successMessage}
        </Alert>
      )}

      {booksError && (
        <Alert variant="danger">
          Fehler beim Laden der Bücher: {booksError.message}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={12} md={5}>
              <Form.Group controlId="bookSearchInput">
                <Form.Label className="small fw-semibold text-muted">
                  Suche nach Titel
                </Form.Label>
                <Form.Control
                  type="search"
                  placeholder="Suche nach Titel..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                  }}
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group controlId="seriesSelectFilter">
                <Form.Label className="small fw-semibold text-muted">
                  Serie filtern
                </Form.Label>
                <Form.Select
                  value={selectedSeriesId}
                  onChange={e => {
                    setSelectedSeriesId(e.target.value)
                  }}
                  disabled={isLoadingSeries}
                >
                  <option value="">Alle Serien</option>
                  {seriesList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} {s.archived ? "(archiviert)" : ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Check
                type="checkbox"
                id="includeArchivedBooks"
                label="Archivierte anzeigen"
                checked={includeArchived}
                onChange={e => {
                  setIncludeArchived(e.target.checked)
                }}
                className="mb-2"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoadingBooks ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-2 text-muted">Bücher werden geladen...</p>
        </div>
      ) : books.length === 0 ? (
        <Card className="text-center py-5 text-muted">
          <Card.Body>
            <p className="mb-2 fs-5">Keine Bücher gefunden.</p>
            <p className="small mb-0">
              Legen Sie ein neues Buch an oder passen Sie die Suchfilter an.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Titel</th>
                <th>Serie</th>
                <th className="text-center">Band</th>
                <th className="text-center">Lieder</th>
                <th className="text-center">Status</th>
                <th className="text-end">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book.id}>
                  <td>
                    <Link
                      to={`/admin/library/books/${book.id}`}
                      className="fw-bold text-decoration-none text-dark"
                    >
                      {book.title}
                    </Link>
                  </td>
                  <td>
                    {book.series ? (
                      book.series.title
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-center">
                    {book.volume ?? <span className="text-muted">—</span>}
                  </td>
                  <td className="text-center">
                    <Badge bg="light" text="dark" className="border">
                      {book.songCount}
                    </Badge>
                  </td>
                  <td className="text-center">
                    {book.archived ? (
                      <Badge bg="secondary">Archiviert</Badge>
                    ) : (
                      <Badge bg="success">Aktiv</Badge>
                    )}
                  </td>
                  <td className="text-end">
                    <Stack
                      direction="horizontal"
                      gap={2}
                      className="justify-content-end"
                    >
                      <Link
                        to={`/admin/library/books/${book.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Öffnen
                      </Link>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          handleOpenEditBook(book)
                        }}
                      >
                        Bearbeiten
                      </Button>
                      {book.archived ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          disabled={restoreBook.isPending}
                          onClick={() => {
                            void handleRestoreBook(book.id, book.title)
                          }}
                        >
                          Wiederherstellen
                        </Button>
                      ) : (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          disabled={archiveBook.isPending}
                          onClick={() => {
                            void handleArchiveBook(book.id, book.title)
                          }}
                        >
                          Archivieren
                        </Button>
                      )}
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Book Create / Edit Modal */}
      <BookFormModal
        show={isBookModalOpen}
        initialTitle={bookToEdit?.title ?? ""}
        initialSeriesId={bookToEdit?.series?.id ?? null}
        initialVolume={bookToEdit?.volume ?? null}
        seriesList={seriesList}
        isEdit={Boolean(bookToEdit)}
        isLoading={createBook.isPending || patchBook.isPending}
        onCancel={() => {
          setIsBookModalOpen(false)
        }}
        onSubmit={data => {
          void handleSaveBook(data)
        }}
      />

      {/* Series Create Modal */}
      <SeriesFormModal
        show={isSeriesModalOpen}
        isLoading={createSeries.isPending}
        onCancel={() => {
          setIsSeriesModalOpen(false)
        }}
        onSubmit={title => {
          void handleSaveSeries(title)
        }}
      />

      {/* Usage Warning Confirmation Modal (on 409 Conflict) */}
      <UsageWarningModal
        show={Boolean(usageWarning)}
        itemTitle={usageWarning?.bookTitle ?? ""}
        usage={usageWarning?.usage ?? null}
        isLoading={archiveBook.isPending}
        onConfirm={() => {
          if (usageWarning) {
            void handleArchiveBook(
              usageWarning.bookId,
              usageWarning.bookTitle,
              true,
            )
          }
        }}
        onCancel={() => {
          setUsageWarning(null)
        }}
      />
    </div>
  )
}
