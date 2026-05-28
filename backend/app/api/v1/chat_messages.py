from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.message import MessagePageResponse, MessageResponse, MessageSend
from app.services.message_service import MessageService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/{chat_id}/messages", response_model=MessagePageResponse)
def list_messages(
    chat_id: str,
    cursor: str | None = None,
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = MessageService(db)
    return service.list_messages(chat_id, str(current_user.id), cursor, limit)


@router.get("/{chat_id}/messages/new", response_model=list[MessageResponse])
def list_new_messages(
    chat_id: str,
    after: str | None = None,
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = MessageService(db)
    return service.list_new_messages(chat_id, str(current_user.id), after, limit)


@router.post("/{chat_id}/messages", response_model=MessageResponse, status_code=201)
def send_message(
    chat_id: str,
    data: MessageSend,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = MessageService(db)
    return service.send_message(chat_id, str(current_user.id), data.content)


@router.post("/cleanup")
def cleanup_messages(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = MessageService(db)
    count = service.cleanup_expired()
    return {"deleted": count}
