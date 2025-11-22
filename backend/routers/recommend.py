from fastapi import APIRouter
from database.neo4j import registrar_progreso, recomendar
from pydantic import BaseModel

router = APIRouter(prefix="/recommend")

class Progress(BaseModel):
    user_id: str
    course_id: str
    level: str | None = None

@router.post("/progress")
def progress(data: Progress):
    registrar_progreso(data.user_id, data.course_id, data.level)
    return {"status": "ok"}

@router.get("/{user_id}")
def recommend_user(user_id: str):
    return recomendar(user_id)
