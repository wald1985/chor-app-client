import type { SubmitEvent } from "react"
import { useState } from "react"
import { Alert, Button, Form, Spinner } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useAppDispatch } from "../../../app/hooks"
import { getErrorMessage } from "../../../lib/http/httpError"
import { changePassword } from "../authSlice"
import { AuthCard } from "../components/AuthCard"
import { FormError } from "../components/FormError"

export const ChangePasswordPage = () => {
  const dispatch = useAppDispatch()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(null)
    setIsSuccess(false)

    if (newPassword !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap()
      setIsSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(getErrorMessage(err, "Passwort konnte nicht geändert werden."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard title="Passwort ändern" footer={<Link to="/">Zurück</Link>}>
      {isSuccess ? (
        <Alert variant="success">Dein Passwort wurde geändert.</Alert>
      ) : null}
      <FormError message={error} />
      <Form onSubmit={event => void handleSubmit(event)}>
        <Form.Group className="mb-3" controlId="currentPassword">
          <Form.Label>Aktuelles Passwort</Form.Label>
          <Form.Control
            type="password"
            value={currentPassword}
            onChange={e => {
              setCurrentPassword(e.target.value)
            }}
            required
            autoComplete="current-password"
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
        <Form.Group className="mb-4" controlId="confirmPassword">
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
        <Button type="submit" className="w-100" disabled={isSubmitting}>
          {isSubmitting ? (
            <Spinner size="sm" animation="border" />
          ) : (
            "Passwort ändern"
          )}
        </Button>
      </Form>
    </AuthCard>
  )
}
