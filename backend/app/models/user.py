import uuid
from sqlalchemy import Column, String, Enum
from sqlalchemy.orm import relationship
import enum
from .base import Base

class GlobalRole(str, enum.Enum):
    ADMIN = "admin"
    STANDARD = "standard"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    global_role = Column(Enum(GlobalRole), default=GlobalRole.STANDARD)

    # Relationships
    owned_boards = relationship("Board", back_populates="owner")
    board_memberships = relationship("BoardMember", back_populates="user")
    assigned_tasks = relationship("TaskAssignee", back_populates="user")
    comments = relationship("Comment", back_populates="user")
