"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogOut, Trash2, Loader2 } from "lucide-react";
import { boardsApi } from "@/lib/api";
import type { Board } from "@/types/kanban";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await boardsApi.list();
      setBoards(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await boardsApi.create({ title: newTitle });
      setBoards([...boards, res.data]);
      setNewTitle("");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este tablero?")) return;
    try {
      await boardsApi.delete(id);
      setBoards(boards.filter((b) => b.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Gestión de actividades</h1>
        <button
          onClick={() => {
            localStorage.removeItem("kanban_access_token");
            router.push("/");
          }}
          className="p-2 rounded-md hover:bg-muted"
        >
          <LogOut className="size-4" />
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Tus Tableros</h2>
        </div>

        <form onSubmit={handleCreate} className="mb-8 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nombre del nuevo tablero..."
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Crear
          </button>
        </form>

        {boards.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tienes tableros aún. Crea uno para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/boards/${board.id}`)}
              >
                <div className="pr-8">
                  <h3 className="font-semibold truncate">{board.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dueño: {board.owner_id.slice(0, 8)}...
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(board.id);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}