import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">
          Gestión de actividades
        </h1>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-2xl px-6 py-16 space-y-6">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Frontend base con Next.js (App Router), Tailwind, Shadcn UI,
          TanStack Query, next-themes y cliente HTTP listo para FastAPI.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </main>
    </div>
  );
}
