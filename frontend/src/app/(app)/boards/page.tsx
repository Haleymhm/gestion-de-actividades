"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Layout, Users, Calendar, Trash2 } from "lucide-react";
import { boardsApi, columnsApi, cardsApi } from "@/lib/api";
import { UserMenu } from "@/components/user-menu";
import type { Board } from "@/types/kanban";

interface BoardWithStats extends Board {
  columnsCount?: number;
  cardsCount?: number;
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<BoardWithStats[]>([]);
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
      console.log("Tableros obtenidos:", res.data);
      const boardsWithStats: BoardWithStats[] = [];

      for (const board of res.data) {
        try {
          const colsRes = await columnsApi.list(board.id);
          let cardsCount = 0;
          for (const col of colsRes.data) {
            const cardsRes = await cardsApi.list(col.id);
            cardsCount += cardsRes.data.length;
          }
          boardsWithStats.push({
            ...board,
            columnsCount: colsRes.data.length,
            cardsCount,
          });
        } catch {
          boardsWithStats.push({ ...board, columnsCount: 0, cardsCount: 0 });
        }
      }

      setBoards(boardsWithStats);
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
      setBoards([...boards, { ...res.data, columnsCount: 0, cardsCount: 0 }]);
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
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tus Tableros</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {boards.length} tablero{boards.length !== 1 ? "s" : ""} en total
            </p>
          </div>
          <div>
            <form onSubmit={handleCreate} className="mb-8 flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nombre del nuevo tablero..."
                className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-sm shadow-sm"
              />
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm transition-colors"
              >
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Crear
              </button>
            </form>
          </div>
        </div>



        {boards.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl border-2 border-dashed border-border">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Layout className="size-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No tienes tableros aún</p>
            <p className="text-sm text-muted-foreground mt-1">Crea uno para comenzar a organizar tus tareas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push(`/boards/${board.id}`)}
              >
                <div className="pr-10">
                  <h3 className="font-semibold text-lg truncate">{board.title}</h3>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layout className="size-3" />
                      {board.columnsCount} columna{board.columnsCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {board.cardsCount} tarjeta{board.cardsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="size-3 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Dueño: {board.owner_username ? board.owner_username : "Desconocido"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(board.id);
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
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