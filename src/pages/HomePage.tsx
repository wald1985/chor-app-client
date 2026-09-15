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

export const HomePage = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectAuthUser)
  const memberships = useAppSelector(selectAuthMemberships)

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={7} lg={5}>
          <Card>
            <Card.Body>
              <Card.Title as="h1" className="h4">
                Willkommen{user ? `, ${user.name}` : ""}
              </Card.Title>
              {user ? <p className="text-muted mb-0">{user.email}</p> : null}
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
