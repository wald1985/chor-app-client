import type { SubmitEvent } from "react"
import { useState } from "react"
import { Button, Form, Spinner } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { useAppDispatch } from "../../../app/hooks"
import { getErrorMessage } from "../../../lib/http/httpError"
import { authApi } from "../authApi"
import { login } from "../authSlice"
import { AuthCard } from "../components/AuthCard"
import { FormError } from "../components/FormError"

export const RegisterPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [communityName, setCommunityName] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.register({ communityName, name, email, password })

      // Registration itself doesn't start a session — log in with the same
      // credentials right away so success lands the visitor on the app,
      // not back on the login form.
      try {
        await dispatch(login({ email, password, remember })).unwrap()
        void navigate("/", { replace: true })
      } catch {
        void navigate("/login", { state: { registeredEmail: email } })
      }
    } catch (err) {
      setError(getErrorMessage(err, "Registrierung fehlgeschlagen."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Gemeinschaft registrieren"
      footer={
        <span>
          Bereits ein Konto? <Link to="/login">Anmelden</Link>
        </span>
      }
    >
      <FormError message={error} />
      <Form onSubmit={event => void handleSubmit(event)}>
        <Form.Group className="mb-3" controlId="communityName">
          <Form.Label>Name der Gemeinschaft</Form.Label>
          <Form.Control
            value={communityName}
            onChange={e => {
              setCommunityName(e.target.value)
            }}
            required
            minLength={2}
            autoComplete="organization"
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="name">
          <Form.Label>Dein Name</Form.Label>
          <Form.Control
            value={name}
            onChange={e => {
              setName(e.target.value)
            }}
            required
            minLength={2}
            autoComplete="name"
          />
        </Form.Group>
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
            minLength={8}
            autoComplete="new-password"
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="confirmPassword">
          <Form.Label>Passwort bestätigen</Form.Label>
          <Form.Control
            type="password"
            value={confirmPassword}
            onChange={e => {
              setConfirmPassword(e.target.value)
            }}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Form.Group>
        <Form.Group className="mb-4" controlId="remember">
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
          {isSubmitting ? (
            <Spinner size="sm" animation="border" />
          ) : (
            "Registrieren"
          )}
        </Button>
      </Form>
    </AuthCard>
  )
}
