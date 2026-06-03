/** Respuesta de error típica de FastAPI / HTTP */
export type ApiErrorBody = {
  detail?: string | { msg: string; type?: string }[];
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};
