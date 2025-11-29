from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database.cassandra import (
    create_thread,
    list_threads_by_course,
    get_thread_metadata,
    create_post,
    list_posts_by_thread,
    list_posts_by_user,
)

router = APIRouter(prefix="/api", tags=["forum"])


class ThreadCreate(BaseModel):
    title: str
    author_id: str  # id de usuario (lo ideal sería sacarlo del token, pero bueno)


class ThreadCreateWithCourse(ThreadCreate):
    course_id: str


class PostCreate(BaseModel):
    user_id: str
    content: str


@router.get("/courses/{course_id}/threads")
def api_list_threads(course_id: str, limit: int = Query(20, le=100)):
    return list_threads_by_course(course_id, limit=limit)


@router.post("/courses/{course_id}/threads", status_code=201)
def api_create_thread(course_id: str, payload: ThreadCreate):
    return create_thread(
        course_id=course_id,
        title=payload.title,
        author_id=payload.author_id,
    )


@router.post("/threads", status_code=201)
def api_create_thread_body(payload: ThreadCreateWithCourse):
    """
    Variante para crear hilos con el course_id en el cuerpo (p/compatibilidad con el frontend).
    """
    return create_thread(
        course_id=payload.course_id,
        title=payload.title,
        author_id=payload.author_id,
    )


@router.get("/threads/{thread_id}")
def api_get_thread(thread_id: str):
    data = get_thread_metadata(thread_id)
    if not data:
        raise HTTPException(status_code=404, detail="Thread not found")
    return data


@router.get("/threads/{thread_id}/posts")
def api_list_posts(thread_id: str, limit: int = Query(100, le=500)):
    return list_posts_by_thread(thread_id, limit=limit)


@router.post("/threads/{thread_id}/posts", status_code=201)
def api_create_post(thread_id: str, payload: PostCreate):
    # podrías validar que el thread exista llamando a get_thread_metadata() antes
    return create_post(thread_id, payload.user_id, payload.content)


@router.get("/users/{user_id}/posts")
def api_list_posts_user(user_id: str, limit: int = Query(50, le=200)):
    return list_posts_by_user(user_id, limit=limit)
