import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("kanban_access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("kanban_access_token")
      document.cookie = "kanban_access_token=; path=/; max-age=0"
    }
    return Promise.reject(error)
  }
)

import type { Board, BoardCreate, BoardColumn, Card, CardCreate, CardUpdate } from "@/types/kanban"

export const authApi = {
  searchUsers: (q: string) => 
    api.get<{id: string; email: string}[]>(`/api/auth/users?q=${encodeURIComponent(q)}`),
}

export const boardsApi = {
  list: () => api.get<Board[]>("/api/boards/"),
  
  get: (id: string) => api.get<Board>(`/api/boards/${id}`),
  
  create: (data: BoardCreate) => api.post<Board>("/api/boards/", data),
  
  delete: (id: string) => api.delete(`/api/boards/${id}`),
  
  getMembers: (boardId: string) => api.get<{id: string; user_id: string; email: string}[]>(`/api/boards/${boardId}/members`),
  
  addMember: (boardId: string, userId: string) => 
    api.post(`/api/boards/${boardId}/members`, { user_id: userId }),
  
  removeMember: (boardId: string, userId: string) => 
    api.delete(`/api/boards/${boardId}/members/${userId}`),
}

export const columnsApi = {
  list: (boardId: string) => api.get<BoardColumn[]>(`/api/columns/?board_id=${boardId}`),
  
  create: (boardId: string, title: string) => api.post<BoardColumn>("/api/columns/", { board_id: boardId, title, order: 0 }),
  
  update: (id: string, data: { title?: string; order?: number }) => api.put<BoardColumn>(`/api/columns/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/columns/${id}`),
}

export const cardsApi = {
  list: (columnId: string) => api.get<Card[]>(`/api/cards/?column_id=${columnId}`),
  
  get: (id: string) => api.get<Card>(`/api/cards/${id}`),
  
  create: (data: CardCreate) => api.post<Card>("/api/cards/", data),
  
  update: (id: string, data: CardUpdate) => api.patch<Card>(`/api/cards/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/cards/${id}`),

  addComment: (cardId: string, content: string) => 
    api.post(`/api/cards/${cardId}/comments`, { content }),

  addChecklistItem: (cardId: string, content: string) => 
    api.post(`/api/cards/${cardId}/checklists`, { content }),

  updateChecklistItem: (cardId: string, checkId: string, data: { is_completed: boolean }) => 
    api.put(`/api/cards/${cardId}/checklists/${checkId}`, data),

  deleteChecklistItem: (cardId: string, checkId: string) => 
    api.delete(`/api/cards/${cardId}/checklists/${checkId}`),

  uploadAttachment: (cardId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/api/cards/${cardId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteAttachment: (cardId: string, attachmentId: string) => 
    api.delete(`/api/cards/${cardId}/attachments/${attachmentId}`),

  assignUser: (cardId: string, userId: string) => 
    api.post(`/api/cards/${cardId}/assign`, { user_id: userId }),

  removeUser: (cardId: string, userId: string) => 
    api.delete(`/api/cards/${cardId}/assign/${userId}`),
}
