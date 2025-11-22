from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from uuid import UUID
from database import cassandra as cassandra_db

router = APIRouter(prefix="/threads")

class ThreadCreate(BaseModel):
    course_id: str
    title: str
    author_id: str


@router.post("/")
def create_thread(data: ThreadCreate):
    return cassandra_db.crear_thread(data.course_id, data.title, data.author_id)


@router.get("/course/{course_id}")
def list_threads(course_id: str, limit: int = Query(50, ge=1, le=200)):
    return cassandra_db.listar_threads_por_curso(course_id, limit)


@router.get("/{thread_id}")
def get_thread(thread_id: str):
    try:
        thread_uuid = UUID(thread_id)
    except ValueError:
        raise HTTPException(400, "Invalid thread_id")

    data = cassandra_db.obtener_thread(thread_uuid)
    if not data:
        raise HTTPException(404, "Thread not found")
    return data


@router.get("/{thread_id}/posts")
def get_thread_posts(thread_id: str, limit: int = Query(50, ge=1, le=500)):
    try:
        thread_uuid = UUID(thread_id)
    except ValueError:
        raise HTTPException(400, "Invalid thread_id")
    return cassandra_db.obtener_posts_por_thread(thread_uuid, limit)
