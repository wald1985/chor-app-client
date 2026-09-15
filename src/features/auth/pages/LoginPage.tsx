import type { SubmitEvent } from "react"
import { useState } from "react"
import { Alert, Button, Form, Spinner } from "react-bootstrap"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAppDispatch } from "../../../app/hooks"
import { getErrorMessage } from "../../../lib/http/httpError"
import { login } from "../authSlice"
import { AuthCard } from "../components/AuthCard"
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
    <AuthCard
      title="Anmelden"
      footer={
        <span>
          Noch kein Konto? <Link to="/register">Registrieren</Link>
        </span>
      }
    >
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
          {isSubmitting ? <Spinner size="sm" animation="border" /> : "Anmelden"}
        </Button>
      </Form>
    </AuthCard>
  )
}
