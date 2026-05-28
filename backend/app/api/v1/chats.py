from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.chat import ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/", response_model=list[ChatResponse])
def list_chats(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ChatService(db)
    return service.list_chats(str(current_user.id))


@router.get("/{chat_id}", response_model=ChatResponse)
def get_chat(
    chat_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ChatService(db)
    return service.get_chat(chat_id, str(current_user.id))
