"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCenter,
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
  UserPlus,
  Search,
  X,
} from "lucide-react";
import { boardsApi, columnsApi, cardsApi, authApi } from "@/lib/api";
import { CardModal } from "@/components/card-modal";
import { AppHeader } from "@/components/app-header";
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
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 ml-4">
            {card.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="h-1.5 w-6 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            ))}
            {card.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{card.tags.length - 3}</span>
            )}
          </div>
        )}
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

  const [members, setMembers] = useState<{id: string; user_id: string; email: string; username?: string | null}[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{id: string; email: string; username?: string | null}[]>([]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"card" | "column" | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

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
      const [boardRes, columnsRes, membersRes] = await Promise.all([
        boardsApi.get(boardId),
        columnsApi.list(boardId),
        boardsApi.getMembers(boardId),
      ]);
      setBoard(boardRes.data);
      console.log("Board:", boardRes.data);
      setColumns(columnsRes.data);
      setMembers(membersRes.data);

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

  const handleSearchUsers = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await authApi.searchUsers(query);
      const existingIds = [board?.owner_id, ...members.map(m => m.user_id)];
      setSearchResults(res.data.filter(u => !existingIds.includes(u.id)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await boardsApi.addMember(boardId, userId);
      setMembers([...members, { id: "", user_id: userId, email: searchResults.find(u => u.id === userId)?.email || "", username: searchResults.find(u => u.id === userId)?.username }]);
      setUserSearch("");
      setSearchResults([]);
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
    setEditingCardId(cardId);
  };

  const handleCloseCardModal = () => {
    setEditingCardId(null);
    fetchBoardData();
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

    if (!over) {
      console.log("No hay over - drag cancelado");
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeColumnId = findColumn(activeId);
    if (!activeColumnId) return;

    let overColumnId: string | null = null;
    
    for (const col of columns) {
      if (col.id === overId) {
        overColumnId = col.id;
        break;
      }
    }
    
    if (!overColumnId) {
      for (const colId of Object.keys(cardsByColumn)) {
        const cards = cardsByColumn[colId];
        if (cards?.some((c) => c.id === overId)) {
          overColumnId = colId;
          break;
        }
      }
    }

    if (!overColumnId) {
      return;
    }

    if (activeColumnId === overColumnId && activeId === overId) {
      return;
    }

    if (activeColumnId !== overColumnId) {
      setCardsByColumn((prev) => {
        const activeCards = [...(prev[activeColumnId] || [])];
        const overCards = [...(prev[overColumnId] || [])];
        
        const activeIndex = activeCards.findIndex((c) => c.id === activeId);
        if (activeIndex === -1) return prev;
        
        const [movedCard] = activeCards.splice(activeIndex, 1);
        movedCard.column_id = overColumnId;
        overCards.push(movedCard);
        
        return {
          ...prev,
          [activeColumnId]: activeCards,
          [overColumnId]: overCards,
        };
      });

      updateCardStatus(activeId, { saving: true, error: false });

      try {
        await cardsApi.update(activeId, {
          column_id: overColumnId,
        });
        updateCardStatus(activeId, { saving: false, error: false });
      } catch (e: any) {
        console.error("Error moving card:", e);
        updateCardStatus(activeId, { saving: false, error: true });
        fetchBoardData();
      }
      return;
    }

    if (activeColumnId === overColumnId && activeId !== overId) {
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
          console.error("Error reorder:", e);
          updateCardStatus(activeId, { saving: false, error: true });
          fetchBoardData();
        }
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
      <header className="border-b border-border px-6 py-4 flex items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/boards")}
            className="p-2 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">{(board?.title || "?").toUpperCase()}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs border-2 border-background">
                {(board?.owner_username?.[0] || "?").toUpperCase()}
              </div>
              {members.slice(0, 3).map((member) => (
                <div
                  key={member.user_id}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background"
                  title={member.username || member.email}
                >
                  {(member.username?.[0] || member.email?.[0] || "?").toUpperCase()}
                </div>
              ))}
              {members.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                  +{members.length - 3}
                </div>
              )}
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Agregar colaborador..."
                    className="w-48 pl-9 pr-3 py-1.5 rounded-md border border-input bg-background text-sm"
                  />
                </div>
              </div>
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 border border-border rounded-md bg-background shadow-lg max-h-40 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(user.id)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <UserPlus className="size-4" />
                      {user.username || user.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                {creatingColumn ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="p-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
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

        
      </main>
      <CardModal
        cardId={editingCardId || ""}
        boardId={boardId}
        open={!!editingCardId}
        onClose={handleCloseCardModal}
      />
    </div>
  );
}
