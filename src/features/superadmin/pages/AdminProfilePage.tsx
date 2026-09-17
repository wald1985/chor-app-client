import type { SubmitEvent } from "react"
import { useEffect, useState } from "react"
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
import { useAppDispatch, useAppSelector } from "../../../app/hooks"
import { getErrorCode, getErrorMessage } from "../../../lib/http/httpError"
import { FormError } from "../../auth/components/FormError"
import {
  changeAdminPassword,
  selectCurrentAdmin,
  updateAdminProfile,
} from "../adminAuthSlice"

export const AdminProfilePage = () => {
  const dispatch = useAppDispatch()
  const admin = useAppSelector(selectCurrentAdmin)

  // Profile form state
  const [name, setName] = useState(admin?.name ?? "")
  const [email, setEmail] = useState(admin?.email ?? "")
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    if (admin) {
      setName(admin.name)
      setEmail(admin.email)
    }
  }, [admin])

  const handleProfileSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)
    setIsSavingProfile(true)

    try {
      await dispatch(updateAdminProfile({ name, email })).unwrap()
      setProfileSuccess(true)
    } catch (err) {
      const code = getErrorCode(err)
      if (code === "SUPERADMIN_EMAIL_TAKEN") {
        setProfileError("Diese E-Mail-Adresse wird bereits verwendet.")
      } else {
        setProfileError(
          getErrorMessage(err, "Profil konnte nicht aktualisiert werden."),
        )
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError("Die Passwörter stimmen nicht überein.")
      return
    }

    setIsSavingPassword(true)
    try {
      await dispatch(
        changeAdminPassword({ currentPassword, newPassword }),
      ).unwrap()
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPasswordError(
        getErrorMessage(err, "Passwort konnte nicht geändert werden."),
      )
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <Container fluid="md" className="px-0">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6} className="d-flex flex-column gap-4">
          <Card>
            <Card.Header as="h2" className="h5">
              Superadmin Profil
            </Card.Header>
            <Card.Body>
              {profileSuccess ? (
                <Alert variant="success">
                  Profil erfolgreich aktualisiert.
                </Alert>
              ) : null}
              <FormError message={profileError} />
              <Form onSubmit={event => void handleProfileSubmit(event)}>
                <Form.Group className="mb-3" controlId="profile-name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                    }}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="profile-email">
                  <Form.Label>E-Mail</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                    }}
                    required
                  />
                </Form.Group>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Profil speichern"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header as="h2" className="h5">
              Passwort ändern
            </Card.Header>
            <Card.Body>
              {passwordSuccess ? (
                <Alert variant="success">Passwort erfolgreich geändert.</Alert>
              ) : null}
              <FormError message={passwordError} />
              <Form onSubmit={event => void handlePasswordSubmit(event)}>
                <Form.Group className="mb-3" controlId="current-password">
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
                <Form.Group className="mb-3" controlId="new-password">
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
                <Form.Group className="mb-3" controlId="confirm-password">
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
                <Button
                  type="submit"
                  variant="outline-secondary"
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Passwort ändern"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
