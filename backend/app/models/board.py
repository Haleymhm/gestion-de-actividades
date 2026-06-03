import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class Board(Base):
    __tablename__ = "boards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="owned_boards")
    columns = relationship("ColumnModel", back_populates="board", cascade="all, delete-orphan")
    members = relationship("BoardMember", back_populates="board", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="board", cascade="all, delete-orphan")

class BoardMember(Base):
    __tablename__ = "board_members"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    board_id = Column(String, ForeignKey("boards.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    board = relationship("Board", back_populates="members")
    user = relationship("User", back_populates="board_memberships")
