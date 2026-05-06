export type Board = {
  id: string;
  title: string;
  owner_id: string;
  owner_username?: string | null;
  created_at?: string;
};

export type BoardCreate = {
  title: string;
};

export type BoardColumn = {
  id: string;
  board_id: string;
  title: string;
  order: number;
  cards?: Card[];
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  board_id: string;
};

export type Card = {
  id: string;
  column_id: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  order: number;
  assignees?: Array<{ id: string; user_id: string; email?: string | null; username?: string | null }>;
  checklists?: ChecklistItem[];
  comments?: Comment[];
  attachments?: Attachment[];
  tags?: Tag[];
};

export type CardCreate = {
  title: string;
  column_id: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  order?: number;
};

export type CardUpdate = {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  order?: number;
  column_id?: string;
};

export type ChecklistItem = {
  id: string;
  card_id: string;
  content: string;
  is_completed: boolean;
};

export type Comment = {
  id: string;
  card_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type Attachment = {
  id: string;
  card_id: string;
  filename: string;
  file_url: string;
};
