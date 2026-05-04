from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel

class TaskAssigneeOut(BaseModel):
    id: str
    user_id: str
    email: Optional[str] = None
    model_config = {"from_attributes": True}

class CoordinateAssignee(BaseModel):
    user_id: str

class ChecklistItemBase(BaseModel):
    content: str

class ChecklistItemCreate(ChecklistItemBase):
    pass

class ChecklistItemUpdate(BaseModel):
    content: Optional[str] = None
    is_completed: Optional[bool] = None

class ChecklistItemOut(ChecklistItemBase):
    id: str
    is_completed: bool
    model_config = {"from_attributes": True}

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class CommentOut(CommentBase):
    id: str
    user_id: str
    created_at: datetime
    model_config = {"from_attributes": True}

class AttachmentOut(BaseModel):
    id: str
    filename: str
    file_url: str
    model_config = {"from_attributes": True}

class CardBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    order: int = 0

class CardCreate(CardBase):
    column_id: str

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    order: Optional[int] = None
    column_id: Optional[str] = None

class CardOut(CardBase):
    id: str
    column_id: str
    assignees: List[TaskAssigneeOut] = []
    checklists: List[ChecklistItemOut] = []
    attachments: List[AttachmentOut] = []
    comments: List[CommentOut] = []
    model_config = {"from_attributes": True}

class ColumnBase(BaseModel):
    title: str
    order: int = 0

class ColumnCreate(ColumnBase):
    board_id: str

class ColumnUpdate(BaseModel):
    title: Optional[str] = None
    order: Optional[int] = None

class ColumnOut(ColumnBase):
    id: str
    board_id: str
    cards: List[CardOut] = []
    model_config = {"from_attributes": True}
