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
import { Link, useParams } from "react-router-dom"
import { HttpError } from "../../../../lib/http/httpError"
import { BookFormModal } from "../../components/BookFormModal"
import {
  type SongFormData,
  SongFormModal,
} from "../../components/SongFormModal"
import { SongThemesModal } from "../../components/SongThemesModal"
import { UsageWarningModal } from "../../components/UsageWarningModal"
import { useCatalogAdminMutations } from "../../hooks/useCatalogAdminMutations"
import {
  useBookDetailQuery,
  useSeriesListQuery,
  useThemesListQuery,
} from "../../hooks/useCatalogQueries"
import type {
  BookSongItemView,
  LibraryItemUsage,
} from "../../types/catalog.types"

export const AdminBookDetailPage = () => {
  const { bookId } = useParams<{ bookId: string }>()
  const [includeArchivedSongs, setIncludeArchivedSongs] =
    useState<boolean>(false)

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modals State
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false)
  const [isSongModalOpen, setIsSongModalOpen] = useState<boolean>(false)
  const [songToEdit, setSongToEdit] = useState<BookSongItemView | null>(null)
  const [songToAssignThemes, setSongToAssignThemes] =
    useState<BookSongItemView | null>(null)
  const [usageWarning, setUsageWarning] = useState<{
    type: "book" | "song"
    id: string
    title: string
    usage: LibraryItemUsage
  } | null>(null)

  // Queries
  const {
    data: book,
    isLoading: isLoadingBook,
    error: bookError,
  } = useBookDetailQuery(bookId ?? "", { includeArchivedSongs })

  const { data: themesList = [] } = useThemesListQuery({
    includeArchived: true,
  })
  const { data: seriesList = [] } = useSeriesListQuery({
    includeArchived: true,
  })

  // Mutations
  const {
    patchBook,
    archiveBook,
    restoreBook,
    createSong,
    patchSong,
    setSongThemes,
    archiveSong,
    restoreSong,
  } = useCatalogAdminMutations()

  // Handlers for Book
  const handleSaveBook = async (data: {
    title: string
    seriesId: string | null
    volume: number | null
  }) => {
    if (!bookId) {
      return
    }
    setErrorMessage(null)
    await patchBook.mutateAsync({
      bookId,
      input: data,
    })
    setSuccessMessage(`Buch „${data.title}“ wurde aktualisiert.`)
    setIsBookModalOpen(false)
  }

  const handleArchiveBook = async (confirmInUse = false) => {
    if (!book) {
      return
    }
    setErrorMessage(null)
    try {
      await archiveBook.mutateAsync({ bookId: book.id, confirmInUse })
      setUsageWarning(null)
      setSuccessMessage(`Buch „${book.title}“ wurde archiviert.`)
    } catch (err) {
      if (err instanceof HttpError && err.code === "LIBRARY_ITEM_IN_USE") {
        const payload = err.payload as { usage?: LibraryItemUsage } | undefined
        if (payload?.usage) {
          setUsageWarning({
            type: "book",
            id: book.id,
            title: book.title,
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

  const handleRestoreBook = async () => {
    if (!book) {
      return
    }
    setErrorMessage(null)
    try {
      await restoreBook.mutateAsync(book.id)
      setSuccessMessage(`Buch „${book.title}“ wurde wiederhergestellt.`)
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Fehler beim Wiederherstellen des Buches.",
      )
    }
  }

  // Handlers for Song
  const handleOpenCreateSong = () => {
    setSongToEdit(null)
    setIsSongModalOpen(true)
  }

  const handleOpenEditSong = (song: BookSongItemView) => {
    setSongToEdit(song)
    setIsSongModalOpen(true)
  }

  const handleSaveSong = async (data: SongFormData) => {
    if (!bookId) {
      return
    }
    setErrorMessage(null)
    if (songToEdit) {
      await patchSong.mutateAsync({
        songId: songToEdit.id,
        input: data,
      })
      setSuccessMessage(`Lied Nr. ${data.number} wurde aktualisiert.`)
    } else {
      await createSong.mutateAsync({
        bookId,
        input: data,
      })
      setSuccessMessage(`Lied Nr. ${data.number} wurde hinzugefügt.`)
    }
    setIsSongModalOpen(false)
  }

  const handleSaveSongThemes = async (themeIds: string[]) => {
    if (!songToAssignThemes) {
      return
    }
    setErrorMessage(null)
    await setSongThemes.mutateAsync({
      songId: songToAssignThemes.id,
      input: { themeIds },
    })
    setSuccessMessage(
      `Themen für Lied Nr. ${songToAssignThemes.number} wurden gespeichert.`,
    )
    setSongToAssignThemes(null)
  }

  const handleArchiveSong = async (
    songId: string,
    songTitle: string,
    confirmInUse = false,
  ) => {
    setErrorMessage(null)
    try {
      await archiveSong.mutateAsync({ songId, confirmInUse })
      setUsageWarning(null)
      setSuccessMessage(`Lied „${songTitle}“ wurde archiviert.`)
    } catch (err) {
      if (err instanceof HttpError && err.code === "LIBRARY_ITEM_IN_USE") {
        const payload = err.payload as { usage?: LibraryItemUsage } | undefined
        if (payload?.usage) {
          setUsageWarning({
            type: "song",
            id: songId,
            title: songTitle,
            usage: payload.usage,
          })
          return
        }
      }
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Fehler beim Archivieren des Liedes.",
      )
    }
  }

  const handleRestoreSong = async (songId: string, songTitle: string) => {
    setErrorMessage(null)
    try {
      await restoreSong.mutateAsync(songId)
      setSuccessMessage(`Lied „${songTitle}“ wurde wiederhergestellt.`)
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Fehler beim Wiederherstellen des Liedes.",
      )
    }
  }

  if (isLoadingBook) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" variant="primary" />
        <p className="mt-2 text-muted">Buchdetails werden geladen...</p>
      </div>
    )
  }

  if (bookError || !book) {
    return (
      <div>
        <div className="mb-3">
          <Link
            to="/admin/library/books"
            className="btn btn-sm btn-outline-secondary"
          >
            &larr; Zurück zu Büchern
          </Link>
        </div>
        <Alert variant="danger">
          Fehler beim Laden des Buches:{" "}
          {bookError ? bookError.message : "Buch nicht gefunden."}
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2">
        <Link
          to="/admin/library/books"
          className="btn btn-sm btn-outline-secondary"
        >
          &larr; Zurück zu Büchern
        </Link>
      </div>

      {/* Header section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <h1 className="h3 mb-0">{book.title}</h1>
            {book.series ? (
              <Badge bg="info" className="text-dark">
                {book.series.title}
                {book.volume !== null ? ` — Band ${String(book.volume)}` : ""}
              </Badge>
            ) : null}
            {book.archived ? (
              <Badge bg="secondary">Archiviert</Badge>
            ) : (
              <Badge bg="success">Aktiv</Badge>
            )}
          </div>
          <p className="text-muted mb-0">
            {book.songs.length}{" "}
            {book.songs.length === 1 ? "Lied erfasst" : "Lieder erfasst"}
          </p>
        </div>
        <Stack direction="horizontal" gap={2} className="flex-wrap">
          <Button variant="primary" onClick={handleOpenCreateSong}>
            + Lied hinzufügen
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setIsBookModalOpen(true)
            }}
          >
            Buch bearbeiten
          </Button>
          {book.archived ? (
            <Button
              variant="outline-success"
              disabled={restoreBook.isPending}
              onClick={() => {
                void handleRestoreBook()
              }}
            >
              Buch wiederherstellen
            </Button>
          ) : (
            <Button
              variant="outline-danger"
              disabled={archiveBook.isPending}
              onClick={() => {
                void handleArchiveBook(false)
              }}
            >
              Buch archivieren
            </Button>
          )}
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

      {/* Filter Card */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col xs={12} md={6}>
              <Form.Check
                type="checkbox"
                id="includeArchivedSongs"
                label="Archivierte Lieder anzeigen"
                checked={includeArchivedSongs}
                onChange={e => {
                  setIncludeArchivedSongs(e.target.checked)
                }}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Songs Table */}
      {book.songs.length === 0 ? (
        <Card className="text-center py-5 text-muted">
          <Card.Body>
            <p className="mb-2 fs-5">Keine Lieder in diesem Buch gefunden.</p>
            <p className="small mb-0">
              Klicken Sie auf „+ Lied hinzufügen“, um das erste Lied zu
              erfassen.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm">
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: "90px" }}>Nr.</th>
                <th>Titel</th>
                <th>Autor</th>
                <th>Arrangeur</th>
                <th>Themen</th>
                <th className="text-center">Status</th>
                <th className="text-end">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {book.songs.map(song => (
                <tr key={song.id}>
                  <td className="fw-bold">{song.number}</td>
                  <td className="fw-semibold">{song.title}</td>
                  <td>
                    {song.author ?? <span className="text-muted">—</span>}
                  </td>
                  <td>
                    {song.arranger ?? <span className="text-muted">—</span>}
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
                  <td className="text-center">
                    {song.archived ? (
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
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          handleOpenEditSong(song)
                        }}
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => {
                          setSongToAssignThemes(song)
                        }}
                      >
                        Themen
                      </Button>
                      {song.archived ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          disabled={restoreSong.isPending}
                          onClick={() => {
                            void handleRestoreSong(song.id, song.title)
                          }}
                        >
                          Wiederherstellen
                        </Button>
                      ) : (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          disabled={archiveSong.isPending}
                          onClick={() => {
                            void handleArchiveSong(song.id, song.title)
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

      {/* Book Edit Modal */}
      <BookFormModal
        show={isBookModalOpen}
        initialTitle={book.title}
        initialSeriesId={book.series?.id ?? null}
        initialVolume={book.volume}
        seriesList={seriesList}
        isEdit={true}
        isLoading={patchBook.isPending}
        onCancel={() => {
          setIsBookModalOpen(false)
        }}
        onSubmit={data => {
          void handleSaveBook(data)
        }}
      />

      {/* Song Create / Edit Modal */}
      <SongFormModal
        show={isSongModalOpen}
        initialNumber={songToEdit?.number ?? ""}
        initialTitle={songToEdit?.title ?? ""}
        initialAuthor={songToEdit?.author ?? null}
        initialArranger={songToEdit?.arranger ?? null}
        isEdit={Boolean(songToEdit)}
        isLoading={createSong.isPending || patchSong.isPending}
        onCancel={() => {
          setIsSongModalOpen(false)
        }}
        onSubmit={data => {
          void handleSaveSong(data)
        }}
      />

      {/* Song Themes Assignment Modal */}
      <SongThemesModal
        show={Boolean(songToAssignThemes)}
        songTitle={songToAssignThemes?.title ?? ""}
        songNumber={songToAssignThemes?.number ?? ""}
        currentThemeIds={songToAssignThemes?.themes.map(t => t.id) ?? []}
        themesList={themesList}
        isLoading={setSongThemes.isPending}
        onCancel={() => {
          setSongToAssignThemes(null)
        }}
        onSubmit={themeIds => {
          void handleSaveSongThemes(themeIds)
        }}
      />

      {/* Usage Warning Modal */}
      <UsageWarningModal
        show={Boolean(usageWarning)}
        itemTitle={usageWarning?.title ?? ""}
        usage={usageWarning?.usage ?? null}
        isLoading={archiveBook.isPending || archiveSong.isPending}
        onConfirm={() => {
          if (!usageWarning) {
            return
          }
          if (usageWarning.type === "book") {
            void handleArchiveBook(true)
          } else {
            void handleArchiveSong(usageWarning.id, usageWarning.title, true)
          }
        }}
        onCancel={() => {
          setUsageWarning(null)
        }}
      />
    </div>
  )
}
