from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User, GlobalRole
from app.models.board import Board, BoardMember

def get_board_or_404(board_id: str, db: Session = Depends(get_db)) -> Board:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Tablero no encontrado")
    return board

def verify_board_access(
    board: Board = Depends(get_board_or_404),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Board:
    """Verifica que el usuario sea el dueño, administrador general, o un miembro invitado"""
    if current_user.global_role == GlobalRole.ADMIN:
        return board
    if board.owner_id == current_user.id:
        return board
    
    is_member = db.query(BoardMember).filter(
        BoardMember.board_id == board.id,
        BoardMember.user_id == current_user.id
    ).first()

    if not is_member:
        raise HTTPException(status_code=403, detail="No tienes acceso a este tablero")
    
    return board

def verify_board_owner(
    board: Board = Depends(get_board_or_404),
    current_user: User = Depends(get_current_user),
) -> Board:
    """Riguroso: Solo el dueño o administrador general"""
    if current_user.global_role == GlobalRole.ADMIN:
        return board
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el propietario puede realizar esta acción")
    return board
