import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship
from .base import Base

class ColumnModel(Base):
    __tablename__ = "columns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    order = Column(Integer, nullable=False, default=0)
    board_id = Column(String, ForeignKey("boards.id"), nullable=False)

    board = relationship("Board", back_populates="columns")
    cards = relationship("Card", back_populates="column", cascade="all, delete-orphan")

class Card(Base):
    __tablename__ = "cards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    order = Column(Integer, nullable=False, default=0)
    column_id = Column(String, ForeignKey("columns.id"), nullable=False)

    column = relationship("ColumnModel", back_populates="cards")
    assignees = relationship("TaskAssignee", back_populates="card", cascade="all, delete-orphan")
    checklists = relationship("Checklist", back_populates="card", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="card", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="card", cascade="all, delete-orphan")
