import type { SubmitEvent } from "react"
import { useState } from "react"
import { Button, Form, Spinner } from "react-bootstrap"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAppDispatch } from "../../../app/hooks"
import { getErrorMessage } from "../../../lib/http/httpError"
import { resetPassword } from "../authSlice"
import { AuthCard } from "../components/AuthCard"
import { FormError } from "../components/FormError"

export const ResetPasswordPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [token, setToken] = useState(searchParams.get("token") ?? "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(resetPassword({ token, newPassword, remember })).unwrap()
      void navigate("/", { replace: true })
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Der Code ist ungültig oder abgelaufen. Bitte fordere einen neuen an.",
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Passwort zurücksetzen"
      footer={
        <span>
          Keinen Code erhalten?{" "}
          <Link to="/forgot-password">Erneut anfordern</Link>
        </span>
      }
    >
      <FormError message={error} />
      <Form onSubmit={event => void handleSubmit(event)}>
        <Form.Group className="mb-3" controlId="token">
          <Form.Label>Code aus der E-Mail</Form.Label>
          <Form.Control
            value={token}
            onChange={e => {
              setToken(e.target.value)
            }}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="newPassword">
          <Form.Label>Neues Passwort</Form.Label>
          <Form.Control
            type="password"
            value={newPassword}
            onChange={e => {
              setNewPassword(e.target.value)
            }}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="confirmPassword">
          <Form.Label>Neues Passwort bestätigen</Form.Label>
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
            "Passwort zurücksetzen"
          )}
        </Button>
      </Form>
    </AuthCard>
  )
}
