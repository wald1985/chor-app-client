import { Container } from "react-bootstrap"
import { Outlet } from "react-router-dom"
import { AppHeader } from "./AppHeader"
import { TabNav } from "./TabNav"

/** Shell for every authenticated route: header + tab strip + page content. */
export const AppLayout = () => (
  <>
    <AppHeader />
    <TabNav />
    <Container as="main" fluid="md" className="py-3 py-md-4">
      <Outlet />
    </Container>
  </>
)
