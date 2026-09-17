import { useState } from "react"
import { Button, Container, Nav, Navbar, NavDropdown } from "react-bootstrap"
import { Link, NavLink } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../hooks"
import { logout, selectAuthUser } from "../../features/auth/authSlice"
import { CatalogModal } from "../../features/catalog/components/CatalogModal"
import { FeedbackModal } from "../../components/FeedbackModal"
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
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)

  const closeMenu = () => {
    setExpanded(false)
  }

  return (
    <>
      <Navbar
        bg="body-tertiary"
        expand="md"
        sticky="top"
        className="border-bottom"
        expanded={expanded}
        onToggle={setExpanded}
      >
        <Container fluid="md" className="d-flex align-items-center">
          <Navbar.Brand as={Link} to="/" onClick={closeMenu}>
            🎵 Chor-App
          </Navbar.Brand>

          {/* Quick action icon-buttons (Feedback & Catalog) */}
          <div className="d-flex align-items-center gap-2 ms-auto me-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="d-flex align-items-center gap-1"
              onClick={() => {
                closeMenu()
                setIsFeedbackOpen(true)
              }}
              title="Feedback"
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
              <span className="d-none d-sm-inline">Feedback</span>
            </Button>

            <Button
              variant="outline-primary"
              size="sm"
              className="d-flex align-items-center gap-1"
              onClick={() => {
                closeMenu()
                setIsCatalogOpen(true)
              }}
              title="Katalog"
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
              <span className="d-none d-sm-inline">Katalog</span>
            </Button>
          </div>

          <Navbar.Toggle aria-controls="app-header-nav" />
          <Navbar.Collapse id="app-header-nav" className="flex-grow-0">
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
            <Nav>
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

      {/* Modals */}
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
    </>
  )
}

