"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  GripVertical,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { boardsApi, columnsApi, cardsApi } from "@/lib/api";
import type { Board, BoardColumn, Card } from "@/types/kanban";

interface CardStatus {
  saving: boolean;
  error: boolean;
}

interface SortableCardProps {
  card: Card;
  columnId: string;
  status: CardStatus;
  onDelete: (columnId: string, cardId: string) => void;
  onNavigate: (cardId: string) => void;
}

function SortableCard({
  card,
  columnId,
  status,
  onDelete,
  onNavigate,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative p-2 rounded bg-background border border-border hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => onNavigate(card.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="size-3" />
          </button>
          <span className="text-sm truncate">{card.title}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {status.saving && (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          )}
          {status.error && (
            <AlertCircle className="size-3 text-destructive" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(columnId, card.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
      {card.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 ml-4">
          {card.description}
        </p>
      )}
    </div>
  );
}

function CardOverlay({ card }: { card: Card }) {
  return (
    <div className="p-2 rounded bg-background border-2 border-primary shadow-xl cursor-grabbing">
      <span className="text-sm font-medium">{card.title}</span>
    </div>
  );
}

interface ColumnProps {
  column: BoardColumn;
  cards: Card[];
  cardStatuses: Record<string, CardStatus>;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumn: (columnId: string, title: string) => void;
  onCreateCard: (columnId: string, e: React.FormEvent) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onNavigate: (cardId: string) => void;
  newCardTitle: string;
  onNewCardTitleChange: (title: string) => void;
  isCreating: boolean;
}

function Column({
  column,
  cards,
  cardStatuses,
  onDeleteColumn,
  onUpdateColumn,
  onCreateCard,
  onDeleteCard,
  onNavigate,
  newCardTitle,
  onNewCardTitleChange,
  isCreating,
}: ColumnProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    setTitle(column.title);
  }, [column.title]);

  useEffect(() => {
    if (editingTitle && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingTitle]);

  const handleTitleSubmit = () => {
    setEditingTitle(false);
    if (title !== column.title) {
      onUpdateColumn(column.id, title);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 flex-shrink-0 flex flex-col rounded-lg border border-border bg-card"
    >
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <GripVertical className="size-3" />
          </button>
          {editingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              className="flex-1 px-1 py-0.5 text-sm font-semibold bg-background border rounded"
            />
          ) : (
            <h3
              onDoubleClick={() => setEditingTitle(true)}
              className="font-semibold truncate cursor-pointer hover:bg-muted px-1 rounded"
            >
              {column.title}
            </h3>
          )}
          <span className="text-xs text-muted-foreground ml-1">
            ({cards.length})
          </span>
        </div>
        <button
          onClick={() => onDeleteColumn(column.id)}
          className="p-1 rounded hover:bg-muted text-muted-foreground flex-shrink-0"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              columnId={column.id}
              status={cardStatuses[card.id] || { saving: false, error: false }}
              onDelete={onDeleteCard}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </SortableContext>

      <div className="p-2 border-t border-border">
        <form onSubmit={(e) => onCreateCard(column.id, e)} className="flex gap-2">
          <input
            type="text"
            value={newCardTitle}
            onChange={(e) => onNewCardTitleChange(e.target.value)}
            placeholder="Nueva tarea..."
            className="flex-1 px-2 py-1 text-sm rounded border border-input bg-background"
          />
          <button
            type="submit"
            disabled={isCreating || !newCardTitle.trim()}
            className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [cardsByColumn, setCardsByColumn] = useState<Record<string, Card[]>>({});
  const [cardStatuses, setCardStatuses] = useState<Record<string, CardStatus>>({});
  const [loading, setLoading] = useState(true);

  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [creatingColumn, setCreatingColumn] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState<Record<string, string>>({});
  const [creatingCard, setCreatingCard] = useState<Record<string, boolean>>({});

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"card" | "column" | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const updateCardStatus = useCallback(
    (cardId: string, status: Partial<CardStatus>) => {
      setCardStatuses((prev) => ({
        ...prev,
        [cardId]: { ...prev[cardId], ...status },
      }));
    },
    []
  );

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

  const handleUpdateColumn = async (columnId: string, title: string) => {
    if (!title.trim()) return;
    try {
      await columnsApi.update(columnId, { title });
      setColumns(columns.map(c => c.id === columnId ? { ...c, title } : c));
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
        [columnId]: [...(cardsByColumn[columnId] || []), res.data],
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

  const handleNavigate = (cardId: string) => {
    router.push(`/boards/${boardId}/cards/${cardId}`);
  };

  const findColumn = (id: string): string | null => {
    for (const col of columns) {
      if (col.id === id) return col.id;
    }
    for (const colId of Object.keys(cardsByColumn)) {
      const cards = cardsByColumn[colId];
      if (cards?.some((c) => c.id === id)) return colId;
    }
    return null;
  };

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type as "card" | "column";
    setActiveId(active.id as string);
    setActiveType(type);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (over) {
      setOverId(over.id as string);
    }

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnId = findColumn(activeId);
    const overColumnId = findColumn(overId);

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) return;

    setCardsByColumn((prev) => {
      const activeCards = [...(prev[activeColumnId] || [])];
      const overCards = [...(prev[overColumnId] || [])];

      const activeIndex = activeCards.findIndex((c) => c.id === activeId);
      const [movedCard] = activeCards.splice(activeIndex, 1);

      movedCard.column_id = overColumnId;
      overCards.splice(overId === overColumnId ? overCards.length : 0, 0, movedCard);

      return {
        ...prev,
        [activeColumnId]: activeCards,
        [overColumnId]: overCards,
      };
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);
    setOverId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumnId = findColumn(activeId);
    const overColumnId = findColumn(overId);

    if (activeColumnId === overColumnId && activeColumnId) {
      const cards = [...(cardsByColumn[activeColumnId] || [])];
      const activeIndex = cards.findIndex((c) => c.id === activeId);
      const overIndex = cards.findIndex((c) => c.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        const [movedCard] = cards.splice(activeIndex, 1);
        cards.splice(overIndex, 0, movedCard);

        setCardsByColumn((prev) => ({
          ...prev,
          [activeColumnId]: cards,
        }));

        updateCardStatus(activeId, { saving: true, error: false });

        try {
          await cardsApi.update(activeId, {
            order: overIndex,
            column_id: activeColumnId,
          });
          updateCardStatus(activeId, { saving: false, error: false });
        } catch (e) {
          console.error("Error updating card order:", e);
          updateCardStatus(activeId, { saving: false, error: true });
          fetchBoardData();
        }
      }
    } else if (activeColumnId && overColumnId) {
      updateCardStatus(activeId, { saving: true, error: false });

      try {
        await cardsApi.update(activeId, {
          column_id: overColumnId,
        });
        updateCardStatus(activeId, { saving: false, error: false });
      } catch (e) {
        console.error("Error moving card to different column:", e);
        updateCardStatus(activeId, { saving: false, error: true });
        fetchBoardData();
      }
    }
  };

  const activeCard =
    activeId && activeType === "card"
      ? Object.values(cardsByColumn)
          .flat()
          .find((c) => c.id === activeId) || null
      : null;

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex gap-4 min-w-max">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  cards={cardsByColumn[column.id] || []}
                  cardStatuses={cardStatuses}
                  onDeleteColumn={handleDeleteColumn}
                  onUpdateColumn={handleUpdateColumn}
                  onCreateCard={handleCreateCard}
                  onDeleteCard={handleDeleteCard}
                  onNavigate={handleNavigate}
                  newCardTitle={newCardTitle[column.id] || ""}
                  onNewCardTitleChange={(title) =>
                    setNewCardTitle({ ...newCardTitle, [column.id]: title })
                  }
                  isCreating={creatingCard[column.id] || false}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeCard && <CardOverlay card={activeCard} />}
          </DragOverlay>
        </DndContext>

        <div className="w-72 flex-shrink-0 mt-4">
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
              {creatingColumn ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}