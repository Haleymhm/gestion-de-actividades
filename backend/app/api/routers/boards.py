from typing import Any, List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.board import Board, BoardMember
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.board import verify_board_access, verify_board_owner
from app.schemas.board import BoardCreate, BoardOut, BoardMemberCreate, BoardMemberOut

router = APIRouter()

@router.post("/", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
def create_board(
    board_in: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Crea un nuevo tablero. El usuario asume como owner automáticamente."""
    board = Board(
        title=board_in.title,
        owner_id=current_user.id
    )
    db.add(board)
    db.commit()
    db.refresh(board)
    return board

@router.get("/", response_model=List[BoardOut])
def read_boards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Obtiene todos los tableros del usuario (propios y en los que colabora)."""
    if current_user.global_role == "admin":
        boards = db.query(Board).all()
    else:
        owned_boards = db.query(Board).filter(Board.owner_id == current_user.id).all()
        
        member_records = db.query(BoardMember).filter(BoardMember.user_id == current_user.id).all()
        member_board_ids = [m.board_id for m in member_records]
        member_boards = db.query(Board).filter(Board.id.in_(member_board_ids)).all()
        
        # Merge evitando duplicados (con dictionary keys)
        boards_map = {b.id: b for b in owned_boards + member_boards}
        boards = list(boards_map.values())
    
    # Build result with owner_username
    result = []
    for board in boards:
        owner = db.query(User).filter(User.id == board.owner_id).first()
        result.append({
            "id": board.id,
            "title": board.title,
            "owner_id": board.owner_id,
            "owner_username": owner.username if owner else None,
            "created_at": board.created_at,
            "updated_at": board.updated_at,
        })
    return result

@router.get("/{board_id}", response_model=BoardOut)
def read_board(
    board: Board = Depends(verify_board_access),
    db: Session = Depends(get_db),
) -> Any:
    """Obtiene el detalle completo de un tablero (previa validación jerárquica de acceso)."""
    owner = db.query(User).filter(User.id == board.owner_id).first()
    result = {
        "id": board.id,
        "title": board.title,
        "owner_id": board.owner_id,
        "owner_username": owner.username if owner else None,
        "created_at": board.created_at,
        "updated_at": board.updated_at,
    }
    return result

@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board: Board = Depends(verify_board_owner),
    db: Session = Depends(get_db),
) -> None:
    """Elimina el tablero lógicamente. Requiere privilegios de owner/admin."""
    db.delete(board)
    db.commit()

@router.post("/{board_id}/members", response_model=BoardMemberOut)
def add_board_member(
    member_in: BoardMemberCreate,
    board: Board = Depends(verify_board_owner),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Invita a un usuario colaborador explícito al tablero."""
    invited_user = db.query(User).filter(User.id == member_in.user_id).first()
    if not invited_user:
        raise HTTPException(status_code=404, detail="El usuario invitado no existe")
        
    existing = db.query(BoardMember).filter(
        BoardMember.board_id == board.id,
        BoardMember.user_id == member_in.user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Este usuario ya es miembro del tablero")
        
    board_member = BoardMember(
        board_id=board.id,
        user_id=member_in.user_id
    )
    db.add(board_member)
    db.commit()
    db.refresh(board_member)
    return board_member

@router.get("/{board_id}/members", response_model=List[BoardMemberOut])
def get_board_members(
    board: Board = Depends(verify_board_access),
    db: Session = Depends(get_db),
) -> Any:
    """Obtiene los miembros de un tablero."""
    members = db.query(BoardMember).filter(BoardMember.board_id == board.id).all()
    
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        result.append({
            "id": m.id,
            "board_id": m.board_id,
            "user_id": m.user_id,
            "email": user.email if user else None,
            "username": user.username if user else None,
        })
    
    return result

@router.delete("/{board_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_board_member(
    user_id: str,
    board: Board = Depends(verify_board_owner),
    db: Session = Depends(get_db),
) -> None:
    """Elimina un miembro del tablero."""
    member = db.query(BoardMember).filter(
        BoardMember.board_id == board.id,
        BoardMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(404, detail="Miembro no encontrado")
    db.delete(member)
    db.commit()
