from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.board import Board, BoardMember
from app.models.kanban import ColumnModel
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.kanban import verify_column_access
from app.schemas.kanban import ColumnCreate, ColumnOut

router = APIRouter()

@router.post("/", response_model=ColumnOut, status_code=status.HTTP_201_CREATED)
def create_column(
    column_in: ColumnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    board = db.query(Board).filter(Board.id == column_in.board_id).first()
    if not board:
        raise HTTPException(404, "Tablero no encontrado")
        
    if current_user.global_role != "admin" and board.owner_id != current_user.id:
        is_member = db.query(BoardMember).filter(
            BoardMember.board_id == board.id, BoardMember.user_id == current_user.id
        ).first()
        if not is_member:
            raise HTTPException(403, "No tienes permiso para operar en el tablero")

    col = ColumnModel(title=column_in.title, order=column_in.order, board_id=column_in.board_id)
    db.add(col)
    db.commit()
    db.refresh(col)
    return col

@router.get("/", response_model=List[ColumnOut])
def get_columns(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(404, "Tablero no encontrado")
        
    if current_user.global_role != "admin" and board.owner_id != current_user.id:
        is_member = db.query(BoardMember).filter(
            BoardMember.board_id == board.id, BoardMember.user_id == current_user.id
        ).first()
        if not is_member:
            raise HTTPException(403, "Sin acceso al tablero")
            
    cols = db.query(ColumnModel).filter(ColumnModel.board_id == board_id).order_by(ColumnModel.order.asc()).all()
    return cols

@router.delete("/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(
    column: ColumnModel = Depends(verify_column_access),
    db: Session = Depends(get_db),
) -> None:
    db.delete(column)
    db.commit()
