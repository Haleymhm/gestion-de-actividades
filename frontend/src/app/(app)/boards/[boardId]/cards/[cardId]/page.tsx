"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Calendar,
  User,
  Paperclip,
  CheckSquare,
  MessageSquare,
  Plus,
  Check,
} from "lucide-react";
import { boardsApi, cardsApi } from "@/lib/api";
import type { Card } from "@/types/kanban";

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.boardId as string;
  const cardId = params.cardId as string;

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newChecklist, setNewChecklist] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchCard();
  }, [boardId, cardId]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await cardsApi.update(cardId, {
        title,
        description,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta tarjeta?")) return;
    try {
      await cardsApi.delete(cardId);
      router.push(`/boards/${boardId}`);
    } catch (e) {
      console.error(e);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const completedChecklists = card?.checklists?.filter((c) => c.is_completed).length || 0;
  const totalChecklists = card?.checklists?.length || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/boards/${boardId}`)}
            className="p-2 rounded-md hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </button>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="text-2xl font-bold bg-transparent border-none outline-none w-full focus:ring-0"
              placeholder="Título de la tarea"
            />
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
                  onBlur={handleSave}
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                  placeholder="Agregar una descripción más detallada..."
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
                        style={{ width: `${(completedChecklists / totalChecklists) * 100}%` }}
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
                        className={`p-1 rounded ${
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
                        className="opacity-0 group-hover:opacity-100 p-1 text-destructive"
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
                    <span className="text-sm text-muted-foreground w-16">Inicio:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                      }}
                      onBlur={handleSave}
                      className="flex-1 px-2 py-1 rounded border border-input bg-background text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-16">Fin:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                      }}
                      onBlur={handleSave}
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
                <div className="space-y-1">
                  {card?.assignees?.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 p-2 rounded bg-muted/50"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                        {user.email?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-sm">{user.email}</span>
                    </div>
                  ))}
                  {(!card?.assignees || card.assignees.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      Sin asignar
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Paperclip className="size-4" />
                  Archivos
                </label>
                <div className="space-y-1">
                  {card?.attachments?.map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
                    >
<Paperclip className="size-4" />
                      <span className="text-sm truncate">{att.filename}</span>
                    </a>
                  ))}
                  {(!card?.attachments || card.attachments.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      Sin archivos
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}