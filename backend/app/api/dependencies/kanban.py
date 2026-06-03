from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User, GlobalRole
from app.models.board import Board, BoardMember
from app.models.kanban import ColumnModel, Card
from app.models.task_details import TaskAssignee

def get_column_or_404(column_id: str, db: Session = Depends(get_db)) -> ColumnModel:
    column = db.query(ColumnModel).filter(ColumnModel.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Columna no encontrada")
    return column

def get_card_or_404(card_id: str, db: Session = Depends(get_db)) -> Card:
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return card

def verify_column_access(
    column: ColumnModel = Depends(get_column_or_404),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ColumnModel:
    if current_user.global_role == GlobalRole.ADMIN:
        return column
    
    board = db.query(Board).filter(Board.id == column.board_id).first()
    if board and board.owner_id == current_user.id:
        return column

    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == column.board_id,
        BoardMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(status_code=403, detail="No tienes acceso a modificar nada de este tablero")
    return column

def verify_card_edit_access(
    card: Card = Depends(get_card_or_404),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Card:
    """Rigorous: Solo owner, admin, o colaborador asignado especificamente a la tarjeta pueden editarla"""
    if current_user.global_role == GlobalRole.ADMIN:
        return card

    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == column.board_id).first() if column else None
    
    if board and board.owner_id == current_user.id:
        return card

    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == board.id,
        BoardMember.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="No tienes acceso a este tablero")

    is_assigned = db.query(TaskAssignee).filter(
        TaskAssignee.card_id == card.id,
        TaskAssignee.user_id == current_user.id
    ).first()

    if not is_assigned:
        raise HTTPException(status_code=403, detail="Permiso delegado insuficiente: Debes estar explícitamente asignado a esta tarjeta para editarla")
    return card

def verify_card_read_access(
    card: Card = Depends(get_card_or_404),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Card:
    """Colaboradores pueden 'ver' todas las tarjetas del tablero o interactuar cno comments."""
    if current_user.global_role == GlobalRole.ADMIN:
        return card

    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == column.board_id).first()
    
    if board.owner_id == current_user.id:
        return card

    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == board.id,
        BoardMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(status_code=403, detail="No tienes visión sobre este tablero")
    return card

def verify_board_ownership(
    card: Card = Depends(get_card_or_404),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Card:
    """Solo admin o Dueño del tablero pueden eliminar archivos adjuntos."""
    if current_user.global_role == GlobalRole.ADMIN:
        return card

    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == column.board_id).first()

    if not board or board.owner_id != current_user.id:
        raise HTTPException(403, detail="Solo el administrador o el Dueño del tablero puede realizar esta acción")
    return card

def verify_card_move_access(
    card: Card = Depends(get_card_or_404),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Card:
    """Permite mover tarjetas - solo requiere ser miembro del tablero o owner"""
    if current_user.global_role == GlobalRole.ADMIN:
        return card

    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == column.board_id).first() if column else None
    
    if board and board.owner_id == current_user.id:
        return card

    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == board.id,
        BoardMember.user_id == current_user.id
    ).first()
    
    if not is_member:
        raise HTTPException(403, detail="No tienes acceso a este tablero")
    return card

    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == column.board_id).first()

    if not board or board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el administrador o el dueño del tablero puede realizar esta acción")
    return card
