export type UserOut = {
  id: string
  email: string
  global_role: "admin" | "standard"
}

export type Token = {
  access_token: string
  token_type: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
}