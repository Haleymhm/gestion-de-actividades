import uuid
from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import Base

class TaskAssignee(Base):
    __tablename__ = "task_assignees"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    card_id = Column(String, ForeignKey("cards.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    card = relationship("Card", back_populates="assignees")
    user = relationship("User", back_populates="assigned_tasks")

class Checklist(Base):
    __tablename__ = "checklists"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    card_id = Column(String, ForeignKey("cards.id"), nullable=False)
    content = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    card = relationship("Card", back_populates="checklists")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    card_id = Column(String, ForeignKey("cards.id"), nullable=False)
    file_url = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    card = relationship("Card", back_populates="attachments")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    card_id = Column(String, ForeignKey("cards.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    card = relationship("Card", back_populates="comments")
    user = relationship("User", back_populates="comments")
