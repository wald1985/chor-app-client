import type { SubmitEvent } from "react"
import { useState } from "react"
import { Button, Form, Spinner } from "react-bootstrap"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAppDispatch } from "../../../app/hooks"
import { getErrorMessage } from "../../../lib/http/httpError"
import { AuthCard } from "../../auth/components/AuthCard"
import { FormError } from "../../auth/components/FormError"
import { loginAdmin } from "../adminAuthSlice"

type AdminLoginLocationState = {
  from?: { pathname: string }
}

export const AdminLoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as AdminLoginLocationState | null

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await dispatch(loginAdmin({ email, password, remember })).unwrap()
      void navigate(state?.from?.pathname ?? "/admin/superadmins", {
        replace: true,
      })
    } catch (err) {
      setError(getErrorMessage(err, "Anmeldung fehlgeschlagen."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Superadmin Login"
      footer={
        <span>
          <Link to="/login">← Zurück zur Chor-App</Link>
        </span>
      }
    >
      <FormError message={error} />
      <Form onSubmit={event => void handleSubmit(event)}>
        <Form.Group className="mb-3" controlId="admin-email">
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
        <Form.Group className="mb-3" controlId="admin-password">
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
        <Form.Group className="mb-3" controlId="admin-remember">
          <Form.Check
            type="checkbox"
            label="Angemeldet bleiben"
            checked={remember}
            onChange={e => {
              setRemember(e.target.checked)
            }}
          />
        </Form.Group>
        <Button type="submit" className="w-100" disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" animation="border" /> : "Anmelden"}
        </Button>
      </Form>
    </AuthCard>
  )
}
