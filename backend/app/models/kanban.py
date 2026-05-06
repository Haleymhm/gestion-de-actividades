import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Date, Table, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

card_tags = Table(
    "card_tags",
    Base.metadata,
    Column("card_id", String, ForeignKey("cards.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class ColumnModel(Base):
    __tablename__ = "columns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    order = Column(Integer, nullable=False, default=0)
    board_id = Column(String, ForeignKey("boards.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    board = relationship("Board", back_populates="columns")
    cards = relationship("Card", back_populates="column", cascade="all, delete-orphan")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    color = Column(String, nullable=False)
    board_id = Column(String, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    board = relationship("Board", back_populates="tags")
    cards = relationship("Card", secondary=card_tags, back_populates="tags")

class Card(Base):
    __tablename__ = "cards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    order = Column(Integer, nullable=False, default=0)
    column_id = Column(String, ForeignKey("columns.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    column = relationship("ColumnModel", back_populates="cards")
    assignees = relationship("TaskAssignee", back_populates="card", cascade="all, delete-orphan")
    checklists = relationship("Checklist", back_populates="card", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="card", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="card", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=card_tags, back_populates="cards")
