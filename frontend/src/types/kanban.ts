/** Contratos orientativos para alinear el frontend con el backend */

export type BoardId = string;

export type ColumnId = string;

export type TaskId = string;

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: TaskId;
  board_id: BoardId;
  column_id: ColumnId;
  title: string;
  description?: string | null;
  status: TaskStatus;
  position: number;
  created_at: string;
  updated_at: string;
};

export type BoardColumn = {
  id: ColumnId;
  board_id: BoardId;
  title: string;
  position: number;
};

export type Board = {
  id: BoardId;
  name: string;
  description?: string | null;
  columns: BoardColumn[];
  created_at: string;
  updated_at: string;
};
