import uuid

from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


DEFAULT_CATEGORIES = [
    {"name": "Moradia", "color": "#6366f1", "icon": "home"},
    {"name": "Alimentação", "color": "#f59e0b", "icon": "utensils"},
    {"name": "Transporte", "color": "#3b82f6", "icon": "car"},
    {"name": "Saúde", "color": "#ef4444", "icon": "heart"},
    {"name": "Educação", "color": "#8b5cf6", "icon": "bookopen"},
    {"name": "Lazer", "color": "#ec4899", "icon": "gamepad2"},
    {"name": "Compras", "color": "#14b8a6", "icon": "shoppingbag"},
    {"name": "Outros", "color": "#64748b", "icon": "morehorizontal"},
]


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
    def seed_defaults(db: Session, user_id: uuid.UUID) -> list[Category]:
        existing = {
            name.lower()
            for (name,) in db.query(Category.name)
            .filter(Category.user_id == user_id)
            .all()
        }
        created = []
        for item in DEFAULT_CATEGORIES:
            if item["name"].lower() in existing:
                continue
            created.append(
                Category(
                    user_id=user_id,
                    name=item["name"],
                    color=item["color"],
                    icon=item["icon"],
                )
            )
        if created:
            db.add_all(created)
            db.flush()
        return created

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
