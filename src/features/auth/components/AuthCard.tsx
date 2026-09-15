import type { PropsWithChildren, ReactNode } from "react"
import { Card, Col, Container, Row } from "react-bootstrap"

type AuthCardProps = PropsWithChildren<{
  title: string
  footer?: ReactNode
}>

export const AuthCard = ({ title, footer, children }: AuthCardProps) => (
  <Container className="py-5">
    <Row className="justify-content-center">
      <Col xs={12} sm={10} md={7} lg={5}>
        <Card>
          <Card.Body>
            <Card.Title as="h1" className="h4 mb-4 text-center">
              {title}
            </Card.Title>
            {children}
          </Card.Body>
          {footer ? (
            <Card.Footer className="text-center">{footer}</Card.Footer>
          ) : null}
        </Card>
      </Col>
    </Row>
  </Container>
)
