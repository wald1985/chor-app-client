import { Card, Col, Row } from "react-bootstrap"
import type { ImportSummaryView } from "../types/catalog.types"

type ImportSummaryAlertProps = {
  summary: ImportSummaryView
}

export const ImportSummaryAlert = ({ summary }: ImportSummaryAlertProps) => {
  return (
    <Card className="mb-4 border-info">
      <Card.Header className="bg-info bg-opacity-10 fw-semibold text-info-emphasis">
        📊 Import-Vorschau — Geplante Änderungen
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col xs={12} md={6} lg={3}>
            <div className="p-3 bg-light rounded h-100 border">
              <h6 className="fw-bold mb-2">Serien</h6>
              <ul className="list-unstyled mb-0 small">
                <li>
                  Neu anlegen: <strong>{summary.series.create}</strong>
                </li>
                <li>
                  Wiederherstellen: <strong>{summary.series.restore}</strong>
                </li>
              </ul>
            </div>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <div className="p-3 bg-light rounded h-100 border">
              <h6 className="fw-bold mb-2">Bücher</h6>
              <ul className="list-unstyled mb-0 small">
                <li>
                  Neu anlegen: <strong>{summary.books.create}</strong>
                </li>
                <li>
                  In Serie einordnen: <strong>{summary.books.place}</strong>
                </li>
                <li>
                  Wiederherstellen: <strong>{summary.books.restore}</strong>
                </li>
                <li>
                  Unverändert: <strong>{summary.books.unchanged}</strong>
                </li>
              </ul>
            </div>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <div className="p-3 bg-light rounded h-100 border">
              <h6 className="fw-bold mb-2">Themen</h6>
              <ul className="list-unstyled mb-0 small">
                <li>
                  Neu anlegen: <strong>{summary.themes.create}</strong>
                </li>
                <li>
                  Wiederherstellen: <strong>{summary.themes.restore}</strong>
                </li>
              </ul>
            </div>
          </Col>
          <Col xs={12} md={6} lg={3}>
            <div className="p-3 bg-light rounded h-100 border">
              <h6 className="fw-bold mb-2">Lieder</h6>
              <ul className="list-unstyled mb-0 small">
                <li>
                  Neu anlegen: <strong>{summary.songs.create}</strong>
                </li>
                <li>
                  Aktualisieren: <strong>{summary.songs.update}</strong>
                </li>
                <li>
                  Verschieben: <strong>{summary.songs.move}</strong>
                </li>
                <li>
                  Wiederherstellen: <strong>{summary.songs.restore}</strong>
                </li>
                <li>
                  Archivieren: <strong>{summary.songs.archive}</strong>
                </li>
                <li>
                  Unverändert: <strong>{summary.songs.unchanged}</strong>
                </li>
              </ul>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}
