import { Alert } from "react-bootstrap"

export const FormError = ({ message }: { message: string | null }) => {
  if (!message) return null
  return <Alert variant="danger">{message}</Alert>
}
