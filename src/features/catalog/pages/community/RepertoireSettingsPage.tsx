import { useMemo, useState } from "react"
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap"
import { Link, useParams } from "react-router-dom"
import { useAppSelector } from "../../../../app/hooks"
import { selectAuthMemberships } from "../../../auth/authSlice"
import { LibraryBrowserModal } from "../../components/LibraryBrowserModal"
import { useLibraryBooks } from "../../hooks/useCatalogQueries"
import {
  useCommunityAttachments,
  useDetachBook,
} from "../../hooks/useCommunityAttachments"
import type { BookAttachmentView } from "../../types/catalog.types"

export const RepertoireSettingsPage = () => {
  const { communityId = "" } = useParams<{ communityId: string }>()
  const memberships = useAppSelector(selectAuthMemberships)

  const community = useMemo(
    () => memberships.find(m => m.communityId === communityId),
    [memberships, communityId],
  )
  const communityName = community?.communityName ?? "Chorgemeinschaft"

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false)
  const [confirmDetachAttachment, setConfirmDetachAttachment] =
    useState<BookAttachmentView | null>(null)
  const [feedback, setFeedback] = useState<{
    variant: "success" | "danger"
    message: string
  } | null>(null)

  const {
    data: attachments = [],
    isLoading: isLoadingAttachments,
    error: attachmentsError,
  } = useCommunityAttachments(communityId)

  const { data: books = [], isLoading: isLoadingBooks } = useLibraryBooks({
    includeArchived: false,
  })

  const detachMutation = useDetachBook(communityId)

  // Filter out archived attachments if any
  const activeAttachments = useMemo(
    () => attachments.filter(a => !a.archivedAt),
    [attachments],
  )

  // Map each attachment to book info for richer display
  const attachmentsWithBook = useMemo(() => {
    return activeAttachments.map(attachment => {
      const book = books.find(b => b.id === attachment.libraryBookId)
      const title =
        book?.title ??
        attachment.book?.title ??
        attachment.bookTitle ??
        "Liederbuch"
      const seriesTitle =
        book?.series?.title ??
        attachment.book?.series?.title ??
        attachment.seriesTitle ??
        null
      const volume =
        book?.volume ?? attachment.book?.volume ?? attachment.volume ?? null
      const songCount =
        book?.songCount ??
        attachment.book?.songCount ??
        attachment.songCount ??
        null

      return {
        attachment,
        title,
        seriesTitle,
        volume,
        songCount,
      }
    })
  }, [activeAttachments, books])

  const handleConfirmDetach = () => {
    if (!confirmDetachAttachment) return

    const item = attachmentsWithBook.find(
      a => a.attachment.id === confirmDetachAttachment.id,
    )
    const bookTitle = item?.title ?? "Buch"

    detachMutation.mutate(confirmDetachAttachment.id, {
      onSuccess: () => {
        setConfirmDetachAttachment(null)
        setFeedback({
          variant: "success",
          message: `Das Buch «${bookTitle}» wurde erfolgreich aus dem Repertoire entfernt.`,
        })
      },
      onError: (err: Error) => {
        setConfirmDetachAttachment(null)
        setFeedback({
          variant: "danger",
          message:
            err.message ||
            "Fehler beim Entfernen des Buches aus dem Repertoire.",
        })
      },
    })
  }

  return (
    <Container fluid="md" className="py-4 px-0">
      {/* Back link */}
      <div className="mb-3">
        <Link
          to="/lieder"
          className="text-decoration-none text-muted small d-inline-flex align-items-center gap-1"
        >
          <span>←</span>
          <span>Zurück zur Liederübersicht</span>
        </Link>
      </div>

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h3 mb-0 fw-bold">Repertoire-Einstellungen</h1>
            <Badge bg="primary" className="fw-normal">
              {communityName}
            </Badge>
          </div>
          <p className="text-muted mb-0 mt-1">
            Verwalten Sie die für diese Chorgemeinschaft eingebundenen Bücher
            aus der globalen Bibliothek.
          </p>
        </div>

        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          onClick={() => {
            setIsLibraryModalOpen(true)
          }}
        >
          <span>➕</span>
          <span>Buch aus Bibliothek hinzufügen</span>
        </Button>
      </div>

      {/* Feedback alert */}
      {feedback ? (
        <Alert
          variant={feedback.variant}
          dismissible
          onClose={() => {
            setFeedback(null)
          }}
          className="mb-4"
        >
          {feedback.message}
        </Alert>
      ) : null}

      {attachmentsError ? (
        <Alert variant="danger" className="mb-4">
          Fehler beim Laden der Repertoire-Bücher: {attachmentsError.message}
        </Alert>
      ) : null}

      {/* Attachments Content */}
      {isLoadingAttachments || isLoadingBooks ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" role="status" />
          <p className="text-muted small mt-2">
            Eingebundene Bücher werden geladen...
          </p>
        </div>
      ) : attachmentsWithBook.length === 0 ? (
        <Card className="text-center py-5 border-dashed shadow-sm">
          <Card.Body className="py-4">
            <div className="fs-1 mb-3">📚</div>
            <Card.Title as="h2" className="h5 fw-bold">
              Noch keine Bücher eingebunden
            </Card.Title>
            <Card.Text
              className="text-muted small mx-auto mb-4"
              style={{ maxWidth: "480px" }}
            >
              Binden Sie gedruckte Liederbücher aus der zentralen Bibliothek
              ein, um deren Lieder im Repertoire Ihrer Chorgemeinschaft
              verfügbar zu machen.
            </Card.Text>
            <Button
              variant="outline-primary"
              onClick={() => {
                setIsLibraryModalOpen(true)
              }}
            >
              Buch aus Bibliothek hinzufügen
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border">
          <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
            <span className="fw-semibold">
              Eingebundene Bücher ({attachmentsWithBook.length})
            </span>
            <span className="text-muted small">
              Live-Verbindung zur Bibliothek
            </span>
          </Card.Header>
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Buchtitel</th>
                  <th>Serie / Band</th>
                  <th>Lieder</th>
                  <th>Status</th>
                  <th className="text-end">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {attachmentsWithBook.map(item => (
                  <tr key={item.attachment.id}>
                    <td>
                      <div className="fw-bold">{item.title}</div>
                    </td>
                    <td>
                      {item.seriesTitle ? (
                        <span>
                          {item.seriesTitle}
                          {item.volume !== null
                            ? ` (Band ${String(item.volume)})`
                            : ""}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {item.songCount !== null ? (
                        <span>{item.songCount} Lieder</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Badge
                        bg="light"
                        text="dark"
                        className="border fw-normal"
                      >
                        Gedruckte Ausgabe (schreibgeschützt)
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={
                          detachMutation.isPending &&
                          confirmDetachAttachment?.id === item.attachment.id
                        }
                        onClick={() => {
                          setConfirmDetachAttachment(item.attachment)
                        }}
                      >
                        Entfernen
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <Card.Footer className="bg-light py-2 text-muted small">
            💡 Lieder aus eingebundenen Büchern werden automatisch aktuell
            gehalten. Änderungen können nur durch den Superadmin im globalen
            Katalog vorgenommen werden.
          </Card.Footer>
        </Card>
      )}

      {/* Confirmation Modal for detaching a book */}
      <Modal
        show={Boolean(confirmDetachAttachment)}
        onHide={() => {
          setConfirmDetachAttachment(null)
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5">Buch aus Repertoire trennen?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmDetachAttachment ? (
            <p className="mb-0">
              Möchten Sie dieses Buch wirklich aus dem Repertoire der Community{" "}
              <strong>«{communityName}»</strong> trennen? Die Lieder stehen den
              Chormitgliedern anschließend nicht mehr zur Verfügung.
            </p>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmDetachAttachment(null)
            }}
          >
            Abbrechen
          </Button>
          <Button
            variant="danger"
            disabled={detachMutation.isPending}
            onClick={handleConfirmDetach}
          >
            {detachMutation.isPending ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-1"
                />
                Wird getrennt...
              </>
            ) : (
              "Buch trennen"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for adding books from library */}
      <LibraryBrowserModal
        show={isLibraryModalOpen}
        onHide={() => {
          setIsLibraryModalOpen(false)
        }}
        communityId={communityId}
        communityName={communityName}
      />
    </Container>
  )
}
