import { useState } from "react"
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap"
import { Link, NavLink } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../hooks"
import { logout, selectAuthUser } from "../../features/auth/authSlice"
import { navItems } from "./navItems"

/**
 * App-wide header. Collapses into a hamburger menu below Bootstrap's `md`
 * breakpoint (react-bootstrap's `Navbar.Toggle`/`Navbar.Collapse` handle
 * this without any custom CSS/JS). Mobile-first: below `md`, the menu also
 * carries the tab links themselves (`TabNav`'s always-visible strip is
 * `md`-and-up only), so the tabs are reachable without permanently taking
 * up screen space on a phone. `expanded` is controlled so a tap on a tab
 * or an account item closes the menu instead of leaving it open.
 */
export const AppHeader = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectAuthUser)
  const [expanded, setExpanded] = useState(false)
  const closeMenu = () => {
    setExpanded(false)
  }

  return (
    <Navbar
      bg="body-tertiary"
      expand="md"
      sticky="top"
      className="border-bottom"
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container fluid="md">
        <Navbar.Brand as={Link} to="/" onClick={closeMenu}>
          🎵 Chor-App
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="app-header-nav" />
        <Navbar.Collapse id="app-header-nav">
          <Nav className="d-md-none">
            {navItems.map(item => (
              <Nav.Link
                key={item.path}
                as={NavLink}
                to={item.path}
                end
                onClick={closeMenu}
              >
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
          <hr className="d-md-none my-2" />
          <Nav className="ms-auto">
            <NavDropdown
              title={user?.name ?? "Konto"}
              align="end"
              id="account-dropdown"
            >
              {user ? (
                <NavDropdown.ItemText className="text-muted small">
                  {user.email}
                </NavDropdown.ItemText>
              ) : null}
              <NavDropdown.Item as={Link} to="/konto" onClick={closeMenu}>
                Konto
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item
                onClick={() => {
                  closeMenu()
                  void dispatch(logout())
                }}
              >
                Abmelden
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
