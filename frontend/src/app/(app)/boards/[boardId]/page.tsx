"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, Trash2, MoreVertical, Archive } from "lucide-react";
import { boardsApi, columnsApi, cardsApi } from "@/lib/api";
import type { Board, BoardColumn, Card } from "@/types/kanban";

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [cardsByColumn, setCardsByColumn] = useState<Record<string, Card[]>>({});
  const [loading, setLoading] = useState(true);

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [creatingColumn, setCreatingColumn] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState<Record<string, string>>({});
  const [creatingCard, setCreatingCard] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

  const fetchBoardData = async () => {
    try {
      const [boardRes, columnsRes] = await Promise.all([
        boardsApi.get(boardId),
        columnsApi.list(boardId),
      ]);
      setBoard(boardRes.data);
      setColumns(columnsRes.data);

      const cardsPromises = columnsRes.data.map((col) => cardsApi.list(col.id));
      const cardsResults = await Promise.all(cardsPromises);
      const cardsMap: Record<string, Card[]> = {};
      columnsRes.data.forEach((col, i) => {
        cardsMap[col.id] = cardsResults[i].data;
      });
      setCardsByColumn(cardsMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    setCreatingColumn(true);
    try {
      const res = await columnsApi.create(boardId, newColumnTitle);
      setColumns([...columns, res.data]);
      setCardsByColumn({ ...cardsByColumn, [res.data.id]: [] });
      setNewColumnTitle("");
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingColumn(false);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("¿Eliminar esta columna?")) return;
    try {
      await columnsApi.delete(columnId);
      setColumns(columns.filter((c) => c.id !== columnId));
      const newCardsMap = { ...cardsByColumn };
      delete newCardsMap[columnId];
      setCardsByColumn(newCardsMap);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCard = async (columnId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newCardTitle[columnId]?.trim();
    if (!title) return;
    setCreatingCard({ ...creatingCard, [columnId]: true });
    try {
      const res = await cardsApi.create({
        title,
        column_id: columnId,
        order: (cardsByColumn[columnId]?.length || 0),
      });
      setCardsByColumn({
        ...cardsByColumn,
        columnId: [...(cardsByColumn[columnId] || []), res.data],
      });
      setNewCardTitle({ ...newCardTitle, [columnId]: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingCard({ ...creatingCard, [columnId]: false });
    }
  };

  const handleDeleteCard = async (columnId: string, cardId: string) => {
    if (!confirm("¿Eliminar esta tarjeta?")) return;
    try {
      await cardsApi.delete(cardId);
      setCardsByColumn({
        ...cardsByColumn,
        [columnId]: cardsByColumn[columnId].filter((c) => c.id !== cardId),
      });
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
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/boards")}
            className="p-2 rounded-md hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">{board?.title}</h1>
        </div>
      </header>

      <main className="p-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => (
            <div
              key={column.id}
              className="w-72 flex-shrink-0 flex flex-col rounded-lg border border-border bg-card"
            >
              <div className="p-3 flex items-center justify-between border-b border-border">
                <h3 className="font-semibold truncate">{column.title}</h3>
                <button
                  onClick={() => handleDeleteColumn(column.id)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>

              <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                {cardsByColumn[column.id]?.map((card) => (
                  <div
                    key={card.id}
                    className="group p-2 rounded bg-background border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/boards/${boardId}/cards/${card.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm">{card.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(column.id, card.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    {card.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {card.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-border">
                <form
                  onSubmit={(e) => handleCreateCard(column.id, e)}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newCardTitle[column.id] || ""}
                    onChange={(e) =>
                      setNewCardTitle({ ...newCardTitle, [column.id]: e.target.value })
                    }
                    placeholder="Nueva tarea..."
                    className="flex-1 px-2 py-1 text-sm rounded border border-input bg-background"
                  />
                  <button
                    type="submit"
                    disabled={creatingCard[column.id] || !newCardTitle[column.id]?.trim()}
                    className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {creatingCard[column.id] ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          ))}

          <div className="w-72 flex-shrink-0">
            <form onSubmit={handleCreateColumn} className="flex gap-2">
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Nueva columna..."
                className="flex-1 px-3 py-2 rounded-md border border-input bg-card text-sm"
              />
              <button
                type="submit"
                disabled={creatingColumn || !newColumnTitle.trim()}
                className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {creatingColumn ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}