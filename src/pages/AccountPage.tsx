import { useState } from "react"
import { Button, Card, Col, Container, ListGroup, Row } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../app/hooks"
import {
  logout,
  selectAuthMemberships,
  selectAuthUser,
} from "../features/auth/authSlice"
import { CatalogModal } from "../features/catalog/components/CatalogModal"
import { FeedbackModal } from "../components/FeedbackModal"

const roleLabel = {
  ADMINISTRATOR: "Administrator",
  MEMBER: "Mitglied",
} as const

/** Personal cabinet: account data and the Communities the User is a member of. Reached via the header's account menu ("Konto"). */
export const AccountPage = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectAuthUser)
  const memberships = useAppSelector(selectAuthMemberships)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)

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
            <Card.Body className="border-top">
              <h2 className="h6 fw-semibold text-muted mb-2">Schnellzugriff</h2>
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="d-flex align-items-center gap-1"
                  onClick={() => {
                    setIsFeedbackOpen(true)
                  }}
                  aria-label="Feedback"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                  </svg>
                  <span>Feedback</span>
                </Button>

                <Button
                  variant="outline-primary"
                  size="sm"
                  className="d-flex align-items-center gap-1"
                  onClick={() => {
                    setIsCatalogOpen(true)
                  }}
                  aria-label="Katalog"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783" />
                  </svg>
                  <span>Liederbuch-Katalog</span>
                </Button>
              </div>
            </Card.Body>
            <Card.Body className="d-flex flex-column gap-2 border-top">
              <Link to="/change-password" className="btn btn-outline-secondary">
                Passwort ändern
              </Link>
              <Button
                variant="outline-danger"
                onClick={() => {
                  void dispatch(logout())
                }}
              >
                Abmelden
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <FeedbackModal
        show={isFeedbackOpen}
        onHide={() => {
          setIsFeedbackOpen(false)
        }}
      />
      <CatalogModal
        show={isCatalogOpen}
        onHide={() => {
          setIsCatalogOpen(false)
        }}
      />
    </Container>
  )
}
