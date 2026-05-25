import uuid

from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository:
    @staticmethod
    def list_by_user(db: Session, user_id: uuid.UUID) -> list[Category]:
        return (
            db.query(Category)
            .filter(Category.user_id == user_id)
            .order_by(Category.name.asc())
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, category_id: uuid.UUID) -> Category | None:
        return db.query(Category).filter(Category.id == category_id).first()

    @staticmethod
    def create(db: Session, user_id: uuid.UUID, data: CategoryCreate) -> Category:
        cat = Category(
            user_id=user_id,
            name=data.name,
            color=data.color,
            icon=data.icon,
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return cat

    @staticmethod
    def update(db: Session, cat: Category, data: CategoryUpdate) -> Category:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(cat, key, value)
        db.commit()
        db.refresh(cat)
        return cat

    @staticmethod
    def delete(db: Session, cat: Category) -> None:
        db.delete(cat)
        db.commit()
