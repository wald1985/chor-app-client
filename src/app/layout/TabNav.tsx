import { Container, Nav } from "react-bootstrap"
import { NavLink } from "react-router-dom"
import { navItems } from "./navItems"

/**
 * Horizontal tab strip mirroring the prototype's `#tabNav`
 * (`../../../chor-app-docs/chor-app_v3.html`). Scrolls horizontally
 * instead of wrapping once the tabs stop fitting one row, which reads
 * better on a phone than the prototype's multi-row wrap.
 *
 * Only rendered from the `md` breakpoint up — below that, `AppHeader`
 * folds the same tabs into its collapsible menu instead, mobile-first.
 */
export const TabNav = () => (
  <nav
    aria-label="Bereiche"
    className="d-none d-md-block border-bottom bg-body"
  >
    <Container fluid="md" className="overflow-x-auto">
      <Nav variant="underline" className="flex-nowrap text-nowrap py-1">
        {navItems.map(item => (
          <Nav.Item key={item.path}>
            <Nav.Link as={NavLink} to={item.path} end>
              {item.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
    </Container>
  </nav>
)
