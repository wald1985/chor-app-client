import type { SubmitEvent } from "react"
import { useState } from "react"
import { Alert, Button, Form, Spinner } from "react-bootstrap"
import { Link } from "react-router-dom"
import { getErrorMessage } from "../../../lib/http/httpError"
import { authApi } from "../authApi"
import { AuthCard } from "../components/AuthCard"
import { FormError } from "../components/FormError"

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await authApi.forgotPassword({ email })
      setIsSubmitted(true)
    } catch (err) {
      setError(getErrorMessage(err, "Anfrage fehlgeschlagen."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Passwort vergessen"
      footer={<Link to="/login">Zurück zur Anmeldung</Link>}
    >
      {isSubmitted ? (
        <>
          <Alert variant="success">
            Falls diese E-Mail-Adresse registriert ist, wurde ein Code zum
            Zurücksetzen des Passworts verschickt.
          </Alert>
          <div className="text-center">
            <Link to="/reset-password">Ich habe einen Code erhalten</Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-muted">
            Gib deine E-Mail-Adresse ein. Wenn ein Konto dazu existiert, senden
            wir dir einen Code zum Zurücksetzen des Passworts.
          </p>
          <FormError message={error} />
          <Form onSubmit={event => void handleSubmit(event)}>
            <Form.Group className="mb-4" controlId="email">
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
            <Button type="submit" className="w-100" disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner size="sm" animation="border" />
              ) : (
                "Code anfordern"
              )}
            </Button>
          </Form>
        </>
      )}
    </AuthCard>
  )
}
