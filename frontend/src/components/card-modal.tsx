"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Trash2,
  Calendar,
  User,
  Paperclip,
  CheckSquare,
  MessageSquare,
  Plus,
  Check,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Search,
  Tag as TagIcon,
} from "lucide-react";
import { cardsApi, authApi, boardsApi, tagsApi } from "@/lib/api";
import type { Card, Tag } from "@/types/kanban";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#64748b",
  "#84cc16", "#06b6d4",
];

interface CardModalProps {
  cardId: string;
  boardId: string;
  open: boolean;
  onClose: () => void;
}

export function CardModal({ cardId, boardId, open, onClose }: CardModalProps) {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newChecklist, setNewChecklist] = useState("");
  const [newComment, setNewComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [boardTags, setBoardTags] = useState<Tag[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    if (open && cardId) {
      fetchCard();
    }
  }, [open, cardId]);

  useEffect(() => {
    if (open && boardId) {
      fetchTags();
    }
  }, [open, boardId]);

  const fetchCard = async () => {
    try {
      const res = await cardsApi.get(cardId);
      setCard(res.data);
      setTitle(res.data.title || "");
      setDescription(res.data.description || "");
      setStartDate(res.data.start_date || "");
      setEndDate(res.data.end_date || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await tagsApi.list(boardId);
      setBoardTags(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const saveCard = useCallback(async () => {
    setSaveStatus("saving");
    try {
      await cardsApi.update(cardId, {
        title,
        description,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    }
  }, [cardId, title, description, startDate, endDate]);

  const handleChange = (setter: (v: string) => void, value: string, debounce = true) => {
    setter(value);
    if (debounce) {
      setTimeout(saveCard, 500);
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklist.trim()) return;
    try {
      await cardsApi.addChecklistItem(cardId, newChecklist);
      setNewChecklist("");
      fetchCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChecklist = async (checkId: string, isCompleted: boolean) => {
    try {
      await cardsApi.updateChecklistItem(cardId, checkId, { is_completed: !isCompleted });
      fetchCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteChecklistItem = async (checkId: string) => {
    try {
      await cardsApi.deleteChecklistItem(cardId, checkId);
      fetchCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await cardsApi.addComment(cardId, newComment);
      setNewComment("");
      fetchCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta tarjeta?")) return;
    try {
      await cardsApi.delete(cardId);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await boardsApi.getMembers(boardId);
      const currentAssigneeIds = new Set(card?.assignees?.map((a) => a.user_id));
      const filtered = res.data
        .filter((m) => m.email.toLowerCase().includes(query.toLowerCase()))
        .map((m) => ({ id: m.user_id, email: m.email }))
        .filter((u) => !currentAssigneeIds.has(u.id));
      setSearchResults(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    try {
      await cardsApi.assignUser(cardId, userId);
      setSearchQuery("");
      setSearchResults([]);
      fetchCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await cardsApi.removeUser(cardId, userId);
      fetchCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await tagsApi.create({
        name: newTagName,
        color: selectedColor,
        board_id: boardId,
      });
      setBoardTags([...boardTags, res.data]);
      setNewTagName("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTag = async (tagId: string) => {
    const isAssigned = card?.tags?.some((t) => t.id === tagId);
    try {
      if (isAssigned) {
        await tagsApi.removeFromCard(cardId, tagId);
      } else {
        await tagsApi.assignToCard(cardId, tagId);
      }
      fetchCard();
    } catch (e) {
      console.error(e);
    }
  };

  if (!open) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const completedChecklists = card?.checklists?.filter((c) => c.is_completed).length || 0;
  const totalChecklists = card?.checklists?.length || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => handleChange(setTitle, e.target.value)}
            className="flex-1 text-2xl font-bold bg-transparent border-none outline-none focus:ring-0 px-0"
            placeholder="Título de la tarea"
          />
          <div className="flex items-center gap-2 ml-4">
            {saveStatus === "saving" && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
            {saveStatus === "saved" && (
              <CheckCircle2 className="size-4 text-green-500" />
            )}
            {saveStatus === "error" && (
              <AlertCircle className="size-4 text-destructive" />
            )}
            <button
              onClick={handleDelete}
              className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveCard}
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                placeholder="Agregar una descripción..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Checklists ({completedChecklists}/{totalChecklists})
              </label>
              {totalChecklists > 0 && (
                <div className="mb-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(completedChecklists / totalChecklists) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {card?.checklists?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group"
                  >
                    <button
                      onClick={() => handleToggleChecklist(item.id, item.is_completed)}
                      className={`p-1 rounded flex-shrink-0 ${
                        item.is_completed
                          ? "bg-primary text-primary-foreground"
                          : "border border-border"
                      }`}
                    >
                      {item.is_completed && <Check className="size-3" />}
                    </button>
                    <span
                      className={`flex-1 ${
                        item.is_completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.content}
                    </span>
                    <button
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-destructive flex-shrink-0"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddChecklist} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newChecklist}
                  onChange={(e) => setNewChecklist(e.target.value)}
                  placeholder="Nuevo elemento..."
                  className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
                <button
                  type="submit"
                  disabled={!newChecklist.trim()}
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Plus className="size-4" />
                </button>
              </form>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Comentarios
              </label>
              <div className="space-y-3 mb-3">
                {card?.comments?.map((comment) => (
                  <div key={comment.id} className="p-3 rounded bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-1">
                      {comment.user_id.slice(0, 8)} •{" "}
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribir un comentario..."
                  className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <MessageSquare className="size-4" />
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="size-4" />
                Fechas
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-16 flex-shrink-0">
                    Inicio:
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onBlur={saveCard}
                    className="flex-1 px-2 py-1 rounded border border-input bg-background text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-16 flex-shrink-0">
                    Fin:
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onBlur={saveCard}
                    className="flex-1 px-2 py-1 rounded border border-input bg-background text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <User className="size-4" />
                Asignados
              </label>
              <div className="space-y-1 mb-3">
                {card?.assignees?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 p-2 rounded bg-muted/50 group"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs flex-shrink-0">
                      {user.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm truncate flex-1">{user.email}</span>
                    <button
                      onClick={() => handleRemoveUser(user.user_id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-destructive flex-shrink-0 hover:bg-destructive/10 rounded"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {(!card?.assignees || card.assignees.length === 0) && (
                  <p className="text-sm text-muted-foreground">Sin asignar</p>
                )}
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-input bg-background">
                  <Search className="size-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Buscar usuario por email..."
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  {searching && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleAssignUser(user.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs flex-shrink-0">
                          {user.email[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="truncate">{user.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && !searching && (
                  <p className="text-xs text-muted-foreground mt-2">No se encontraron usuarios</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <TagIcon className="size-4" />
                Etiquetas
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {card?.tags?.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white hover:opacity-80"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name} ×
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="text-xs text-primary hover:underline"
              >
                {showTagPicker ? "Cerrar" : "+ Agregar etiqueta"}
              </button>
              {showTagPicker && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {boardTags.map((tag) => {
                      const isAssigned = card?.tags?.some((t) => t.id === tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => handleToggleTag(tag.id)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                            isAssigned
                              ? "ring-2 ring-offset-1 ring-primary scale-105"
                              : "opacity-50 hover:opacity-75"
                          }`}
                          style={{
                            backgroundColor: tag.color,
                            color: "#fff",
                          }}
                        >
                          {tag.name} {isAssigned ? "✓" : "+"}
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Color:</span>
                    <div className="flex flex-wrap gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            selectedColor === color ? "border-primary scale-110" : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                      placeholder="Nueva etiqueta..."
                      className="flex-1 px-2 py-1 rounded border border-input bg-background text-xs"
                    />
                    <button
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                      className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs disabled:opacity-50"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}