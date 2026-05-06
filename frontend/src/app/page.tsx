"use client"

import { useRouter } from "next/navigation"
import { LogOut, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"


export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <button
            onClick={() => router.push("/boards")}
            className="p-2 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
        <h1 className="text-lg font-semibold tracking-tight">
          Gestión de actividades in APP Inicio de sesion y registro
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated && (
            <Button
              variant="outline"
              size="icon"
              onClick={logout}
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-16 space-y-6">
        {isAuthenticated ? (
          <>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Bienvenido, {user?.email}
              </h2>
              <p className="text-muted-foreground">
                Tu rol: <span className="font-medium text-foreground">{user?.global_role}</span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">Tus tableros</h3>
              <p className="text-sm text-muted-foreground">
                La funcionalidad de tableros Kanban estará disponible próximamente.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Gestión de Actividades
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Organiza tus tareas con tableros Kanban. Colabora con tu equipo
                y mantén el control de todas tus actividades en un solo lugar.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push("/login")}>
                Iniciar sesión
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/register")}
              >
                Crear cuenta
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
