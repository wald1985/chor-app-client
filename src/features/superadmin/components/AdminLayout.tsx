import { useState } from "react"
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap"
import { Link, NavLink, Outlet } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../../app/hooks"
import { logoutAdmin, selectCurrentAdmin } from "../adminAuthSlice"

export const AdminLayout = () => {
  const dispatch = useAppDispatch()
  const admin = useAppSelector(selectCurrentAdmin)
  const [expanded, setExpanded] = useState(false)

  const closeMenu = () => {
    setExpanded(false)
  }

  return (
    <>
      <Navbar
        bg="dark"
        data-bs-theme="dark"
        expand="md"
        sticky="top"
        className="border-bottom"
        expanded={expanded}
        onToggle={setExpanded}
      >
        <Container fluid="md">
          <Navbar.Brand as={Link} to="/admin" onClick={closeMenu}>
            🛡️ Chor-App Admin
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-header-nav" />
          <Navbar.Collapse id="admin-header-nav">
            <Nav className="me-auto">
              <Nav.Link
                as={NavLink}
                to="/admin/library/books"
                onClick={closeMenu}
              >
                Bibliothek
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/admin/superadmins"
                end
                onClick={closeMenu}
              >
                Superadmins
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/me" end onClick={closeMenu}>
                Mein Profil
              </Nav.Link>
            </Nav>
            <Nav className="ms-auto">
              <NavDropdown
                title={admin?.name ?? "Superadmin"}
                align="end"
                id="admin-dropdown"
              >
                {admin ? (
                  <NavDropdown.ItemText className="text-muted small">
                    {admin.email}
                  </NavDropdown.ItemText>
                ) : null}
                <NavDropdown.Item as={Link} to="/admin/me" onClick={closeMenu}>
                  Profil & Passwort
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={() => {
                    closeMenu()
                    void dispatch(logoutAdmin())
                  }}
                >
                  Abmelden
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container as="main" fluid="md" className="py-3 py-md-4">
        <Outlet />
      </Container>
    </>
  )
}
