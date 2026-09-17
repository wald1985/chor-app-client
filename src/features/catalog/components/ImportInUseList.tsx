import { Alert, Badge, Table } from "react-bootstrap"
import type { ImportInUseView } from "../types/catalog.types"

type ImportInUseListProps = {
  inUse: ImportInUseView[]
}

const typeLabels: Record<ImportInUseView["type"], string> = {
  BOOK: "Buch",
  SONG: "Lied",
  THEME: "Thema",
}

export const ImportInUseList = ({ inUse }: ImportInUseListProps) => {
  if (inUse.length === 0) {
    return null
  }

  return (
    <Alert variant="warning" className="mb-4">
      <Alert.Heading className="h6 mb-2">
        ⚠️ Achtung: Verwendete Elemente werden archiviert
      </Alert.Heading>
      <p className="small mb-3">
        Die folgenden Elemente werden laut Importplan archiviert, werden jedoch
        aktuell in Gemeinschaften verwendet. Bitte prüfen Sie diese sorgfältig.
      </p>

      <div className="table-responsive bg-white rounded border">
        <Table hover size="sm" className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>Typ</th>
              <th>Bezeichnung</th>
              <th className="text-center">Gemeinschaften</th>
              <th className="text-center">Verweise</th>
            </tr>
          </thead>
          <tbody>
            {inUse.map(item => (
              <tr key={`${item.type}-${item.id}`}>
                <td>
                  <Badge bg="secondary">{typeLabels[item.type]}</Badge>
                </td>
                <td className="fw-semibold">{item.label}</td>
                <td className="text-center">
                  <Badge bg="warning" text="dark">
                    {item.communities}
                  </Badge>
                </td>
                <td className="text-center">
                  <Badge bg="light" text="dark" className="border">
                    {item.references}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Alert>
  )
}
