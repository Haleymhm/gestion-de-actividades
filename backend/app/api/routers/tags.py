from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.kanban import Card, ColumnModel, Tag, card_tags
from app.models.board import Board, BoardMember
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.kanban import verify_card_edit_access
from app.schemas.kanban import TagCreate, TagUpdate, TagOut, CardOut

router = APIRouter()

def verify_board_access(board_id: str, db: Session, current_user: User) -> Board:
    if current_user.global_role == "admin":
        board = db.query(Board).filter(Board.id == board_id).first()
        if not board:
            raise HTTPException(404, "Tablero no encontrado")
        return board
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(404, "Tablero no encontrado")
    if board.owner_id == current_user.id:
        return board
    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == board_id,
        BoardMember.user_id == current_user.id
    ).first()
    if not is_member:
        raise HTTPException(403, "No tienes acceso a este tablero")
    return board

@router.get("/", response_model=List[TagOut])
def list_tags(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    verify_board_access(board_id, db, current_user)
    tags = db.query(Tag).filter(Tag.board_id == board_id).all()
    return tags

@router.post("/", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_in: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    board = verify_board_access(tag_in.board_id, db, current_user)
    tag = Tag(name=tag_in.name, color=tag_in.color, board_id=tag_in.board_id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

@router.put("/{tag_id}", response_model=TagOut)
def update_tag(
    tag_id: str,
    tag_in: TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(404, "Etiqueta no encontrada")
    verify_board_access(tag.board_id, db, current_user)
    if tag_in.name is not None:
        tag.name = tag_in.name
    if tag_in.color is not None:
        tag.color = tag_in.color
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(404, "Etiqueta no encontrada")
    verify_board_access(tag.board_id, db, current_user)
    db.delete(tag)
    db.commit()

@router.post("/cards/{card_id}/tags/{tag_id}", response_model=CardOut)
def assign_tag_to_card(
    card_id: str,
    tag_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(404, "Tarjeta no encontrada")
    verify_card_edit_access(card, current_user, db)
    
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(404, "Etiqueta no encontrada")
    
    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    if tag.board_id != column.board_id:
        raise HTTPException(400, "La etiqueta no pertenece al mismo tablero")
    
    existing = db.execute(
        select(card_tags).where(
            card_tags.c.card_id == card_id,
            card_tags.c.tag_id == tag_id
        )
    ).first()
    if existing:
        card = db.query(Card).options(joinedload(Card.tags)).filter(Card.id == card_id).first()
        return card
    
    stmt = card_tags.insert().values(card_id=card_id, tag_id=tag_id)
    db.execute(stmt)
    db.commit()
    
    card = db.query(Card).options(joinedload(Card.tags)).filter(Card.id == card_id).first()
    return card

@router.delete("/cards/{card_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_card(
    card_id: str,
    tag_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(404, "Tarjeta no encontrada")
    verify_card_edit_access(card, current_user, db)
    
    stmt = card_tags.delete().where(
        card_tags.c.card_id == card_id,
        card_tags.c.tag_id == tag_id
    )
    db.execute(stmt)
    db.commit()
