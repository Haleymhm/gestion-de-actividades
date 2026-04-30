import { api } from "./api"
import type { Token, UserOut, LoginInput, RegisterInput } from "@/types"

const TOKEN_KEY = "kanban_access_token"

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
}

export async function login(data: LoginInput): Promise<Token> {
  const formData = new URLSearchParams()
  formData.append("username", data.email)
  formData.append("password", data.password)

  const response = await api.post<Token>("/api/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })

  const token = response.data.access_token
  setStoredToken(token)
  return response.data
}

export async function register(data: RegisterInput): Promise<UserOut> {
  const response = await api.post<UserOut>("/api/auth/register", data)
  return response.data
}

export async function getMe(): Promise<UserOut> {
  const response = await api.get<UserOut>("/api/auth/me")
  return response.data
}

export function logout(): void {
  removeStoredToken()
}

export { getStoredToken }