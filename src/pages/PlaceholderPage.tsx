import { Alert, Card } from "react-bootstrap"

type PlaceholderPageProps = {
  title: string
  description: string
}

/**
 * Stand-in for a tab whose capability hasn't landed on the server yet
 * (see `../../../chor-app-docs/capability-breakdown.md`'s implementation
 * order). Swap this out for the real feature page once that capability's
 * change is implemented — the route in `App.tsx` is the only other place
 * that needs to change.
 */
export const PlaceholderPage = ({
  title,
  description,
}: PlaceholderPageProps) => (
  <Card>
    <Card.Body>
      <Card.Title as="h1" className="h4">
        {title}
      </Card.Title>
      <Card.Text className="text-muted">{description}</Card.Text>
      <Alert variant="secondary" className="mb-0">
        Dieser Bereich ist noch in Entwicklung.
      </Alert>
    </Card.Body>
  </Card>
)
