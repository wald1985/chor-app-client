import type { SubmitEvent } from "react"
import { useState } from "react"
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAppDispatch } from "../../../app/hooks"
import { getErrorMessage } from "../../../lib/http/httpError"
import { login } from "../authSlice"
import { FormError } from "../components/FormError"

type LoginLocationState = {
  from?: { pathname: string }
  registeredEmail?: string
}

export const LoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null

  const [email, setEmail] = useState(state?.registeredEmail ?? "")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await dispatch(login({ email, password, remember })).unwrap()
      void navigate(state?.from?.pathname ?? "/", { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, "Anmeldung fehlgeschlagen."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container className="py-5">
      <Row className="align-items-center justify-content-center min-vh-75">
        {/* Left Column: Greeting & About Project */}
        <Col xs={12} lg={6} className="mb-5 mb-lg-0 pe-lg-5">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fs-1" role="img" aria-label="Noten">
              🎵
            </span>
            <h1 className="display-5 fw-bold mb-0">Chor-App</h1>
          </div>
          <p className="lead text-muted mb-4">
            Die Plattform für Chorgemeinschaften – Musik, Proben und Repertoire
            an einem gemeinsamen Ort organisieren.
          </p>
          <div className="d-flex flex-column gap-3 text-secondary">
            <div className="d-flex align-items-start gap-3">
              <span className="fs-4">📖</span>
              <div>
                <h2 className="h6 fw-semibold mb-1 text-body">
                  Liederbuch & Repertoire
                </h2>
                <p className="small mb-0">
                  Lieder nach Titeln, Nummern und Themen schnell und gezielt
                  über alle Bücher hinweg durchsuchen.
                </p>
              </div>
            </div>
            <div className="d-flex align-items-start gap-3">
              <span className="fs-4">🎼</span>
              <div>
                <h2 className="h6 fw-semibold mb-1 text-body">
                  Proben & Vorträge
                </h2>
                <p className="small mb-0">
                  Chorproben und Einsing-Lieder erfassen, Gesungenes
                  dokumentieren und Vorträge planen.
                </p>
              </div>
            </div>
            <div className="d-flex align-items-start gap-3">
              <span className="fs-4">👥</span>
              <div>
                <h2 className="h6 fw-semibold mb-1 text-body">
                  Gemeinschaft & Organisation
                </h2>
                <p className="small mb-0">
                  Klavierspieler, Dirigenten, Abwesenheiten und Rollen in der
                  Chorgemeinschaft verwalten.
                </p>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Column: Login Card */}
        <Col xs={12} sm={10} md={8} lg={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <Card.Title as="h2" className="h4 mb-4 text-center">
                Anmelden
              </Card.Title>
              {state?.registeredEmail ? (
                <Alert variant="success">
                  Konto erstellt. Du kannst dich jetzt anmelden.
                </Alert>
              ) : null}
              <FormError message={error} />
              <Form onSubmit={event => void handleSubmit(event)}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>E-Mail</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                    }}
                    required
                    autoComplete="email"
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Passwort</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                    }}
                    required
                    autoComplete="current-password"
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="remember">
                  <Form.Check
                    type="checkbox"
                    label="Angemeldet bleiben"
                    checked={remember}
                    onChange={e => {
                      setRemember(e.target.checked)
                    }}
                  />
                </Form.Group>
                <div className="mb-3 text-end">
                  <Link to="/forgot-password">Passwort vergessen?</Link>
                </div>
                <Button type="submit" className="w-100" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Anmelden"
                  )}
                </Button>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center py-3">
              <span>
                Noch kein Konto? <Link to="/register">Registrieren</Link>
              </span>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Footer with inconspicuous superadmin link icon */}
      <footer className="mt-5 pt-4 text-center">
        <div className="d-flex justify-content-center align-items-center gap-2">
          <span className="text-muted small">
            © {new Date().getFullYear()} Chor-App
          </span>
          <Link
            to="/admin/login"
            aria-label="Superadmin"
            className="text-secondary text-opacity-25 text-decoration-none"
            style={{ cursor: "default", userSelect: "none" }}
          >
            ⚙
          </Link>
        </div>
      </footer>
    </Container>
  )
}
