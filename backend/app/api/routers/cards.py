from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.kanban import Card, ColumnModel
from app.models.board import Board, BoardMember
from app.models.task_details import TaskAssignee, Checklist, Comment
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.kanban import verify_card_edit_access, verify_card_read_access
from app.schemas.kanban import CardCreate, CardUpdate, CardOut, CoordinateAssignee, ChecklistItemCreate, ChecklistItemOut, CommentCreate, CommentOut

router = APIRouter()

@router.post("/", response_model=CardOut, status_code=status.HTTP_201_CREATED)
def create_card(
    card_in: CardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    column = db.query(ColumnModel).filter(ColumnModel.id == card_in.column_id).first()
    if not column:
        raise HTTPException(404, "Columna no encontrada")
        
    board = db.query(Board).filter(Board.id == column.board_id).first()
    if current_user.global_role != "admin" and board.owner_id != current_user.id:
        is_member = db.query(BoardMember).filter(
            BoardMember.board_id == board.id, BoardMember.user_id == current_user.id
        ).first()
        if not is_member:
            raise HTTPException(403, "No puedes crear tarjetas en un tablero que no tienes acceso")

    card = Card(
        title=card_in.title,
        description=card_in.description,
        start_date=card_in.start_date,
        end_date=card_in.end_date,
        order=card_in.order,
        column_id=card_in.column_id
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card

@router.put("/{card_id}", response_model=CardOut)
def update_card(
    card_in: CardUpdate,
    card: Card = Depends(verify_card_edit_access),
    db: Session = Depends(get_db)
) -> Any:
    """
    Edita la información de la tarjeta o la mueve de columna (Drag & Drop)
    """
    for field, value in card_in.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    
    db.add(card)
    db.commit()
    db.refresh(card)
    return card

@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card: Card = Depends(verify_card_edit_access),
    db: Session = Depends(get_db)
) -> None:
    db.delete(card)
    db.commit()

@router.post("/{card_id}/assign", response_model=CardOut)
def assign_user_to_card(
    assignee_in: CoordinateAssignee,
    card: Card = Depends(verify_card_edit_access),
    db: Session = Depends(get_db)
) -> Any:
    col = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == col.board_id).first()
    
    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == board.id,
        BoardMember.user_id == assignee_in.user_id
    ).first()
    
    if board.owner_id != assignee_in.user_id and not is_member:
        raise HTTPException(400, "El usuario asignado no pertenece al tablero")
        
    existing = db.query(TaskAssignee).filter(
        TaskAssignee.card_id == card.id, TaskAssignee.user_id == assignee_in.user_id
    ).first()
    if not existing:
        ta = TaskAssignee(card_id=card.id, user_id=assignee_in.user_id)
        db.add(ta)
        db.commit()
        db.refresh(card)
    return card

@router.post("/{card_id}/comments", response_model=CommentOut)
def add_comment(
    comment_in: CommentCreate,
    card: Card = Depends(verify_card_read_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    cmt = Comment(
        card_id=card.id,
        user_id=current_user.id,
        content=comment_in.content
    )
    db.add(cmt)
    db.commit()
    db.refresh(cmt)
    return cmt

@router.post("/{card_id}/checklists", response_model=ChecklistItemOut)
def add_checklist_item(
    check_in: ChecklistItemCreate,
    card: Card = Depends(verify_card_edit_access),
    db: Session = Depends(get_db)
) -> Any:
    cli = Checklist(
        card_id=card.id,
        content=check_in.content
    )
    db.add(cli)
    db.commit()
    db.refresh(cli)
    return cli
