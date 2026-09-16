import { Button, Card, Col, Container, ListGroup, Row } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../app/hooks"
import {
  logout,
  selectAuthMemberships,
  selectAuthUser,
} from "../features/auth/authSlice"

const roleLabel = {
  ADMINISTRATOR: "Administrator",
  MEMBER: "Mitglied",
} as const

/** Personal cabinet: account data and the Communities the User is a member of. Reached via the header's account menu ("Konto"). */
export const AccountPage = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectAuthUser)
  const memberships = useAppSelector(selectAuthMemberships)

  return (
    <Container fluid="md" className="px-0">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <Card>
            <Card.Body>
              <Card.Title as="h1" className="h4">
                Konto
              </Card.Title>
              {user ? (
                <>
                  <p className="mb-0">{user.name}</p>
                  <p className="text-muted">{user.email}</p>
                </>
              ) : null}
            </Card.Body>
            {memberships.length > 0 ? (
              <ListGroup variant="flush">
                {memberships.map(membership => (
                  <ListGroup.Item
                    key={membership.communityId}
                    className="d-flex justify-content-between align-items-center"
                  >
                    {membership.communityName}
                    <span className="text-muted">
                      {roleLabel[membership.role]}
                    </span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : null}
            <Card.Body className="d-flex flex-column gap-2">
              <Link to="/change-password" className="btn btn-outline-secondary">
                Passwort ändern
              </Link>
              <Button
                variant="outline-danger"
                onClick={() => void dispatch(logout())}
              >
                Abmelden
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
