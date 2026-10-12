export type PersonRole = "PIANIST" | "CONDUCTOR"

export type PersonView = {
  id: string
  name: string
  roles: PersonRole[]
  archived: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreatePersonInput = {
  name: string
  roles: PersonRole[]
}

export type UpdatePersonInput = {
  name?: string
  roles?: PersonRole[]
}

export type ListPeopleParams = {
  role?: PersonRole
  includeArchived?: boolean
}
