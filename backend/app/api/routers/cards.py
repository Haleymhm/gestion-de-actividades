import os
import shutil
import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.kanban import Card, ColumnModel
from app.models.board import Board, BoardMember
from app.models.task_details import TaskAssignee, Checklist, Comment, Attachment
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.kanban import verify_card_edit_access, verify_card_read_access, verify_board_ownership
from app.schemas.kanban import CardCreate, CardUpdate, CardOut, CoordinateAssignee, ChecklistItemCreate, ChecklistItemOut, ChecklistItemUpdate, CommentCreate, CommentUpdate, CommentOut, AttachmentOut

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

@router.delete("/{card_id}/assign/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_card(
    user_id: str,
    card: Card = Depends(verify_board_ownership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> None:
    existing = db.query(TaskAssignee).filter(
        TaskAssignee.card_id == card.id, TaskAssignee.user_id == user_id
    ).first()
    if not existing:
        raise HTTPException(404, "El usuario no está asignado a esta actividad")
    db.delete(existing)
    db.commit()

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

@router.put("/{card_id}/comments/{comment_id}", response_model=CommentOut)
def update_comment(
    comment_id: str,
    comment_in: CommentUpdate,
    card: Card = Depends(verify_card_read_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    cmt = db.query(Comment).filter(Comment.id == comment_id, Comment.card_id == card.id).first()
    if not cmt:
        raise HTTPException(404, "Comentario no encontrado")

    if current_user.global_role != "admin" and cmt.user_id != current_user.id:
        raise HTTPException(403, "No puedes editar un comentario que no es tuyo")

    if comment_in.content is not None:
        cmt.content = comment_in.content

    db.add(cmt)
    db.commit()
    db.refresh(cmt)
    return cmt

@router.delete("/{card_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: str,
    card: Card = Depends(verify_card_read_access),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> None:
    cmt = db.query(Comment).filter(Comment.id == comment_id, Comment.card_id == card.id).first()
    if not cmt:
        raise HTTPException(404, "Comentario no encontrado")
    
    if current_user.global_role != "admin" and cmt.user_id != current_user.id:
        raise HTTPException(403, "No puedes eliminar un comentario que no es tuyo")

    db.delete(cmt)
    db.commit()

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

@router.put("/{card_id}/checklists/{check_id}", response_model=ChecklistItemOut)
def update_checklist_item(
    check_id: str,
    check_in: ChecklistItemUpdate,
    card: Card = Depends(verify_card_edit_access),
    db: Session = Depends(get_db)
) -> Any:
    cli = db.query(Checklist).filter(Checklist.id == check_id, Checklist.card_id == card.id).first()
    if not cli:
        raise HTTPException(404, "Checklist item no encontrado")
    
    if check_in.content is not None:
        cli.content = check_in.content
    if check_in.is_completed is not None:
        cli.is_completed = check_in.is_completed

    db.add(cli)
    db.commit()
    db.refresh(cli)
    return cli

@router.delete("/{card_id}/checklists/{check_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist_item(
    check_id: str,
    card: Card = Depends(verify_card_edit_access),
    db: Session = Depends(get_db)
) -> None:
    cli = db.query(Checklist).filter(Checklist.id == check_id, Checklist.card_id == card.id).first()
    if not cli:
        raise HTTPException(404, "Checklist item no encontrado")
    db.delete(cli)
    db.commit()

@router.post("/{card_id}/attachments", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
def upload_attachment(
    card: Card = Depends(verify_card_edit_access),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Any:
    col = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == col.board_id).first()

    upload_dir = f"uploads/{board.id}/{card.id}"
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = f"{upload_dir}/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/{board.id}/{card.id}/{unique_filename}"

    att = Attachment(
        card_id=card.id,
        filename=file.filename,
        file_url=file_url
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att

@router.delete("/{card_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: str,
    card: Card = Depends(verify_board_ownership),
    db: Session = Depends(get_db)
) -> None:
    att = db.query(Attachment).filter(Attachment.id == attachment_id, Attachment.card_id == card.id).first()
    if not att:
        raise HTTPException(404, "Archivo adjunto no encontrado")
    
    col = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == col.board_id).first()

    file_path = f"uploads/{board.id}/{card.id}/{att.file_url.split('/')[-1]}"
    try:
        os.remove(file_path)
    except FileNotFoundError:
        pass

    db.delete(att)
    db.commit()