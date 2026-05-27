import uuid

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import UserCreate


class UserRepository:
    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def create(db: Session, data: UserCreate, hashed_password: str) -> User:
        user = User(
            email=data.email,
            name=data.name,
            hashed_password=hashed_password,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update(db: Session, user_id: uuid.UUID, **kwargs) -> User | None:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_avatar(
        db: Session, user_id: uuid.UUID, avatar_url: str, avatar_public_id: str
    ) -> User | None:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        user.avatar_url = avatar_url
        user.avatar_public_id = avatar_public_id
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def remove_avatar(db: Session, user_id: uuid.UUID) -> User | None:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        user.avatar_url = None
        user.avatar_public_id = None
        db.commit()
        db.refresh(user)
        return user
