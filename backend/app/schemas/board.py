from pydantic import BaseModel
from typing import List, Optional

class BoardBase(BaseModel):
    title: str

class BoardCreate(BoardBase):
    pass

class BoardOut(BoardBase):
    id: str
    owner_id: str
    owner_username: Optional[str] = None

    model_config = {"from_attributes": True}

class BoardMemberCreate(BaseModel):
    user_id: str

class BoardMemberOut(BaseModel):
    id: str
    board_id: str
    user_id: str
    email: Optional[str] = None
    username: Optional[str] = None

    model_config = {"from_attributes": True}
