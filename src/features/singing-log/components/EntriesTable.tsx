import { Badge, Button, Table } from "react-bootstrap"
import type { RehearsalEntryView } from "../types/singing-log.types"

type EntriesTableProps = {
  entries: RehearsalEntryView[]
  /** Shows the delete column. */
  onRemove?: (entry: RehearsalEntryView) => void
  disabled?: boolean
}

export const EntriesTable = ({
  entries,
  onRemove,
  disabled = false,
}: EntriesTableProps) => {
  if (entries.length === 0) {
    return (
      <div className="text-muted small">Noch keine Lieder in dieser Probe.</div>
    )
  }
  return (
    <div className="table-responsive">
      <Table size="sm" hover className="align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Sammlung</th>
            <th>Nr.</th>
            <th>Titel</th>
            <th>Klavierspieler</th>
            <th>Dirigent</th>
            <th>Notiz</th>
            {onRemove && <th />}
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id}>
              <td className="small">{entry.song?.container.title ?? "–"}</td>
              <td className="fw-bold">{entry.song?.number ?? "–"}</td>
              <td>
                {entry.song?.title ?? (
                  <span className="text-muted">Lied nicht mehr verfügbar</span>
                )}
                {entry.song?.archived && (
                  <Badge bg="secondary" className="ms-2">
                    Archiviert
                  </Badge>
                )}
              </td>
              <td>{entry.pianist?.name ?? ""}</td>
              <td>{entry.conductor?.name ?? ""}</td>
              <td className="small">{entry.note ?? ""}</td>
              {onRemove && (
                <td className="text-end">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    disabled={disabled}
                    aria-label={`Lied ${entry.song?.title ?? ""} entfernen`}
                    onClick={() => {
                      onRemove(entry)
                    }}
                  >
                    Löschen
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
