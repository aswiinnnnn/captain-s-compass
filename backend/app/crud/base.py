from typing import Generic, TypeVar, Type, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.base_class import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get_by_id(self, db: Session, id: UUID) -> Optional[ModelType]:
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: CreateSchemaType) -> ModelType:
        db_obj = self.model(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: ModelType, obj_in: UpdateSchemaType) -> ModelType:
        obj_data = obj_in.dict(exclude_unset=True)
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, db_obj: ModelType) -> Optional[ModelType]:
        if db_obj:
            db.delete(db_obj)
            db.commit()
            return db_obj
        return None

    def deactivate(self, db: Session, db_obj: ModelType) -> Optional[ModelType]:
        if db_obj:
            if hasattr(db_obj, "is_active"):
                db_obj.is_active = False
                db.add(db_obj)
                db.commit()
                db.refresh(db_obj)
            else:
                raise AttributeError(f"{self.model.__name__} has no attribute 'is_active'")
        return db_obj
    
    def reactivate(self, db: Session, db_obj: ModelType) -> Optional[ModelType]:
        if db_obj:
            if hasattr(db_obj, "is_active"):
                db_obj.is_active = True
                db.add(db_obj)
                db.commit()
                db.refresh(db_obj)
            else:
                raise AttributeError(f"{self.model.__name__} has no attribute 'is_active'")
        return db_obj
